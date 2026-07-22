package com.shiptourwifi.backend.controller;

import com.shiptourwifi.backend.dto.WifiPlanDto;
import com.shiptourwifi.backend.dto.WifiPurchaseRequest;
import com.shiptourwifi.backend.dto.WifiSessionDto;
import com.shiptourwifi.backend.dto.WifiUsageRequest;
import com.shiptourwifi.backend.service.WifiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wifi")
@RequiredArgsConstructor
public class WifiController {

    private final WifiService wifiService;

    @GetMapping("/plans")
    public ResponseEntity<List<WifiPlanDto>> getPlans() {
        return ResponseEntity.ok(wifiService.getAvailablePlans());
    }

    @GetMapping("/sessions/current")
    public ResponseEntity<WifiSessionDto> getCurrentSession(Authentication authentication) {
        return ResponseEntity.ok(wifiService.getCurrentSession(authentication.getName()));
    }

    @PostMapping("/purchase")
    public ResponseEntity<WifiSessionDto> purchasePlan(
            Authentication authentication,
            @RequestBody WifiPurchaseRequest request
    ) {
        return ResponseEntity.ok(wifiService.purchasePlan(authentication.getName(), request.getPlanId()));
    }

    @PostMapping("/sessions/{sessionId}/usage")
    public ResponseEntity<WifiSessionDto> addUsage(
            Authentication authentication,
            @PathVariable Long sessionId,
            @RequestBody(required = false) WifiUsageRequest request
    ) {
        Integer usedMb = request == null ? null : request.getUsedMb();
        return ResponseEntity.ok(wifiService.addUsage(authentication.getName(), sessionId, usedMb));
    }
}
