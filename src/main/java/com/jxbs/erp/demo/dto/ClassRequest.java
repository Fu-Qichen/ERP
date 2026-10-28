package com.jxbs.erp.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClassRequest(
        @NotBlank(message = "分类编码不能为空")
        @Size(max = 32, message = "分类编码不能超过 32 个字符")
        String classCode,

        @NotBlank(message = "分类名称不能为空")
        @Size(max = 128, message = "分类名称不能超过 128 个字符")
        String className,

        Long parentId,

        Integer status
) {
}
