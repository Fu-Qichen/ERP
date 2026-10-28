package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CurrencyRequest(
        @NotBlank(message = "币种编码不能为空")
        @Size(max = 16, message = "币种编码不能超过 16 个字符")
        String currencyCode,

        @NotBlank(message = "币种名称不能为空")
        @Size(max = 64, message = "币种名称不能超过 64 个字符")
        String currencyName,

        @NotNull(message = "汇率不能为空")
        @DecimalMin(value = "0.000001", message = "汇率必须大于 0")
        BigDecimal exchangeRate,

        Integer status
) {
}
