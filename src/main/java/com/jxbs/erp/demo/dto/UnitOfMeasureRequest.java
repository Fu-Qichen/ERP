package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UnitOfMeasureRequest(
        @NotBlank(message = "单位编码不能为空")
        @Size(max = 16, message = "单位编码不能超过 16 个字符")
        String unitCode,

        @NotBlank(message = "单位名称不能为空")
        @Size(max = 32, message = "单位名称不能超过 32 个字符")
        String unitName,

        @NotNull(message = "小数位数不能为空")
        @Min(value = 0, message = "小数位数不能小于 0")
        @Max(value = 6, message = "小数位数不能大于 6")
        Integer decimalDigits,

        Integer status
) {
}
