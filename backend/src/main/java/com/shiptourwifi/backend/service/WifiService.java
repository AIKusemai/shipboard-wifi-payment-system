package com.shiptourwifi.backend.service;

import com.shiptourwifi.backend.dto.WifiPlanDto;
import com.shiptourwifi.backend.dto.WifiPlanRequest;
import com.shiptourwifi.backend.dto.WifiSessionDto;
import com.shiptourwifi.backend.dto.WifiStatsDto;
import com.shiptourwifi.backend.model.WifiPlan;
import com.shiptourwifi.backend.model.WifiSession;
import com.shiptourwifi.backend.model.WifiSessionStatus;
import com.shiptourwifi.backend.repository.UserRepository;
import com.shiptourwifi.backend.repository.WifiPlanRepository;
import com.shiptourwifi.backend.repository.WifiSessionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WifiService {

    private static final Logger logger = LoggerFactory.getLogger(WifiService.class);
    private final Random random = new Random();

    private final WifiPlanRepository wifiPlanRepository;
    private final WifiSessionRepository wifiSessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<WifiPlanDto> getAvailablePlans() {
        ensureDefaultPlans();
        return wifiPlanRepository.findByActiveTrueOrderByPriceAsc().stream()
                .map(this::toPlanDto)
                .toList();
    }

    @Transactional
    public WifiSessionDto getCurrentSession(String userEmail) {
        refreshUserSessions(userEmail);
        return wifiSessionRepository.findFirstByUserEmailOrderByStartTimeDesc(userEmail)
                .map(this::toSessionDto)
                .orElse(null);
    }

    @Transactional
    public WifiSessionDto purchasePlan(String userEmail, Long planId) {
        ensureDefaultPlans();
        WifiPlan plan = wifiPlanRepository.findById(planId)
                .filter(WifiPlan::getActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WiFi plan not found"));

        disconnectActiveSessions(userEmail);

        LocalDateTime startTime = LocalDateTime.now();
        WifiSession session = WifiSession.builder()
                .userEmail(userEmail)
                .plan(plan)
                .startTime(startTime)
                .endTime(startTime.plusMinutes(plan.getDurationMinutes()))
                .dataLimitMb(plan.getDataLimitMb())
                .usedDataMb(0)
                .status(WifiSessionStatus.ACTIVE)
                .accessToken(createAccessToken())
                .build();

        return toSessionDto(wifiSessionRepository.save(session));
    }

    @Transactional
    public WifiSessionDto addUsage(String userEmail, Long sessionId, Integer usedMb) {
        refreshUserSessions(userEmail);

        WifiSession session = wifiSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WiFi session not found"));

        if (!session.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update another user's session");
        }

        WifiSession refreshed = refreshSessionStatus(session);
        if (refreshed.getStatus() != WifiSessionStatus.ACTIVE) {
            return toSessionDto(refreshed);
        }

        int nextUsage = Math.max(1, Math.min(usedMb == null ? 5 : usedMb, 50));
        refreshed.setUsedDataMb(Math.min(refreshed.getDataLimitMb(), refreshed.getUsedDataMb() + nextUsage));
        refreshed = refreshSessionStatus(refreshed);

        return toSessionDto(wifiSessionRepository.save(refreshed));
    }

    @Transactional
    public List<WifiSessionDto> getAllSessions() {
        refreshAllActiveSessions();
        return wifiSessionRepository.findAll().stream()
                .sorted((left, right) -> right.getStartTime().compareTo(left.getStartTime()))
                .map(this::toSessionDto)
                .toList();
    }

    @Transactional
    public WifiSessionDto disconnectSession(Long sessionId) {
        WifiSession session = wifiSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WiFi session not found"));

        session.setStatus(WifiSessionStatus.DISCONNECTED);
        return toSessionDto(wifiSessionRepository.save(session));
    }

    /**
     * Server-side traffic simulation: runs every 5 seconds to simulate
     * real-world data usage for all active sessions.
     * Each tick adds 3–15 MB of randomized usage per active session,
     * and checks for time-based expiry and data-cap exhaustion.
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void simulateTraffic() {
        List<WifiSession> activeSessions = wifiSessionRepository.findByStatusOrderByStartTimeDesc(WifiSessionStatus.ACTIVE);
        if (activeSessions.isEmpty()) {
            return;
        }

        for (WifiSession session : activeSessions) {
            WifiSessionStatus before = session.getStatus();

            // Simulate 3–15 MB of random usage per tick
            int usageThisTick = 3 + random.nextInt(13);
            int newUsed = Math.min(session.getDataLimitMb(), session.getUsedDataMb() + usageThisTick);
            session.setUsedDataMb(newUsed);

            // Re-evaluate status (time expiry + data cap)
            refreshSessionStatus(session);

            if (before != session.getStatus()) {
                logger.info("Session {} ({}) status changed: {} -> {} (used {}/{} MB)",
                        session.getId(), session.getUserEmail(),
                        before, session.getStatus(),
                        session.getUsedDataMb(), session.getDataLimitMb());
            }
        }

        wifiSessionRepository.saveAll(activeSessions);
    }

    // ===== Admin Plan Management =====

    @Transactional
    public WifiPlanDto createPlan(WifiPlanRequest request) {
        WifiPlan plan = WifiPlan.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationMinutes(request.getDurationMinutes())
                .dataLimitMb(request.getDataLimitMb())
                .active(true)
                .build();
        return toPlanDto(wifiPlanRepository.save(plan));
    }

    @Transactional
    public WifiPlanDto updatePlan(Long planId, WifiPlanRequest request) {
        WifiPlan plan = wifiPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "套餐不存在"));
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setPrice(request.getPrice());
        plan.setDurationMinutes(request.getDurationMinutes());
        plan.setDataLimitMb(request.getDataLimitMb());
        return toPlanDto(wifiPlanRepository.save(plan));
    }

    @Transactional
    public WifiPlanDto togglePlan(Long planId) {
        WifiPlan plan = wifiPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "套餐不存在"));
        plan.setActive(!plan.getActive());
        return toPlanDto(wifiPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public List<WifiPlanDto> getAllPlans() {
        ensureDefaultPlans();
        return wifiPlanRepository.findAll().stream()
                .map(this::toPlanDto)
                .toList();
    }

    // ===== Admin Stats =====

    @Transactional(readOnly = true)
    public WifiStatsDto getStats() {
        List<WifiSession> allSessions = wifiSessionRepository.findAll();
        List<WifiSession> activeSessions = wifiSessionRepository.findByStatusOrderByStartTimeDesc(WifiSessionStatus.ACTIVE);

        long totalRevenue = allSessions.stream()
                .filter(session -> session.getPaymentStatus() == WifiSession.PaymentStatus.PAID)
                .mapToLong(s -> s.getPlan().getPrice())
                .sum();
        long totalDataUsed = allSessions.stream()
                .mapToLong(WifiSession::getUsedDataMb)
                .sum();

        return WifiStatsDto.builder()
                .activeSessions(activeSessions.size())
                .totalSessions(allSessions.size())
                .totalUsers(userRepository.count())
                .totalRevenue(totalRevenue)
                .totalDataUsedMb(totalDataUsed)
                .totalPlans(wifiPlanRepository.count())
                .activePlans(wifiPlanRepository.findByActiveTrueOrderByPriceAsc().size())
                .build();
    }

    // ===== Payment Status =====

    @Transactional
    public WifiSessionDto updatePaymentStatus(Long sessionId, WifiSession.PaymentStatus status) {
        WifiSession session = wifiSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "会话不存在"));
        session.setPaymentStatus(status);
        return toSessionDto(wifiSessionRepository.save(session));
    }

    private void ensureDefaultPlans() {
        if (wifiPlanRepository.count() > 0) {
            return;
        }

        wifiPlanRepository.saveAll(List.of(
                WifiPlan.builder()
                        .name("轻量体验包")
                        .description("适合短时联网、消息收发与基础网页浏览。")
                        .price(12)
                        .durationMinutes(15)
                        .dataLimitMb(80)
                        .active(true)
                        .build(),
                WifiPlan.builder()
                        .name("标准畅游包")
                        .description("适合日常浏览、地图查询与社交软件使用。")
                        .price(36)
                        .durationMinutes(120)
                        .dataLimitMb(512)
                        .active(true)
                        .build(),
                WifiPlan.builder()
                        .name("长时尊享包")
                        .description("适合较长时段上网、影音娱乐与移动办公。")
                        .price(88)
                        .durationMinutes(360)
                        .dataLimitMb(2048)
                        .active(true)
                        .build()
        ));
    }

    private void disconnectActiveSessions(String userEmail) {
        List<WifiSession> sessions = wifiSessionRepository.findByUserEmailOrderByStartTimeDesc(userEmail);
        sessions.stream()
                .filter(session -> session.getStatus() == WifiSessionStatus.ACTIVE)
                .forEach(session -> session.setStatus(WifiSessionStatus.DISCONNECTED));
        wifiSessionRepository.saveAll(sessions);
    }

    private void refreshUserSessions(String userEmail) {
        List<WifiSession> sessions = wifiSessionRepository.findByUserEmailOrderByStartTimeDesc(userEmail);
        refreshSessions(sessions);
    }

    private void refreshAllActiveSessions() {
        refreshSessions(wifiSessionRepository.findByStatusOrderByStartTimeDesc(WifiSessionStatus.ACTIVE));
    }

    private void refreshSessions(List<WifiSession> sessions) {
        boolean changed = false;
        for (WifiSession session : sessions) {
            WifiSessionStatus before = session.getStatus();
            refreshSessionStatus(session);
            if (before != session.getStatus()) {
                changed = true;
            }
        }

        if (changed) {
            wifiSessionRepository.saveAll(sessions);
        }
    }

    private WifiSession refreshSessionStatus(WifiSession session) {
        if (session.getStatus() != WifiSessionStatus.ACTIVE) {
            return session;
        }

        if (session.getEndTime().isBefore(LocalDateTime.now()) || session.getEndTime().isEqual(LocalDateTime.now())) {
            session.setStatus(WifiSessionStatus.EXPIRED);
            return session;
        }

        if (session.getUsedDataMb() >= session.getDataLimitMb()) {
            session.setStatus(WifiSessionStatus.USED_UP);
        }

        return session;
    }

    private WifiPlanDto toPlanDto(WifiPlan plan) {
        return WifiPlanDto.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .price(plan.getPrice())
                .durationMinutes(plan.getDurationMinutes())
                .dataLimitMb(plan.getDataLimitMb())
                .active(plan.getActive())
                .build();
    }

    private WifiSessionDto toSessionDto(WifiSession session) {
        return WifiSessionDto.builder()
                .id(session.getId())
                .userEmail(session.getUserEmail())
                .plan(toPlanDto(session.getPlan()))
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .dataLimitMb(session.getDataLimitMb())
                .usedDataMb(session.getUsedDataMb())
                .status(session.getStatus())
                .paymentStatus(session.getPaymentStatus().name())
                .accessToken(session.getAccessToken())
                .build();
    }

    private String createAccessToken() {
        return "WIFI-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}
