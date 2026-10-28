package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.PurchaseOrder;
import com.jxbs.erp.demo.domain.PurchaseOrderLine;
import com.jxbs.erp.demo.domain.Supplier;
import com.jxbs.erp.demo.domain.Warehouse;
import com.jxbs.erp.demo.domain.view.PurchaseOrderView;
import com.jxbs.erp.demo.dto.PurchaseOrderCreateRequest;
import com.jxbs.erp.demo.dto.PurchaseOrderLineRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderMapper;
import com.jxbs.erp.demo.mapper.SupplierMapper;
import com.jxbs.erp.demo.mapper.WarehouseMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseOrderService {

    private static final DateTimeFormatter ORDER_NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final PurchaseOrderMapper orderMapper;
    private final PurchaseOrderLineMapper lineMapper;
    private final SupplierMapper supplierMapper;
    private final WarehouseMapper warehouseMapper;
    private final MaterialMapper materialMapper;

    public PurchaseOrderService(PurchaseOrderMapper orderMapper,
                                PurchaseOrderLineMapper lineMapper,
                                SupplierMapper supplierMapper,
                                WarehouseMapper warehouseMapper,
                                MaterialMapper materialMapper) {
        this.orderMapper = orderMapper;
        this.lineMapper = lineMapper;
        this.supplierMapper = supplierMapper;
        this.warehouseMapper = warehouseMapper;
        this.materialMapper = materialMapper;
    }

    public IPage<PurchaseOrderView> page(long current, long size, String keyword, Integer status) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return orderMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status
        );
    }

    public PurchaseOrderView detail(Long id) {
        PurchaseOrderView order = orderMapper.selectViewById(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购订单不存在");
        }
        order.setLines(lineMapper.selectViews(id));
        return order;
    }

    @Transactional
    public PurchaseOrderView create(PurchaseOrderCreateRequest request) {
        Supplier supplier = supplierMapper.selectById(request.supplierId());
        if (supplier == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "供应商不存在");
        }
        Warehouse warehouse = warehouseMapper.selectById(request.warehouseId());
        if (warehouse == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仓库不存在");
        }

        List<PurchaseOrderLine> lines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseOrderLineRequest lineRequest : request.lines()) {
            Material material = materialMapper.selectById(lineRequest.materialId());
            if (material == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "物料不存在：" + lineRequest.materialId());
            }
            if (material.getStatus() != null && material.getStatus() == 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "物料已停用：" + material.getCode());
            }

            BigDecimal amount = lineRequest.quantity()
                    .multiply(lineRequest.taxUnitPrice())
                    .setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);

            PurchaseOrderLine line = new PurchaseOrderLine();
            line.setMaterialId(lineRequest.materialId());
            line.setQuantity(lineRequest.quantity());
            line.setTaxUnitPrice(lineRequest.taxUnitPrice());
            line.setTaxRate(lineRequest.taxRate());
            line.setAmount(amount);
            lines.add(line);

            totalAmount = totalAmount.add(amount);
        }

        PurchaseOrder order = new PurchaseOrder();
        order.setOrderNo(nextOrderNo());
        order.setOrderDate(request.orderDate());
        order.setSupplierId(request.supplierId());
        order.setWarehouseId(request.warehouseId());
        order.setStatus(0);
        order.setTotalAmount(totalAmount.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP));
        order.setRemark(request.remark());
        orderMapper.insert(order);

        for (PurchaseOrderLine line : lines) {
            line.setOrderId(order.getId());
            lineMapper.insert(line);
        }

        return detail(order.getId());
    }

    /**
     * 审核采购订单：只改状态，不动库存。库存增加发生在收货入库。
     */
    @Transactional
    public PurchaseOrderView audit(Long id) {
        PurchaseOrder order = orderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有草稿采购订单可以审核");
        }
        if (lineMapper.selectCount(
                Wrappers.<PurchaseOrderLine>lambdaQuery().eq(PurchaseOrderLine::getOrderId, id)) == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "采购订单没有明细");
        }
        if (orderMapper.markAudited(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "采购订单状态已变化，请刷新后重试");
        }
        return detail(id);
    }

    @Transactional
    public PurchaseOrderView close(Long id) {
        PurchaseOrder order = orderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已审核采购订单可以关闭");
        }
        Long pending = lineMapper.selectCount(
                Wrappers.<PurchaseOrderLine>lambdaQuery()
                        .eq(PurchaseOrderLine::getOrderId, id)
                        .apply("received_qty < quantity")
        );
        if (pending > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "采购订单还有未收货明细，不能关闭");
        }
        if (orderMapper.markClosed(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "采购订单状态已变化，请刷新后重试");
        }
        return detail(id);
    }

    private String nextOrderNo() {
        Long sequence = orderMapper.nextOrderNoSeq();
        return "PO" + LocalDate.now().format(ORDER_NO_DATE) + String.format("%06d", sequence);
    }
}
