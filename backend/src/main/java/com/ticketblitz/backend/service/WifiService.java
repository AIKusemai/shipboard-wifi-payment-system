package com.ticketblitz.backend.service;

import com.ticketblitz.backend.model.WifiPlan;
import com.ticketblitz.backend.model.WifiSession;
import com.ticketblitz.backend.model.WifiSessionStatus;
import com.ticketblitz.backend.repository.WifiPlanRepository;
import com.ticketblitz.backend.repository.WifiSessionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WifiService {

    private final WifiPlanRepository wifiPlanRepository;
    private final WifiSessionRepository wifiSessionRepository;

    @PostConstruct
    public void seedDefaultPlans() {
        if (wifiPlanRepository.count() > 0) {
            return;
        }

        wifiPlanRepository.saveAll(List.of(
                WifiPlan.builder()
                        .name("Basic Wi-Fi")
                        .description("Demo package: 1 minute access for messaging and light browsing.")
                        .price(20)
                        .durationMinutes(1)
                        .dataLimitMb(30)
                        .active(true)
                        .build(),

                WifiPlan.builder()
                        .name("Standard Wi-Fi")
                        .description("Demo package: 3 minutes access for browsing, social media, and email.")
                        .price(50)
                        .durationMinutes(3)
                        .dataLimitMb(100)
                        .active(true)
                        .build(),

                WifiPlan.builder()
                        .name("Premium Voyage Wi-Fi")
                        .description("Demo package: 5 minutes access with larger data allowance for long trips.")
                        .price(100)
                        .durationMinutes(5)
                        .dataLimitMb(300)
                        .active(true)
                        .build()
        ));
    }

    public List<WifiPlan> getActivePlans() {
        return wifiPlanRepository.findByActiveTrueOrderByPriceAsc();
    }

    @Transactional
    public WifiSession purchasePlan(String userEmail, Long planId) {
        WifiPlan plan = wifiPlanRepository.findById(planId)
                .filter(WifiPlan::isActive)
                .orElseThrow(() -> new RuntimeException("Wi-Fi plan not found or inactive"));

        List<WifiSession> oldActiveSessions = wifiSessionRepository.findByUserEmailAndStatus(
                userEmail,
                WifiSessionStatus.ACTIVE
        );

        for (WifiSession oldSession : oldActiveSessions) {
            WifiSession refreshed = refreshStatusAndSave(oldSession);

            if (refreshed.getStatus() == WifiSessionStatus.ACTIVE) {
                refreshed.setStatus(WifiSessionStatus.DISCONNECTED);
                wifiSessionRepository.save(refreshed);
            }
        }

        LocalDateTime now = LocalDateTime.now();

        WifiSession session = WifiSession.builder()
                .userEmail(userEmail)
                .plan(plan)
                .startTime(now)
                .endTime(now.plusMinutes(plan.getDurationMinutes()))
                .dataLimitMb(plan.getDataLimitMb())
                .usedDataMb(0)
                .status(WifiSessionStatus.ACTIVE)
                .accessToken(generateAccessToken())
                .build();

        return wifiSessionRepository.save(session);
    }

    @Transactional
    public Optional<WifiSession> getCurrentSession(String userEmail) {
        return wifiSessionRepository.findTopByUserEmailOrderByStartTimeDesc(userEmail)
                .map(this::refreshStatusAndSave);
    }

    @Transactional
    public WifiSession addUsage(String userEmail, Integer usedMb) {
        WifiSession session = wifiSessionRepository.findTopByUserEmailOrderByStartTimeDesc(userEmail)
                .orElseThrow(() -> new RuntimeException("No Wi-Fi session found"));

        session = refreshStatusAndSave(session);

        if (session.getStatus() != WifiSessionStatus.ACTIVE) {
            return session;
        }

        int safeUsedMb = normalizeUsage(usedMb);

        int currentUsed = session.getUsedDataMb();
        int dataLimit = session.getDataLimitMb();

        if (dataLimit <= 0) {
            session.setStatus(WifiSessionStatus.USED_UP);
            return wifiSessionRepository.save(session);
        }

        int nextUsed = Math.min(dataLimit, currentUsed + safeUsedMb);
        session.setUsedDataMb(nextUsed);

        return refreshStatusAndSave(session);
    }

    @Transactional
    public List<WifiSession> getAllSessionsForAdmin() {
        List<WifiSession> sessions = wifiSessionRepository.findAllByOrderByStartTimeDesc();

        for (WifiSession session : sessions) {
            refreshStatusAndSave(session);
        }

        return sessions;
    }

    @Transactional
    public WifiSession disconnectSession(Long sessionId) {
        WifiSession session = wifiSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Wi-Fi session not found"));

        session.setStatus(WifiSessionStatus.DISCONNECTED);
        return wifiSessionRepository.save(session);
    }

    private WifiSession refreshStatusAndSave(WifiSession session) {
        if (session.getStatus() != WifiSessionStatus.ACTIVE) {
            return session;
        }

        LocalDateTime now = LocalDateTime.now();

        if (session.getEndTime() != null && now.isAfter(session.getEndTime())) {
            session.setStatus(WifiSessionStatus.EXPIRED);
            return wifiSessionRepository.save(session);
        }

        int usedDataMb = session.getUsedDataMb();
        int dataLimitMb = session.getDataLimitMb();

        if (dataLimitMb <= 0 || usedDataMb >= dataLimitMb) {
            session.setStatus(WifiSessionStatus.USED_UP);
            return wifiSessionRepository.save(session);
        }

        return session;
    }

    private int normalizeUsage(Integer usedMb) {
        if (usedMb == null) {
            return 5;
        }

        if (usedMb < 1) {
            return 1;
        }

        return Math.min(usedMb, 50);
    }

    private String generateAccessToken() {
        return "WIFI_" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 16)
                .toUpperCase();
    }
}