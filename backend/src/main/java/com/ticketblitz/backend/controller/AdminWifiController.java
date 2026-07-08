package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.WifiSession;
import com.ticketblitz.backend.service.WifiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/wifi")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWifiController {

    private final WifiService wifiService;

    @GetMapping("/sessions")
    public ResponseEntity<List<WifiSession>> getAllSessions() {
        return ResponseEntity.ok(wifiService.getAllSessionsForAdmin());
    }

    @PostMapping("/sessions/{id}/disconnect")
    public ResponseEntity<WifiSession> disconnectSession(@PathVariable Long id) {
        return ResponseEntity.ok(wifiService.disconnectSession(id));
    }
}
