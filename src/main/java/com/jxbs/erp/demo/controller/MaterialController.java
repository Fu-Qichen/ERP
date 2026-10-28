package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.view.MaterialView;
import com.jxbs.erp.demo.dto.MaterialRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.MaterialClassMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.UnitOfMeasureMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialMapper materialMapper;
    private final MaterialClassMapper materialClassMapper;
    private final UnitOfMeasureMapper uomMapper;

    public MaterialController(MaterialMapper materialMapper,
                              MaterialClassMapper materialClassMapper,
                              UnitOfMeasureMapper uomMapper) {
        this.materialMapper = materialMapper;
        this.materialClassMapper = materialClassMapper;
        this.uomMapper = uomMapper;
    }

    @GetMapping
    public IPage<MaterialView> page(@RequestParam(defaultValue = "1") long current,
                                    @RequestParam(defaultValue = "10") long size,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(required = false) Long classId) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return materialMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                classId
        );
    }

    @GetMapping("/{id}")
    public MaterialView get(@PathVariable Long id) {
        MaterialView view = materialMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "物料不存在");
        }
        return view;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialView create(@Valid @RequestBody MaterialRequest request) {
        validateRefs(request);
        Material material = new Material();
        apply(material, request);
        materialMapper.insert(material);
        return get(material.getId());
    }

    @PutMapping("/{id}")
    public MaterialView update(@PathVariable Long id, @Valid @RequestBody MaterialRequest request) {
        Material material = materialMapper.selectById(id);
        if (material == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "物料不存在");
        }
        validateRefs(request);
        apply(material, request);
        materialMapper.updateById(material);
        return get(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (materialMapper.deleteById(id) == 0) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "物料不存在");
        }
    }

    private void apply(Material material, MaterialRequest request) {
        material.setCode(request.code());
        material.setName(request.name());
        material.setSpec(request.spec());
        material.setClassId(request.classId());
        material.setUomId(request.uomId());
        material.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateRefs(MaterialRequest request) {
        if (materialClassMapper.selectById(request.classId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "物料分类不存在");
        }
        if (uomMapper.selectById(request.uomId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "计量单位不存在");
        }
    }
}
