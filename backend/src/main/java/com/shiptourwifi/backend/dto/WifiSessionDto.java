package com.shiptourwifi.backend.dto;

import com.shiptourwifi.backend.model.WifiSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WifiSessionDto {
    private Long id;
    private String userEmail;
    private WifiPlanDto plan;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer dataLimitMb;
    private Integer usedDataMb;
    private WifiSessionStatus status;
    private String paymentStatus;
    private String accessToken;
}
