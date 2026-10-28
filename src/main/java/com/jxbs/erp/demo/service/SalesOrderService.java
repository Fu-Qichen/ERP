package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Customer;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.SalesOrder;
import com.jxbs.erp.demo.domain.SalesOrderLine;
import com.jxbs.erp.demo.domain.Warehouse;
import com.jxbs.erp.demo.domain.view.SalesOrderView;
import com.jxbs.erp.demo.dto.ApprovalDecisionRequest;
import com.jxbs.erp.demo.dto.SalesOrderCreateRequest;
import com.jxbs.erp.demo.dto.SalesOrderLineRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.CustomerMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.SalesOrderLineMapper;
import com.jxbs.erp.demo.mapper.SalesOrderMapper;
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
public class SalesOrderService {

    private static final DateTimeFormatter ORDER_NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final SalesOrderMapper orderMapper;
    private final SalesOrderLineMapper lineMapper;
    private final MaterialMapper materialMapper;
    private final CustomerMapper customerMapper;
    private final WarehouseMapper warehouseMapper;
    private final ApprovalService approvalService;

    public SalesOrderService(SalesOrderMapper orderMapper,
                             SalesOrderLineMapper lineMapper,
                             MaterialMapper materialMapper,
                             CustomerMapper customerMapper,
                             WarehouseMapper warehouseMapper,
                             ApprovalService approvalService) {
        this.orderMapper = orderMapper;
        this.lineMapper = lineMapper;
        this.materialMapper = materialMapper;
        this.customerMapper = customerMapper;
        this.warehouseMapper = warehouseMapper;
        this.approvalService = approvalService;
    }

    public IPage<SalesOrderView> page(long current, long size, String keyword, Integer status) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return orderMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status
        );
    }

    public SalesOrderView detail(Long id) {
        SalesOrderView order = orderMapper.selectViewById(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售订单不存在");
        }
        order.setLines(lineMapper.selectViews(id));
        return order;
    }

    @Transactional
    public SalesOrderView create(SalesOrderCreateRequest request) {
        Customer customer = customerMapper.selectById(request.customerId());
        if (customer == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "客户不存在");
        }
        Warehouse warehouse = warehouseMapper.selectById(request.warehouseId());
        if (warehouse == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仓库不存在");
        }

        List<SalesOrderLine> lines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SalesOrderLineRequest lineRequest : request.lines()) {
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

            SalesOrderLine line = new SalesOrderLine();
            line.setMaterialId(lineRequest.materialId());
            line.setQuantity(lineRequest.quantity());
            line.setTaxUnitPrice(lineRequest.taxUnitPrice());
            line.setTaxRate(lineRequest.taxRate());
            line.setAmount(amount);
            lines.add(line);

            totalAmount = totalAmount.add(amount);
        }

        SalesOrder order = new SalesOrder();
        order.setOrderNo(nextOrderNo());
        order.setOrderDate(request.orderDate());
        order.setCustomerId(request.customerId());
        order.setWarehouseId(request.warehouseId());
        order.setStatus(0);
        order.setTotalAmount(totalAmount.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP));
        order.setRemark(request.remark());
        orderMapper.insert(order);

        for (SalesOrderLine line : lines) {
            line.setOrderId(order.getId());
            lineMapper.insert(line);
        }

        return detail(order.getId());
    }

    /**
     * 审核订单：发起审批并记录审批日志。审批通过后订单才进入已审核状态。
     */
    @Transactional
    public SalesOrderView audit(Long id) {
        SalesOrder order = orderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有草稿订单可以审核");
        }
        if (lineMapper.selectCount(
                Wrappers.<SalesOrderLine>lambdaQuery().eq(SalesOrderLine::getOrderId, id)) == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "订单没有明细");
        }

        approvalService.submit(
                ApprovalService.SALES_ORDER,
                order.getId(),
                order.getOrderNo(),
                order.getTotalAmount(),
                "system",
                "提交审核"
        );
        if (orderMapper.markAudited(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "订单状态已变化，请刷新后重试");
        }
        return detail(id);
    }

    /**
     * 审批决定：驳回时把订单退回草稿。
     */
    @Transactional
    public SalesOrderView decide(Long id, ApprovalDecisionRequest request) {
        SalesOrder order = orderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售订单不存在");
        }
        var approval = approvalService.latest(ApprovalService.SALES_ORDER, order.getId());
        if (approval == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "该订单尚未提交审批");
        }
        approvalService.decide(approval.getId(), request);
        return detail(id);
    }

    /**
     * 关闭订单：已审核且全部发货后关闭，未发货订单不可关闭。
     */
    @Transactional
    public SalesOrderView close(Long id) {
        SalesOrder order = orderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已审核订单可以关闭");
        }
        Long pending = lineMapper.selectCount(
                Wrappers.<SalesOrderLine>lambdaQuery()
                        .eq(SalesOrderLine::getOrderId, id)
                        .apply("delivered_qty < quantity")
        );
        if (pending > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "订单还有未发货明细，不能关闭");
        }
        if (orderMapper.markClosed(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "订单状态已变化，请刷新后重试");
        }
        return detail(id);
    }

    private String nextOrderNo() {
        Long sequence = orderMapper.nextOrderNoSeq();
        return "SO" + LocalDate.now().format(ORDER_NO_DATE) + String.format("%06d", sequence);
    }
}
