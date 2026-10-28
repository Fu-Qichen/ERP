package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.view.LedgerView;
import com.jxbs.erp.demo.mapper.StockLedgerMapper;
import org.springframework.stereotype.Service;

@Service
public class LedgerService {

    private final StockLedgerMapper ledgerMapper;

    public LedgerService(StockLedgerMapper ledgerMapper) {
        this.ledgerMapper = ledgerMapper;
    }

    public IPage<LedgerView> page(long current,
                                  long size,
                                  Long materialId,
                                  Long warehouseId,
                                  String bizType,
                                  Long batchId,
                                  String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return ledgerMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                materialId,
                warehouseId,
                bizType,
                batchId,
                keyword
        );
    }
}
