package com.jxbs.erp.demo.service;

import com.jxbs.erp.demo.domain.view.ReconcileRowView;
import com.jxbs.erp.demo.mapper.ReconcileMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ReconcileService {

    private final ReconcileMapper reconcileMapper;

    public ReconcileService(ReconcileMapper reconcileMapper) {
        this.reconcileMapper = reconcileMapper;
    }

    public List<ReconcileRowView> reconcile(Long warehouseId, boolean onlyDiff) {
        return reconcileMapper.reconcile(warehouseId, onlyDiff);
    }

    public long diffCount(Long warehouseId) {
        return reconcileMapper.reconcile(warehouseId, true).size();
    }

    public BigDecimal totalDiff(Long warehouseId) {
        return reconcileMapper.reconcile(warehouseId, false).stream()
                .map(ReconcileRowView::getDiffQty)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
