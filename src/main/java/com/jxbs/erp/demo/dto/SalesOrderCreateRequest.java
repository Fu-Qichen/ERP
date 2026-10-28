package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record SalesOrderCreateRequest(
        @NotNull(message = "客户不能为空")
        Long customerId,

        @NotNull(message = "仓库不能为空")
        Long warehouseId,

        @NotNull(message = "订单日期不能为空")
        LocalDate orderDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "订单明细不能为空")
        @Valid
        List<SalesOrderLineRequest> lines
) {
}
