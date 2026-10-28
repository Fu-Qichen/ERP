package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MaterialRequest(
        @NotBlank(message = "物料编码不能为空")
        @Size(max = 32, message = "物料编码不能超过 32 个字符")
        String code,

        @NotBlank(message = "物料名称不能为空")
        @Size(max = 128, message = "物料名称不能超过 128 个字符")
        String name,

        @Size(max = 128, message = "规格不能超过 128 个字符")
        String spec,

        @NotNull(message = "物料分类不能为空")
        Long classId,

        @NotNull(message = "计量单位不能为空")
        Long uomId,

        @Min(value = 0, message = "状态只能是 0 或 1")
        @Max(value = 1, message = "状态只能是 0 或 1")
        Integer status,

        @Min(value = 0, message = "批次管理只能是 0、1 或 2")
        @Max(value = 2, message = "批次管理只能是 0、1 或 2")
        Integer batchMode
) {
}
