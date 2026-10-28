package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Batch;
import com.jxbs.erp.demo.domain.view.BatchView;
import com.jxbs.erp.demo.dto.BatchCreateRequest;
import com.jxbs.erp.demo.dto.BatchUpdateRequest;
import com.jxbs.erp.demo.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public IPage<BatchView> list(@RequestParam(defaultValue = "1") long current,
                                 @RequestParam(defaultValue = "20") long size,
                                 @RequestParam(required = false) Long materialId,
                                 @RequestParam(required = false) Long warehouseId,
                                 @RequestParam(required = false) String keyword) {
        return batchService.page(current, size, materialId, warehouseId, keyword);
    }

    /**
     * 出库/领料时的可用批次，按先到期先出排序。
     */
    @GetMapping("/available")
    public List<BatchView> available(@RequestParam Long materialId,
                                     @RequestParam Long warehouseId) {
        return batchService.available(materialId, warehouseId);
    }

    @GetMapping("/{id}")
    public BatchView detail(@PathVariable Long id) {
        return batchService.detail(id);
    }

    @PostMapping
    public Batch create(@Valid @RequestBody BatchCreateRequest request) {
        return batchService.create(request);
    }

    @PutMapping("/{id}")
    public BatchView update(@PathVariable Long id, @Valid @RequestBody BatchUpdateRequest request) {
        return batchService.update(id, request);
    }
}
