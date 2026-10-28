package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record DeliveryCreateRequest(
        @NotNull(message = "销售订单不能为空")
        Long orderId,

        @NotNull(message = "发货日期不能为空")
        LocalDate deliveryDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "发货明细不能为空")
        @Valid
        List<DeliveryLineRequest> lines
) {
}
