package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record PurchaseReceiptCreateRequest(
        @NotNull(message = "采购订单不能为空")
        Long orderId,

        @NotNull(message = "收货日期不能为空")
        LocalDate receiptDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "收货明细不能为空")
        @Valid
        List<PurchaseReceiptLineRequest> lines
) {
}
