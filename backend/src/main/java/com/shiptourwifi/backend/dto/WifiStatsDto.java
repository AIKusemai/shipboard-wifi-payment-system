package com.shiptourwifi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WifiStatsDto {
    private long activeSessions;
    private long totalSessions;
    private long totalUsers;
    private long totalRevenue;
    private long totalDataUsedMb;
    private long totalPlans;
    private long activePlans;
}
