package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.LedgerView;
import com.jxbs.erp.demo.service.LedgerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private final LedgerService ledgerService;

    public LedgerController(LedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping
    public IPage<LedgerView> page(@RequestParam(defaultValue = "1") long current,
                                  @RequestParam(defaultValue = "20") long size,
                                  @RequestParam(required = false) Long materialId,
                                  @RequestParam(required = false) Long warehouseId,
                                  @RequestParam(required = false) String bizType,
                                  @RequestParam(required = false) Long batchId,
                                  @RequestParam(required = false) String keyword) {
        return ledgerService.page(current, size, materialId, warehouseId, bizType, batchId, keyword);
    }
}
