package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Batch;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.view.BatchView;
import com.jxbs.erp.demo.dto.BatchCreateRequest;
import com.jxbs.erp.demo.dto.BatchUpdateRequest;
import com.jxbs.erp.demo.mapper.BatchMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.jxbs.erp.demo.exception.BusinessException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BatchService {

    private final BatchMapper batchMapper;
    private final MaterialMapper materialMapper;

    public BatchService(BatchMapper batchMapper, MaterialMapper materialMapper) {
        this.batchMapper = batchMapper;
        this.materialMapper = materialMapper;
    }

    public IPage<BatchView> page(long current, long size, Long materialId, Long warehouseId, String keyword) {
        long safeSize = Math.max(1, Math.min(size, 100));
        Page<BatchView> page = new Page<>(Math.max(current, 1), safeSize);
        return batchMapper.selectPageViews(page, materialId, warehouseId, keyword);
    }

    public List<BatchView> available(Long materialId, Long warehouseId) {
        if (materialId == null || warehouseId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "物料和仓库不能为空");
        }
        return batchMapper.selectAvailable(materialId, warehouseId);
    }

    public BatchView detail(Long id) {
        BatchView view = batchMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "批次不存在");
        }
        return view;
    }

    @Transactional
    public Batch create(BatchCreateRequest request) {
        Material material = materialMapper.selectById(request.materialId());
        if (material == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "物料不存在");
        }
        if (request.expireDate() != null && request.produceDate() != null
                && request.expireDate().isBefore(request.produceDate())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "到期日不能早于生产日期");
        }
        Long exists = batchMapper.selectCount(com.baomidou.mybatisplus.core.toolkit.Wrappers.<Batch>lambdaQuery()
                .eq(Batch::getMaterialId, request.materialId())
                .eq(Batch::getBatchNo, request.batchNo().trim()));
        if (exists != null && exists > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "该物料下批次号已存在");
        }

        Batch batch = new Batch();
        batch.setMaterialId(request.materialId());
        batch.setBatchNo(request.batchNo().trim());
        batch.setProduceDate(request.produceDate());
        batch.setExpireDate(request.expireDate());
        batch.setSourceType("MANUAL");
        batch.setStatus(1);
        batch.setRemark(request.remark());
        batch.setCreatedAt(LocalDateTime.now());
        batch.setUpdatedAt(LocalDateTime.now());
        batchMapper.insert(batch);
        return batch;
    }

    @Transactional
    public BatchView update(Long id, BatchUpdateRequest request) {
        Batch batch = batchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "批次不存在");
        }
        LocalDate produceDate = request.produceDate() == null ? batch.getProduceDate() : request.produceDate();
        LocalDate expireDate = request.expireDate() == null ? batch.getExpireDate() : request.expireDate();
        if (produceDate != null && expireDate != null && expireDate.isBefore(produceDate)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "到期日不能早于生产日期");
        }
        batch.setProduceDate(produceDate);
        batch.setExpireDate(expireDate);
        if (request.status() != null) {
            batch.setStatus(request.status());
        }
        if (request.remark() != null) {
            batch.setRemark(request.remark());
        }
        batch.setUpdatedAt(LocalDateTime.now());
        batchMapper.updateById(batch);
        return detail(id);
    }

    /**
     * 过账时保证批次存在：已存在则复用，不存在则按批次号新建。
     * 非批次物料（batchMode=0）一律返回 null，保持原有库存维度。
     */
    @Transactional
    public Batch resolveForStock(Long materialId, String batchNo, String sourceType, Long sourceId) {
        if (materialId == null) {
            return null;
        }
        Material material = materialMapper.selectById(materialId);
        if (material == null || material.getBatchMode() == null || material.getBatchMode() == 0) {
            if (batchNo != null && !batchNo.isBlank()) {
                throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "物料 " + material.getCode() + " 未启用批次管理，不能指定批次");
            }
            return null;
        }
        if (batchNo == null || batchNo.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "物料 " + material.getCode() + " 已启用批次管理，必须指定批次");
        }
        Batch exists = batchMapper.selectOne(com.baomidou.mybatisplus.core.toolkit.Wrappers.<Batch>lambdaQuery()
                .eq(Batch::getMaterialId, materialId)
                .eq(Batch::getBatchNo, batchNo.trim()));
        if (exists != null) {
            return exists;
        }
        Batch batch = new Batch();
        batch.setMaterialId(materialId);
        batch.setBatchNo(batchNo.trim());
        batch.setSourceType(sourceType);
        batch.setSourceId(sourceId);
        batch.setStatus(1);
        batch.setCreatedAt(LocalDateTime.now());
        batch.setUpdatedAt(LocalDateTime.now());
        batchMapper.insert(batch);
        return batch;
    }

    /**
     * 出库时按批次 ID 定位批次，并校验它属于该物料且已启用。
     */
    public Batch requireForIssue(Long materialId, Long batchId) {
        Material material = materialMapper.selectById(materialId);
        if (material == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "物料不存在");
        }
        if (material.getBatchMode() == null || material.getBatchMode() == 0) {
            if (batchId != null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "物料 " + material.getCode() + " 未启用批次管理，不能指定批次");
            }
            return null;
        }
        if (batchId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "物料 " + material.getCode() + " 已启用批次管理，必须指定批次");
        }
        Batch batch = batchMapper.selectById(batchId);
        if (batch == null || !materialId.equals(batch.getMaterialId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "批次不属于物料 " + material.getCode());
        }
        return batch;
    }
}
