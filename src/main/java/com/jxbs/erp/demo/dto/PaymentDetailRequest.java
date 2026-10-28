package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PaymentDetailRequest(
        @NotNull(message = "应付单不能为空")
        Long payableId,

        @NotNull(message = "核销金额不能为空")
        @DecimalMin(value = "0.000001", message = "核销金额必须大于 0")
        BigDecimal amount
) {
}
