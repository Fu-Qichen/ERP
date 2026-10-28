package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StaffRequest(
        @NotBlank(message = "员工编号不能为空")
        @Size(max = 32, message = "员工编号不能超过 32 个字符")
        String staffNo,

        @NotBlank(message = "员工姓名不能为空")
        @Size(max = 128, message = "员工姓名不能超过 128 个字符")
        String staffName,

        @NotNull(message = "所属部门不能为空")
        Long deptId,

        Integer status
) {
}
