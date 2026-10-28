package com.jxbs.erp.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record IssueRequest(
        @NotEmpty(message = "领料明细不能为空")
        @Valid
        List<IssueLine> lines
) {
    public record IssueLine(
            @NotNull(message = "物料不能为空")
            Long materialId,

            @NotNull(message = "领料数量不能为空")
            @DecimalMin(value = "0.000001", message = "领料数量必须大于 0")
            BigDecimal qty,

            Long batchId
    ) {
    }
}
