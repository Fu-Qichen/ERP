package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record BomRequest(
        @NotBlank(message = "BOM 编码不能为空")
        @Size(max = 32, message = "BOM 编码不能超过 32 个字符")
        String bomCode,

        @NotNull(message = "成品不能为空")
        Long productId,

        @NotBlank(message = "版本不能为空")
        @Size(max = 16, message = "版本不能超过 16 个字符")
        String version,

        @NotNull(message = "基准数量不能为空")
        @DecimalMin(value = "0.000001", message = "基准数量必须大于 0")
        BigDecimal baseQty,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark,

        @NotEmpty(message = "BOM 明细不能为空")
        @Valid
        List<BomLineRequest> lines
) {
}
