package com.shiptourwifi.backend.controller;

import com.shiptourwifi.backend.dto.WifiPlanDto;
import com.shiptourwifi.backend.dto.WifiPlanRequest;
import com.shiptourwifi.backend.dto.WifiSessionDto;
import com.shiptourwifi.backend.dto.WifiStatsDto;
import com.shiptourwifi.backend.model.WifiSession;
import com.shiptourwifi.backend.service.WifiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/wifi")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWifiController {

    private final WifiService wifiService;

    // ===== Session Management =====

    @GetMapping("/sessions")
    public ResponseEntity<List<WifiSessionDto>> getAllSessions() {
        return ResponseEntity.ok(wifiService.getAllSessions());
    }

    @PostMapping("/sessions/{sessionId}/disconnect")
    public ResponseEntity<WifiSessionDto> disconnectSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(wifiService.disconnectSession(sessionId));
    }

    @PostMapping("/sessions/{sessionId}/payment")
    public ResponseEntity<WifiSessionDto> updatePaymentStatus(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body
    ) {
        String rawStatus = body.get("status");
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "缺少支付状态");
        }

        try {
            WifiSession.PaymentStatus status = WifiSession.PaymentStatus.valueOf(rawStatus.trim().toUpperCase());
            return ResponseEntity.ok(wifiService.updatePaymentStatus(sessionId, status));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "无效的支付状态: " + rawStatus);
        }
    }

    // ===== Plan CRUD =====

    @GetMapping("/plans")
    public ResponseEntity<List<WifiPlanDto>> getAllPlans() {
        return ResponseEntity.ok(wifiService.getAllPlans());
    }

    @PostMapping("/plans")
    public ResponseEntity<WifiPlanDto> createPlan(@Valid @RequestBody WifiPlanRequest request) {
        return ResponseEntity.ok(wifiService.createPlan(request));
    }

    @PutMapping("/plans/{planId}")
    public ResponseEntity<WifiPlanDto> updatePlan(
            @PathVariable Long planId,
            @Valid @RequestBody WifiPlanRequest request
    ) {
        return ResponseEntity.ok(wifiService.updatePlan(planId, request));
    }

    @PostMapping("/plans/{planId}/toggle")
    public ResponseEntity<WifiPlanDto> togglePlan(@PathVariable Long planId) {
        return ResponseEntity.ok(wifiService.togglePlan(planId));
    }

    // ===== Dashboard Stats =====

    @GetMapping("/stats")
    public ResponseEntity<WifiStatsDto> getStats() {
        return ResponseEntity.ok(wifiService.getStats());
    }
}
