package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PurchaseInvoiceCreateRequest(
        @NotNull(message = "收货单不能为空")
        Long receiptId,

        @NotNull(message = "开票日期不能为空")
        LocalDate invoiceDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark
) {
}
