package com.ticketblitz.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wifi_sessions")
public class WifiSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id")
    private WifiPlan plan;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private int dataLimitMb;

    @Builder.Default
    private int usedDataMb = 0;

    @Enumerated(EnumType.STRING)
    private WifiSessionStatus status;

    @Column(unique = true)
    private String accessToken;
}
