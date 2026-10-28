package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.MaterialClass;
import com.jxbs.erp.demo.domain.UnitOfMeasure;
import com.jxbs.erp.demo.dto.ClassRequest;
import com.jxbs.erp.demo.dto.UnitOfMeasureRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.MaterialClassMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.UnitOfMeasureMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MaterialMasterController {

    private final MaterialClassMapper classMapper;
    private final UnitOfMeasureMapper uomMapper;
    private final MaterialMapper materialMapper;

    public MaterialMasterController(MaterialClassMapper classMapper,
                                    UnitOfMeasureMapper uomMapper,
                                    MaterialMapper materialMapper) {
        this.classMapper = classMapper;
        this.uomMapper = uomMapper;
        this.materialMapper = materialMapper;
    }

    @GetMapping("/material-classes")
    public List<MaterialClass> classes() {
        return classMapper.selectList(
                Wrappers.<MaterialClass>lambdaQuery()
                        .eq(MaterialClass::getStatus, 1)
                        .orderByAsc(MaterialClass::getClassCode)
        );
    }

    @PostMapping("/material-classes")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialClass createClass(@Valid @RequestBody ClassRequest request) {
        validateClassParent(null, request.parentId());
        MaterialClass item = new MaterialClass();
        applyClass(item, request);
        classMapper.insert(item);
        return classMapper.selectById(item.getId());
    }

    @PutMapping("/material-classes/{id}")
    public MaterialClass updateClass(@PathVariable Long id, @Valid @RequestBody ClassRequest request) {
        MaterialClass item = classMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "物料分类不存在");
        }
        validateClassParent(id, request.parentId());
        applyClass(item, request);
        classMapper.updateById(item);
        return classMapper.selectById(id);
    }

    @DeleteMapping("/material-classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteClass(@PathVariable Long id) {
        if (classMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "物料分类不存在");
        }
        if (classMapper.selectCount(
                Wrappers.<MaterialClass>lambdaQuery().eq(MaterialClass::getParentId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类下还有子分类，不能删除");
        }
        if (materialMapper.selectCount(
                Wrappers.<Material>lambdaQuery().eq(Material::getClassId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类已被物料引用，不能删除");
        }
        classMapper.deleteById(id);
    }

    @GetMapping("/uoms")
    public List<UnitOfMeasure> uoms() {
        return uomMapper.selectList(
                Wrappers.<UnitOfMeasure>lambdaQuery()
                        .eq(UnitOfMeasure::getStatus, 1)
                        .orderByAsc(UnitOfMeasure::getUnitCode)
        );
    }

    @PostMapping("/uoms")
    @ResponseStatus(HttpStatus.CREATED)
    public UnitOfMeasure createUom(@Valid @RequestBody UnitOfMeasureRequest request) {
        UnitOfMeasure item = new UnitOfMeasure();
        applyUom(item, request);
        uomMapper.insert(item);
        return uomMapper.selectById(item.getId());
    }

    @PutMapping("/uoms/{id}")
    public UnitOfMeasure updateUom(@PathVariable Long id,
                                   @Valid @RequestBody UnitOfMeasureRequest request) {
        UnitOfMeasure item = uomMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "计量单位不存在");
        }
        applyUom(item, request);
        uomMapper.updateById(item);
        return uomMapper.selectById(id);
    }

    @DeleteMapping("/uoms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteUom(@PathVariable Long id) {
        if (uomMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "计量单位不存在");
        }
        if (materialMapper.selectCount(
                Wrappers.<Material>lambdaQuery().eq(Material::getUomId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "计量单位已被物料引用，不能删除");
        }
        uomMapper.deleteById(id);
    }

    private void applyClass(MaterialClass item, ClassRequest request) {
        item.setClassCode(request.classCode());
        item.setClassName(request.className());
        item.setParentId(request.parentId());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applyUom(UnitOfMeasure item, UnitOfMeasureRequest request) {
        item.setUnitCode(request.unitCode());
        item.setUnitName(request.unitName());
        item.setDecimalDigits(request.decimalDigits());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateClassParent(Long id, Long parentId) {
        if (parentId == null) {
            return;
        }
        if (id != null && id.equals(parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是自己");
        }
        Long cursor = parentId;
        while (cursor != null) {
            if (id != null && id.equals(cursor)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是当前分类的下级");
            }
            MaterialClass parent = classMapper.selectById(cursor);
            if (parent == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不存在");
            }
            cursor = parent.getParentId();
        }
    }
}
