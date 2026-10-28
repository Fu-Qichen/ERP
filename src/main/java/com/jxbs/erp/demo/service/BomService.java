package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Bom;
import com.jxbs.erp.demo.domain.BomLine;
import com.jxbs.erp.demo.domain.view.BomView;
import com.jxbs.erp.demo.dto.BomLineRequest;
import com.jxbs.erp.demo.dto.BomRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.BomLineMapper;
import com.jxbs.erp.demo.mapper.BomMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.WorkOrderMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class BomService {

    private final BomMapper bomMapper;
    private final BomLineMapper bomLineMapper;
    private final MaterialMapper materialMapper;
    private final WorkOrderMapper workOrderMapper;

    public BomService(BomMapper bomMapper,
                      BomLineMapper bomLineMapper,
                      MaterialMapper materialMapper,
                      WorkOrderMapper workOrderMapper) {
        this.bomMapper = bomMapper;
        this.bomLineMapper = bomLineMapper;
        this.materialMapper = materialMapper;
        this.workOrderMapper = workOrderMapper;
    }

    public IPage<BomView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return bomMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public BomView detail(Long id) {
        BomView view = bomMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "BOM 不存在");
        }
        view.setLines(bomLineMapper.selectViews(id));
        return view;
    }

    @Transactional
    public BomView create(BomRequest request) {
        validate(request, null);
        Bom bom = new Bom();
        apply(bom, request);
        bomMapper.insert(bom);
        insertLines(bom.getId(), request.lines());
        return detail(bom.getId());
    }

    @Transactional
    public BomView update(Long id, BomRequest request) {
        Bom bom = bomMapper.selectById(id);
        if (bom == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "BOM 不存在");
        }
        validate(request, id);
        apply(bom, request);
        bomMapper.updateById(bom);
        bomLineMapper.delete(
                Wrappers.<BomLine>lambdaQuery().eq(BomLine::getBomId, id));
        insertLines(id, request.lines());
        return detail(id);
    }

    @Transactional
    public BomView updateStatus(Long id, int status) {
        Bom bom = bomMapper.selectById(id);
        if (bom == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "BOM 不存在");
        }
        if (status != 0 && status != 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "BOM 状态只能是 0 或 1");
        }
        bomMapper.updateStatus(id, status);
        return detail(id);
    }

    @Transactional
    public void delete(Long id) {
        if (bomMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "BOM 不存在");
        }
        Long used = workOrderMapper.selectCount(
                Wrappers.<com.jxbs.erp.demo.domain.WorkOrder>lambdaQuery()
                        .eq(com.jxbs.erp.demo.domain.WorkOrder::getBomId, id));
        if (used > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "BOM 已被生产工单引用，不能删除");
        }
        bomLineMapper.delete(Wrappers.<BomLine>lambdaQuery().eq(BomLine::getBomId, id));
        bomMapper.deleteById(id);
    }

    private void apply(Bom bom, BomRequest request) {
        bom.setBomCode(request.bomCode());
        bom.setProductId(request.productId());
        bom.setVersion(request.version());
        bom.setBaseQty(request.baseQty());
        bom.setRemark(request.remark());
        if (bom.getStatus() == null) {
            bom.setStatus(1);
        }
    }

    private void insertLines(Long bomId, List<BomLineRequest> lines) {
        int sort = 0;
        for (BomLineRequest lineRequest : lines) {
            BomLine line = new BomLine();
            line.setBomId(bomId);
            line.setComponentId(lineRequest.componentId());
            line.setQty(lineRequest.qty());
            line.setLossRate(lineRequest.lossRate());
            line.setSortNo(sort++);
            bomLineMapper.insert(line);
        }
    }

    private void validate(BomRequest request, Long editingId) {
        if (materialMapper.selectById(request.productId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "成品物料不存在");
        }
        Set<Long> seen = new HashSet<>();
        for (BomLineRequest line : request.lines()) {
            if (line.componentId().equals(request.productId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "子件不能是成品本身");
            }
            if (!seen.add(line.componentId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "同一个子件不能重复出现");
            }
            if (materialMapper.selectById(line.componentId()) == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "子件物料不存在：" + line.componentId());
            }
        }
        Long duplicated = bomMapper.selectCount(
                Wrappers.<Bom>lambdaQuery()
                        .eq(Bom::getBomCode, request.bomCode())
                        .eq(Bom::getVersion, request.version())
                        .ne(editingId != null, Bom::getId, editingId));
        if (duplicated > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "同一 BOM 编码与版本已存在");
        }
    }
}
