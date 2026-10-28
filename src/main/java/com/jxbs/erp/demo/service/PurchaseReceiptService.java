package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Batch;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.PurchaseInbound;
import com.jxbs.erp.demo.domain.PurchaseInboundLine;
import com.jxbs.erp.demo.domain.PurchaseOrder;
import com.jxbs.erp.demo.domain.PurchaseOrderLine;
import com.jxbs.erp.demo.domain.PurchaseReceipt;
import com.jxbs.erp.demo.domain.PurchaseReceiptLine;
import com.jxbs.erp.demo.domain.StockLedger;
import com.jxbs.erp.demo.domain.view.PurchaseReceiptView;
import com.jxbs.erp.demo.dto.PurchaseReceiptCreateRequest;
import com.jxbs.erp.demo.dto.PurchaseReceiptLineRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.InventoryBalanceMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.PurchaseInboundLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseInboundMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderMapper;
import com.jxbs.erp.demo.mapper.PurchaseReceiptLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseReceiptMapper;
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
public class PurchaseReceiptService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final PurchaseReceiptMapper receiptMapper;
    private final PurchaseReceiptLineMapper receiptLineMapper;
    private final PurchaseInboundMapper inboundMapper;
    private final PurchaseInboundLineMapper inboundLineMapper;
    private final PurchaseOrderMapper orderMapper;
    private final PurchaseOrderLineMapper orderLineMapper;
    private final InventoryBalanceMapper balanceMapper;
    private final StockLedgerMapper ledgerMapper;
    private final MaterialMapper materialMapper;
    private final BatchService batchService;

    public PurchaseReceiptService(PurchaseReceiptMapper receiptMapper,
                                  PurchaseReceiptLineMapper receiptLineMapper,
                                  PurchaseInboundMapper inboundMapper,
                                  PurchaseInboundLineMapper inboundLineMapper,
                                  PurchaseOrderMapper orderMapper,
                                  PurchaseOrderLineMapper orderLineMapper,
                                  InventoryBalanceMapper balanceMapper,
                                  StockLedgerMapper ledgerMapper,
                                  MaterialMapper materialMapper,
                                  BatchService batchService) {
        this.receiptMapper = receiptMapper;
        this.receiptLineMapper = receiptLineMapper;
        this.inboundMapper = inboundMapper;
        this.inboundLineMapper = inboundLineMapper;
        this.orderMapper = orderMapper;
        this.orderLineMapper = orderLineMapper;
        this.balanceMapper = balanceMapper;
        this.ledgerMapper = ledgerMapper;
        this.materialMapper = materialMapper;
        this.batchService = batchService;
    }

    public IPage<PurchaseReceiptView> page(long current, long size, String keyword, Integer status) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return receiptMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status
        );
    }

    public PurchaseReceiptView detail(Long id) {
        PurchaseReceiptView view = receiptMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "收货单不存在");
        }
        view.setLines(receiptLineMapper.selectViews(id));
        return view;
    }

    /**
     * 按已审核采购订单创建收货单。创建时只校验可收数量，不动库存。
     */
    @Transactional
    public PurchaseReceiptView create(PurchaseReceiptCreateRequest request) {
        PurchaseOrder order = orderMapper.selectByIdForUpdate(request.orderId());
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已审核采购订单可以收货");
        }

        Map<Long, PurchaseOrderLine> orderLines = new HashMap<>();
        orderLineMapper.selectList(
                        Wrappers.<PurchaseOrderLine>lambdaQuery()
                                .eq(PurchaseOrderLine::getOrderId, order.getId()))
                .forEach(line -> orderLines.put(line.getId(), line));

        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setReceiptNo(nextReceiptNo());
        receipt.setReceiptDate(request.receiptDate());
        receipt.setOrderId(order.getId());
        receipt.setSupplierId(order.getSupplierId());
        receipt.setWarehouseId(order.getWarehouseId());
        receipt.setStatus(0);
        receipt.setRemark(request.remark());
        receipt.setCreatedAt(LocalDateTime.now());
        receiptMapper.insert(receipt);

        for (PurchaseReceiptLineRequest lineRequest : request.lines()) {
            PurchaseOrderLine orderLine = orderLines.get(lineRequest.orderLineId());
            if (orderLine == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "订单明细不属于该采购订单");
            }
            if (orderLineMapper.addReceived(orderLine.getId(), lineRequest.quantity()) == 0) {
                Material material = materialMapper.selectById(orderLine.getMaterialId());
                String code = material == null ? String.valueOf(orderLine.getMaterialId()) : material.getCode();
                throw new BusinessException(HttpStatus.CONFLICT, "物料 " + code + " 收货数量超过订单未收数量");
            }

            PurchaseReceiptLine line = new PurchaseReceiptLine();
            line.setReceiptId(receipt.getId());
            line.setOrderLineId(orderLine.getId());
            line.setMaterialId(orderLine.getMaterialId());
            if (lineRequest.batchId() != null) {
                Batch batch = batchService.requireForIssue(orderLine.getMaterialId(), lineRequest.batchId());
                line.setBatchId(batch == null ? null : batch.getId());
            } else if (lineRequest.batchNo() != null && !lineRequest.batchNo().isBlank()) {
                Batch batch = batchService.resolveForStock(orderLine.getMaterialId(), lineRequest.batchNo(), "GR", null);
                line.setBatchId(batch == null ? null : batch.getId());
            }
            line.setQuantity(lineRequest.quantity());
            line.setTaxUnitPrice(orderLine.getTaxUnitPrice());
            line.setTaxRate(orderLine.getTaxRate());
            line.setAmount(lineRequest.quantity()
                    .multiply(orderLine.getTaxUnitPrice())
                    .setScale(6, RoundingMode.HALF_UP));
            receiptLineMapper.insert(line);
        }

        return detail(receipt.getId());
    }

    /**
     * 收货入库：增加库存、写库存流水、生成并过账入库单。重复入库被状态拦截。
     */
    @Transactional
    public PurchaseReceiptView receive(Long id) {
        PurchaseReceipt receipt = receiptMapper.selectByIdForUpdate(id);
        if (receipt == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "收货单不存在");
        }
        if (receipt.getStatus() != null && receipt.getStatus() != 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有待入库收货单可以入库");
        }

        List<PurchaseReceiptLine> lines = receiptLineMapper.selectList(
                Wrappers.<PurchaseReceiptLine>lambdaQuery()
                        .eq(PurchaseReceiptLine::getReceiptId, id)
                        .orderByAsc(PurchaseReceiptLine::getId)
        );
        if (lines.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "收货单没有明细");
        }

        PurchaseInbound inbound = new PurchaseInbound();
        inbound.setInboundNo(nextInboundNo());
        inbound.setReceiptId(receipt.getId());
        inbound.setWarehouseId(receipt.getWarehouseId());
        inbound.setStatus(0);
        inbound.setCreatedAt(LocalDateTime.now());
        inboundMapper.insert(inbound);

        for (PurchaseReceiptLine line : lines) {
            Long batchId = line.getBatchId();
            balanceMapper.addStock(line.getMaterialId(), receipt.getWarehouseId(), batchId, line.getQuantity());

            PurchaseInboundLine inboundLine = new PurchaseInboundLine();
            inboundLine.setInboundId(inbound.getId());
            inboundLine.setMaterialId(line.getMaterialId());
            inboundLine.setBatchId(batchId);
            inboundLine.setQuantity(line.getQuantity());
            inboundLine.setTaxUnitPrice(line.getTaxUnitPrice());
            inboundLineMapper.insert(inboundLine);

            StockLedger ledger = new StockLedger();
            ledger.setMaterialId(line.getMaterialId());
            ledger.setBatchId(batchId);
            ledger.setWarehouseId(receipt.getWarehouseId());
            ledger.setBizType("PURCHASE_IN");
            ledger.setDirection(1);
            ledger.setQty(line.getQuantity());
            ledger.setSourceType("GR");
            ledger.setSourceId(receipt.getId());
            ledger.setOccurredAt(LocalDateTime.now());
            ledger.setRemark("收货单 " + receipt.getReceiptNo() + " 入库");
            ledgerMapper.insert(ledger);
        }

        if (inboundMapper.markPosted(inbound.getId()) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "入库单状态已变化，请刷新后重试");
        }
        if (receiptMapper.markReceived(id) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "收货单状态已变化，请刷新后重试");
        }

        return detail(id);
    }

    private String nextReceiptNo() {
        Long sequence = receiptMapper.nextReceiptNoSeq();
        return "GR" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextInboundNo() {
        Long sequence = inboundMapper.nextInboundNoSeq();
        return "RK" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
