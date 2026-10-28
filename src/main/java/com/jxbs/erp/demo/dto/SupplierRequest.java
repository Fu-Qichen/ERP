package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank(message = "供应商编码不能为空")
        @Size(max = 32, message = "供应商编码不能超过 32 个字符")
        String supplierCode,

        @NotBlank(message = "供应商名称不能为空")
        @Size(max = 128, message = "供应商名称不能超过 128 个字符")
        String supplierName,

        @NotNull(message = "供应商分类不能为空")
        Long classId,

        @NotNull(message = "币种不能为空")
        Long currencyId,

        Long payConditionId,

        Integer status
) {
}
