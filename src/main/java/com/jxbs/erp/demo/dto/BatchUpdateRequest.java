package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record BatchUpdateRequest(
        LocalDate produceDate,
        LocalDate expireDate,

        @Min(value = 0, message = "状态取值不正确")
        @Max(value = 1, message = "状态取值不正确")
        Integer status,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark
) {
}
