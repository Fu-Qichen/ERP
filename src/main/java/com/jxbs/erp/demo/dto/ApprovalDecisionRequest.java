package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApprovalDecisionRequest(
        @NotBlank(message = "审批人不能为空")
        @Size(max = 64, message = "审批人不能超过 64 个字符")
        String approver,

        boolean approved,

        @Size(max = 255, message = "审批意见不能超过 255 个字符")
        String remark
) {
}
