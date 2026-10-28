package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ReportRequest(
        @NotNull(message = "报工数量不能为空")
        @DecimalMin(value = "0.000001", message = "报工数量必须大于 0")
        BigDecimal qty,

        String batchNo
) {
}
