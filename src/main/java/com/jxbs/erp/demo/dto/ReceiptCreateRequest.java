package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReceiptCreateRequest(
        @NotNull(message = "客户不能为空")
        Long customerId,

        @NotNull(message = "收款日期不能为空")
        LocalDate receiptDate,

        Long settleMethodId,

        @NotNull(message = "收款金额不能为空")
        @DecimalMin(value = "0.000001", message = "收款金额必须大于 0")
        BigDecimal amount,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "核销明细不能为空")
        @Valid
        List<ReceiptDetailRequest> details
) {
}
