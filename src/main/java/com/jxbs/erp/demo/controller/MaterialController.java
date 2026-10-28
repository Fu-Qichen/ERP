package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialMapper materialMapper;

    public MaterialController(MaterialMapper materialMapper) {
        this.materialMapper = materialMapper;
    }

    @GetMapping
    public Page<Material> page(@RequestParam(defaultValue = "1") long current,
                               @RequestParam(defaultValue = "10") long size,
                               @RequestParam(required = false) String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        var query = Wrappers.<Material>lambdaQuery()
                .and(StringUtils.hasText(keyword), wrapper -> wrapper
                        .like(Material::getCode, keyword)
                        .or()
                        .like(Material::getName, keyword))
                .orderByDesc(Material::getId);
        return materialMapper.selectPage(new Page<>(Math.max(current, 1), safeSize), query);
    }

    @GetMapping("/{id}")
    public Material get(@PathVariable Long id) {
        Material material = materialMapper.selectById(id);
        if (material == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "物料不存在");
        }
        return material;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Material create(@Valid @RequestBody Material material) {
        material.setId(null);
        if (material.getStatus() == null) {
            material.setStatus(1);
        }
        materialMapper.insert(material);
        return materialMapper.selectById(material.getId());
    }

    @PutMapping("/{id}")
    public Material update(@PathVariable Long id, @Valid @RequestBody Material material) {
        if (materialMapper.selectById(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "物料不存在");
        }
        material.setId(id);
        materialMapper.updateById(material);
        return materialMapper.selectById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (materialMapper.deleteById(id) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "物料不存在");
        }
    }
}
