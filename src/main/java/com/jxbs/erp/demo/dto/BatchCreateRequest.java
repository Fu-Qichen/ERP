package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record BatchCreateRequest(
        @NotNull(message = "物料不能为空")
        Long materialId,

        @NotBlank(message = "批次号不能为空")
        @Size(max = 64, message = "批次号不能超过 64 个字符")
        String batchNo,

        LocalDate produceDate,
        LocalDate expireDate,

        @Size(max = 255, message = "备注不能超过 255 个字符")
        String remark
) {
}
