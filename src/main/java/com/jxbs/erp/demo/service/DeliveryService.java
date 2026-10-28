package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Batch;
import com.jxbs.erp.demo.domain.Delivery;
import com.jxbs.erp.demo.domain.DeliveryLine;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.Outbound;
import com.jxbs.erp.demo.domain.OutboundLine;
import com.jxbs.erp.demo.domain.SalesOrder;
import com.jxbs.erp.demo.domain.SalesOrderLine;
import com.jxbs.erp.demo.domain.StockLedger;
import com.jxbs.erp.demo.domain.view.DeliveryView;
import com.jxbs.erp.demo.dto.DeliveryCreateRequest;
import com.jxbs.erp.demo.dto.DeliveryLineRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.DeliveryLineMapper;
import com.jxbs.erp.demo.mapper.DeliveryMapper;
import com.jxbs.erp.demo.mapper.InventoryBalanceMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.OutboundLineMapper;
import com.jxbs.erp.demo.mapper.OutboundMapper;
import com.jxbs.erp.demo.mapper.SalesOrderLineMapper;
import com.jxbs.erp.demo.mapper.SalesOrderMapper;
import com.jxbs.erp.demo.mapper.StockLedgerMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeliveryService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final DeliveryMapper deliveryMapper;
    private final DeliveryLineMapper deliveryLineMapper;
    private final OutboundMapper outboundMapper;
    private final OutboundLineMapper outboundLineMapper;
    private final SalesOrderMapper orderMapper;
    private final SalesOrderLineMapper orderLineMapper;
    private final InventoryBalanceMapper balanceMapper;
    private final StockLedgerMapper ledgerMapper;
    private final MaterialMapper materialMapper;
    private final BatchService batchService;

    public DeliveryService(DeliveryMapper deliveryMapper,
                           DeliveryLineMapper deliveryLineMapper,
                           OutboundMapper outboundMapper,
                           OutboundLineMapper outboundLineMapper,
                           SalesOrderMapper orderMapper,
                           SalesOrderLineMapper orderLineMapper,
                           InventoryBalanceMapper balanceMapper,
                           StockLedgerMapper ledgerMapper,
                           MaterialMapper materialMapper,
                           BatchService batchService) {
        this.deliveryMapper = deliveryMapper;
        this.deliveryLineMapper = deliveryLineMapper;
        this.outboundMapper = outboundMapper;
        this.outboundLineMapper = outboundLineMapper;
        this.orderMapper = orderMapper;
        this.orderLineMapper = orderLineMapper;
        this.balanceMapper = balanceMapper;
        this.ledgerMapper = ledgerMapper;
        this.materialMapper = materialMapper;
        this.batchService = batchService;
    }

    public IPage<DeliveryView> page(long current, long size, String keyword, Integer status) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return deliveryMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status
        );
    }

    public DeliveryView detail(Long id) {
        DeliveryView view = deliveryMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "发货单不存在");
        }
        view.setLines(deliveryLineMapper.selectViews(id));
        return view;
    }

    /**
     * 按订单创建发货单。创建时只校验可发数量，不动库存。
     */
    @Transactional
    public DeliveryView create(DeliveryCreateRequest request) {
        SalesOrder order = orderMapper.selectByIdForUpdate(request.orderId());
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已审核订单可以发货");
        }

        Map<Long, SalesOrderLine> orderLines = new HashMap<>();
        orderLineMapper.selectList(
                        Wrappers.<SalesOrderLine>lambdaQuery()
                                .eq(SalesOrderLine::getOrderId, order.getId()))
                .forEach(line -> orderLines.put(line.getId(), line));

        Delivery delivery = new Delivery();
        delivery.setDeliveryNo(nextDeliveryNo());
        delivery.setDeliveryDate(request.deliveryDate());
        delivery.setOrderId(order.getId());
        delivery.setCustomerId(order.getCustomerId());
        delivery.setWarehouseId(order.getWarehouseId());
        delivery.setStatus(0);
        delivery.setRemark(request.remark());
        deliveryMapper.insert(delivery);

        for (DeliveryLineRequest lineRequest : request.lines()) {
            SalesOrderLine orderLine = orderLines.get(lineRequest.orderLineId());
            if (orderLine == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "订单明细不属于该订单");
            }
            int updated = orderLineMapper.addDelivered(orderLine.getId(), lineRequest.quantity());
            if (updated == 0) {
                Material material = materialMapper.selectById(orderLine.getMaterialId());
                String code = material == null ? String.valueOf(orderLine.getMaterialId()) : material.getCode();
                throw new BusinessException(HttpStatus.CONFLICT, "物料 " + code + " 发货数量超过订单未发数量");
            }

            DeliveryLine line = new DeliveryLine();
            line.setDeliveryId(delivery.getId());
            line.setOrderLineId(orderLine.getId());
            line.setMaterialId(orderLine.getMaterialId());
            Batch batch = batchService.requireForIssue(orderLine.getMaterialId(), lineRequest.batchId());
            line.setBatchId(batch == null ? null : batch.getId());
            line.setQuantity(lineRequest.quantity());
            line.setTaxUnitPrice(orderLine.getTaxUnitPrice());
            line.setTaxRate(orderLine.getTaxRate());
            line.setAmount(lineRequest.quantity()
                    .multiply(orderLine.getTaxUnitPrice())
                    .setScale(6, RoundingMode.HALF_UP));
            deliveryLineMapper.insert(line);
        }

        return detail(delivery.getId());
    }

    /**
     * 发货出库：扣减库存、写库存流水、生成并过账出库单。库存不足整单回滚。
     */
    @Transactional
    public DeliveryView ship(Long id) {
        Delivery delivery = deliveryMapper.selectByIdForUpdate(id);
        if (delivery == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "发货单不存在");
        }
        if (delivery.getStatus() != null && delivery.getStatus() != 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有待出库发货单可以出库");
        }

        List<DeliveryLine> lines = deliveryLineMapper.selectList(
                Wrappers.<DeliveryLine>lambdaQuery()
                        .eq(DeliveryLine::getDeliveryId, id)
                        .orderByAsc(DeliveryLine::getId)
        );
        if (lines.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "发货单没有明细");
        }

        Outbound outbound = new Outbound();
        outbound.setOutboundNo(nextOutboundNo());
        outbound.setDeliveryId(delivery.getId());
        outbound.setWarehouseId(delivery.getWarehouseId());
        outbound.setStatus(0);
        outbound.setCreatedAt(LocalDateTime.now());
        outboundMapper.insert(outbound);

        for (DeliveryLine line : lines) {
            int updated = balanceMapper.deduct(line.getMaterialId(), delivery.getWarehouseId(),
                    line.getBatchId(), line.getQuantity());
            if (updated == 0) {
                Material material = materialMapper.selectById(line.getMaterialId());
                String code = material == null ? String.valueOf(line.getMaterialId()) : material.getCode();
                throw new BusinessException(HttpStatus.CONFLICT, "物料 " + code + " 库存不足"
                        + (line.getBatchId() == null ? "" : "（批次不足）"));
            }

            OutboundLine outboundLine = new OutboundLine();
            outboundLine.setOutboundId(outbound.getId());
            outboundLine.setDeliveryLineId(line.getId());
            outboundLine.setMaterialId(line.getMaterialId());
            outboundLine.setBatchId(line.getBatchId());
            outboundLine.setQuantity(line.getQuantity());
            outboundLine.setTaxUnitPrice(line.getTaxUnitPrice());
            outboundLine.setAmount(line.getAmount());
            outboundLineMapper.insert(outboundLine);

            StockLedger ledger = new StockLedger();
            ledger.setMaterialId(line.getMaterialId());
            ledger.setBatchId(line.getBatchId());
            ledger.setWarehouseId(delivery.getWarehouseId());
            ledger.setBizType("SALES_OUT");
            ledger.setDirection(-1);
            ledger.setQty(line.getQuantity());
            ledger.setSourceType("DL");
            ledger.setSourceId(delivery.getId());
            ledger.setOccurredAt(LocalDateTime.now());
            ledger.setRemark("发货单 " + delivery.getDeliveryNo() + " 出库");
            ledgerMapper.insert(ledger);
        }

        if (outboundMapper.markPosted(outbound.getId()) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "出库单状态已变化，请刷新后重试");
        }
        if (deliveryMapper.markShipped(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "发货单状态已变化，请刷新后重试");
        }

        return detail(id);
    }

    private String nextDeliveryNo() {
        Long sequence = deliveryMapper.nextDeliveryNoSeq();
        return "DL" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextOutboundNo() {
        Long sequence = outboundMapper.nextOutboundNoSeq();
        return "CK" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
