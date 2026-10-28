package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PurchaseOrderLineRequest(
        @NotNull(message = "物料不能为空")
        Long materialId,

        @NotNull(message = "数量不能为空")
        @DecimalMin(value = "0.000001", message = "数量必须大于 0")
        BigDecimal quantity,

        @NotNull(message = "含税单价不能为空")
        @DecimalMin(value = "0.00", message = "含税单价不能小于 0")
        BigDecimal taxUnitPrice,

        @NotNull(message = "税率不能为空")
        @DecimalMin(value = "0.00", message = "税率不能小于 0")
        @DecimalMax(value = "100.00", message = "税率不能大于 100")
        BigDecimal taxRate
) {
}
