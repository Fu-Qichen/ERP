package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BomLineRequest(
        @NotNull(message = "子件不能为空")
        Long componentId,

        @NotNull(message = "用量不能为空")
        @DecimalMin(value = "0.000001", message = "用量必须大于 0")
        BigDecimal qty,

        @NotNull(message = "损耗率不能为空")
        @DecimalMin(value = "0.00", message = "损耗率不能小于 0")
        @DecimalMax(value = "100.00", message = "损耗率不能大于 100")
        BigDecimal lossRate
) {
}
