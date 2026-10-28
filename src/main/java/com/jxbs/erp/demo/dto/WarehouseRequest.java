package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record WarehouseRequest(
        @NotBlank(message = "仓库编码不能为空")
        @Size(max = 32, message = "仓库编码不能超过 32 个字符")
        String warehouseCode,

        @NotBlank(message = "仓库名称不能为空")
        @Size(max = 128, message = "仓库名称不能超过 128 个字符")
        String warehouseName,

        @NotNull(message = "所属部门不能为空")
        Long deptId,

        Integer status
) {
}
