package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WorkOrderRequest(
        @NotNull(message = "成品不能为空")
        Long productId,

        @NotNull(message = "BOM 不能为空")
        Long bomId,

        @NotNull(message = "仓库不能为空")
        Long warehouseId,

        @NotNull(message = "计划数量不能为空")
        @DecimalMin(value = "0.000001", message = "计划数量必须大于 0")
        BigDecimal planQty,

        @NotNull(message = "开工日期不能为空")
        LocalDate orderDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark
) {
}
