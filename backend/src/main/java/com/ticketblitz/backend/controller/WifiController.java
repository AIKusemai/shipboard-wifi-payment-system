package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.WifiPlan;
import com.ticketblitz.backend.model.WifiSession;
import com.ticketblitz.backend.service.WifiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wifi")
@RequiredArgsConstructor
public class WifiController {

    private final WifiService wifiService;

    @GetMapping("/plans")
    public ResponseEntity<List<WifiPlan>> getPlans() {
        return ResponseEntity.ok(wifiService.getActivePlans());
    }

    @PostMapping("/purchase")
    public ResponseEntity<WifiSession> purchasePlan(
            @RequestBody WifiPurchaseRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(wifiService.purchasePlan(userEmail, request.getPlanId()));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getCurrentStatus(Authentication authentication) {
        String userEmail = authentication.getName();
        return wifiService.getCurrentSession(userEmail)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("status", "NO_SESSION")));
    }

    @PostMapping("/usage")
    public ResponseEntity<WifiSession> addUsage(
            @RequestBody WifiUsageRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(wifiService.addUsage(userEmail, request.getUsedMb()));
    }

    @Data
    public static class WifiPurchaseRequest {
        private Long planId;
    }

    @Data
    public static class WifiUsageRequest {
        private Integer usedMb;
    }
}
