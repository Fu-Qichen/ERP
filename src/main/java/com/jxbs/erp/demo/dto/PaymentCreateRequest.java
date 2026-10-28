package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PaymentCreateRequest(
        @NotNull(message = "供应商不能为空")
        Long supplierId,

        @NotNull(message = "付款日期不能为空")
        LocalDate paymentDate,

        Long settleMethodId,

        @NotNull(message = "付款金额不能为空")
        @DecimalMin(value = "0.000001", message = "付款金额必须大于 0")
        BigDecimal amount,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "核销明细不能为空")
        @Valid
        List<PaymentDetailRequest> details
) {
}
