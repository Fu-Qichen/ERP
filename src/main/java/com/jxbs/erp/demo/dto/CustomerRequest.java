package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "客户编码不能为空")
        @Size(max = 32, message = "客户编码不能超过 32 个字符")
        String customerCode,

        @NotBlank(message = "客户名称不能为空")
        @Size(max = 128, message = "客户名称不能超过 128 个字符")
        String customerName,

        @NotNull(message = "客户分类不能为空")
        Long classId,

        Long staffId,

        @NotNull(message = "币种不能为空")
        Long currencyId,

        Long settleMethodId,

        Long payConditionId,

        Integer status
) {
}
