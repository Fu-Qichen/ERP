package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeptRequest(
        @NotBlank(message = "部门编码不能为空")
        @Size(max = 32, message = "部门编码不能超过 32 个字符")
        String deptCode,

        @NotBlank(message = "部门名称不能为空")
        @Size(max = 128, message = "部门名称不能超过 128 个字符")
        String deptName,

        Long parentId,

        Integer status
) {
}
