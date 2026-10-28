package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PayConditionRequest(
        @NotBlank(message = "付款条件编码不能为空")
        @Size(max = 32, message = "付款条件编码不能超过 32 个字符")
        String conditionCode,

        @NotBlank(message = "付款条件名称不能为空")
        @Size(max = 64, message = "付款条件名称不能超过 64 个字符")
        String conditionName,

        @NotNull(message = "账期天数不能为空")
        @Min(value = 0, message = "账期天数不能小于 0")
        Integer days,

        Integer status
) {
}
