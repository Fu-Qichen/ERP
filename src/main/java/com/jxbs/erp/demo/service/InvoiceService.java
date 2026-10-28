package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Delivery;
import com.jxbs.erp.demo.domain.DeliveryLine;
import com.jxbs.erp.demo.domain.Invoice;
import com.jxbs.erp.demo.domain.InvoiceLine;
import com.jxbs.erp.demo.domain.Receivable;
import com.jxbs.erp.demo.domain.view.InvoiceView;
import com.jxbs.erp.demo.domain.view.ReceivableView;
import com.jxbs.erp.demo.dto.InvoiceCreateRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.DeliveryLineMapper;
import com.jxbs.erp.demo.mapper.DeliveryMapper;
import com.jxbs.erp.demo.mapper.InvoiceLineMapper;
import com.jxbs.erp.demo.mapper.InvoiceMapper;
import com.jxbs.erp.demo.mapper.ReceivableMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InvoiceService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final InvoiceMapper invoiceMapper;
    private final InvoiceLineMapper invoiceLineMapper;
    private final DeliveryMapper deliveryMapper;
    private final DeliveryLineMapper deliveryLineMapper;
    private final ReceivableMapper receivableMapper;

    public InvoiceService(InvoiceMapper invoiceMapper,
                          InvoiceLineMapper invoiceLineMapper,
                          DeliveryMapper deliveryMapper,
                          DeliveryLineMapper deliveryLineMapper,
                          ReceivableMapper receivableMapper) {
        this.invoiceMapper = invoiceMapper;
        this.invoiceLineMapper = invoiceLineMapper;
        this.deliveryMapper = deliveryMapper;
        this.deliveryLineMapper = deliveryLineMapper;
        this.receivableMapper = receivableMapper;
    }

    public IPage<InvoiceView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return invoiceMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public InvoiceView detail(Long id) {
        InvoiceView view = invoiceMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售发票不存在");
        }
        view.setLines(invoiceLineMapper.selectViews(id));
        return view;
    }

    public IPage<ReceivableView> receivables(long current,
                                             long size,
                                             String keyword,
                                             Integer status,
                                             Long customerId,
                                             boolean openOnly) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return receivableMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status,
                customerId,
                openOnly
        );
    }

    /**
     * 按已出库发货单开票，并同步生成应收单。一张发货单只能开一次票。
     */
    @Transactional
    public InvoiceView create(InvoiceCreateRequest request) {
        Delivery delivery = deliveryMapper.selectByIdForUpdate(request.deliveryId());
        if (delivery == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "发货单不存在");
        }
        if (delivery.getStatus() == null || delivery.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "发货单未出库，不能开票");
        }
        if (invoiceMapper.selectByDeliveryIdForUpdate(delivery.getId()) != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "该发货单已开票");
        }

        List<DeliveryLine> lines = deliveryLineMapper.selectList(
                Wrappers.<DeliveryLine>lambdaQuery()
                        .eq(DeliveryLine::getDeliveryId, delivery.getId())
                        .orderByAsc(DeliveryLine::getId)
        );
        if (lines.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "发货单没有明细");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNo(nextInvoiceNo());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDeliveryId(delivery.getId());
        invoice.setOrderId(delivery.getOrderId());
        invoice.setCustomerId(delivery.getCustomerId());
        invoice.setStatus(0);
        invoice.setRemark(request.remark());

        BigDecimal amountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        for (DeliveryLine line : lines) {
            amountTotal = amountTotal.add(line.getAmount());
            taxTotal = taxTotal.add(taxOf(line.getAmount(), line.getTaxRate()));
        }
        amountTotal = amountTotal.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        taxTotal = taxTotal.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        invoice.setAmount(amountTotal);
        invoice.setTaxAmount(taxTotal);
        invoice.setTotalAmount(amountTotal);
        invoice.setCreatedAt(LocalDateTime.now());
        invoiceMapper.insert(invoice);

        for (DeliveryLine line : lines) {
            InvoiceLine invoiceLine = new InvoiceLine();
            invoiceLine.setInvoiceId(invoice.getId());
            invoiceLine.setDeliveryLineId(line.getId());
            invoiceLine.setMaterialId(line.getMaterialId());
            invoiceLine.setQuantity(line.getQuantity());
            invoiceLine.setTaxUnitPrice(line.getTaxUnitPrice());
            invoiceLine.setTaxRate(line.getTaxRate());
            invoiceLine.setAmount(line.getAmount());
            invoiceLine.setTaxAmount(taxOf(line.getAmount(), line.getTaxRate()));
            invoiceLineMapper.insert(invoiceLine);
        }

        Receivable receivable = new Receivable();
        receivable.setReceivableNo(nextReceivableNo());
        receivable.setInvoiceId(invoice.getId());
        receivable.setCustomerId(invoice.getCustomerId());
        receivable.setInvoiceDate(invoice.getInvoiceDate());
        receivable.setTotalAmount(invoice.getTotalAmount());
        receivable.setPaidAmount(BigDecimal.ZERO);
        receivable.setBalance(invoice.getTotalAmount());
        receivable.setStatus(invoice.getTotalAmount().signum() == 0 ? 2 : 0);
        receivable.setCreatedAt(LocalDateTime.now());
        receivableMapper.insert(receivable);

        return detail(invoice.getId());
    }

    private BigDecimal taxOf(BigDecimal amount, BigDecimal taxRate) {
        if (amount == null || taxRate == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal divisor = BigDecimal.valueOf(100).add(taxRate);
        return amount.multiply(taxRate)
                .divide(divisor, AMOUNT_SCALE, RoundingMode.HALF_UP);
    }

    private String nextInvoiceNo() {
        Long sequence = invoiceMapper.nextInvoiceNoSeq();
        return "INV" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextReceivableNo() {
        Long sequence = receivableMapper.nextReceivableNoSeq();
        return "AR" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
