package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PurchaseReceiptLineRequest(
        @NotNull(message = "订单明细不能为空")
        Long orderLineId,

        @NotNull(message = "收货数量不能为空")
        @DecimalMin(value = "0.000001", message = "收货数量必须大于 0")
        BigDecimal quantity,

        Long batchId,

        String batchNo
) {
}
