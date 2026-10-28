package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.jxbs.erp.demo.domain.InventoryBalance;
import com.jxbs.erp.demo.domain.PurchaseOrder;
import com.jxbs.erp.demo.domain.SalesOrder;
import com.jxbs.erp.demo.domain.Warehouse;
import com.jxbs.erp.demo.domain.view.WarehouseView;
import com.jxbs.erp.demo.dto.WarehouseRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.DeptMapper;
import com.jxbs.erp.demo.mapper.InventoryBalanceMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderMapper;
import com.jxbs.erp.demo.mapper.SalesOrderMapper;
import com.jxbs.erp.demo.mapper.WarehouseMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseMapper warehouseMapper;
    private final DeptMapper deptMapper;
    private final InventoryBalanceMapper balanceMapper;
    private final SalesOrderMapper salesOrderMapper;
    private final PurchaseOrderMapper purchaseOrderMapper;

    public WarehouseService(WarehouseMapper warehouseMapper,
                            DeptMapper deptMapper,
                            InventoryBalanceMapper balanceMapper,
                            SalesOrderMapper salesOrderMapper,
                            PurchaseOrderMapper purchaseOrderMapper) {
        this.warehouseMapper = warehouseMapper;
        this.deptMapper = deptMapper;
        this.balanceMapper = balanceMapper;
        this.salesOrderMapper = salesOrderMapper;
        this.purchaseOrderMapper = purchaseOrderMapper;
    }

    public List<WarehouseView> warehouses() {
        return warehouseMapper.selectViews();
    }

    @Transactional
    public Warehouse create(WarehouseRequest request) {
        validateDept(request.deptId());
        Warehouse warehouse = new Warehouse();
        apply(warehouse, request);
        warehouseMapper.insert(warehouse);
        return warehouseMapper.selectById(warehouse.getId());
    }

    @Transactional
    public Warehouse update(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseMapper.selectById(id);
        if (warehouse == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "仓库不存在");
        }
        validateDept(request.deptId());
        apply(warehouse, request);
        warehouseMapper.updateById(warehouse);
        return warehouseMapper.selectById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (warehouseMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "仓库不存在");
        }
        if (balanceMapper.selectCount(
                Wrappers.<InventoryBalance>lambdaQuery().eq(InventoryBalance::getWarehouseId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "仓库还有库存余额，不能删除");
        }
        if (salesOrderMapper.selectCount(
                Wrappers.<SalesOrder>lambdaQuery().eq(SalesOrder::getWarehouseId, id)) > 0
                || purchaseOrderMapper.selectCount(
                Wrappers.<PurchaseOrder>lambdaQuery().eq(PurchaseOrder::getWarehouseId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "仓库已被业务单据引用，不能删除");
        }
        warehouseMapper.deleteById(id);
    }

    private void apply(Warehouse warehouse, WarehouseRequest request) {
        warehouse.setWarehouseCode(request.warehouseCode());
        warehouse.setWarehouseName(request.warehouseName());
        warehouse.setDeptId(request.deptId());
        warehouse.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateDept(Long deptId) {
        if (deptMapper.selectById(deptId) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "所属部门不存在");
        }
    }
}
