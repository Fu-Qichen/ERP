package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SettleMethodRequest(
        @NotBlank(message = "结算方式编码不能为空")
        @Size(max = 32, message = "结算方式编码不能超过 32 个字符")
        String methodCode,

        @NotBlank(message = "结算方式名称不能为空")
        @Size(max = 64, message = "结算方式名称不能超过 64 个字符")
        String methodName,

        Integer status
) {
}
