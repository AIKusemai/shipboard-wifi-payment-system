package com.shiptourwifi.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WifiPlanRequest {

    @NotBlank(message = "套餐名称不能为空")
    private String name;

    @NotBlank(message = "套餐描述不能为空")
    private String description;

    @NotNull(message = "价格不能为空")
    @Min(value = 1, message = "价格必须大于0")
    private Integer price;

    @NotNull(message = "时长不能为空")
    @Min(value = 1, message = "时长必须大于0分钟")
    private Integer durationMinutes;

    @NotNull(message = "流量上限不能为空")
    @Min(value = 1, message = "流量上限必须大于0MB")
    private Integer dataLimitMb;
}
