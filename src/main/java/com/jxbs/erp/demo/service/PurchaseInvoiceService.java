package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Payable;
import com.jxbs.erp.demo.domain.PurchaseInvoice;
import com.jxbs.erp.demo.domain.PurchaseInvoiceLine;
import com.jxbs.erp.demo.domain.PurchaseReceipt;
import com.jxbs.erp.demo.domain.PurchaseReceiptLine;
import com.jxbs.erp.demo.domain.view.PayableView;
import com.jxbs.erp.demo.domain.view.PurchaseInvoiceView;
import com.jxbs.erp.demo.dto.PurchaseInvoiceCreateRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.PayableMapper;
import com.jxbs.erp.demo.mapper.PurchaseInvoiceLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseInvoiceMapper;
import com.jxbs.erp.demo.mapper.PurchaseReceiptLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseReceiptMapper;
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
public class PurchaseInvoiceService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final PurchaseInvoiceMapper invoiceMapper;
    private final PurchaseInvoiceLineMapper invoiceLineMapper;
    private final PurchaseReceiptMapper receiptMapper;
    private final PurchaseReceiptLineMapper receiptLineMapper;
    private final PayableMapper payableMapper;

    public PurchaseInvoiceService(PurchaseInvoiceMapper invoiceMapper,
                                  PurchaseInvoiceLineMapper invoiceLineMapper,
                                  PurchaseReceiptMapper receiptMapper,
                                  PurchaseReceiptLineMapper receiptLineMapper,
                                  PayableMapper payableMapper) {
        this.invoiceMapper = invoiceMapper;
        this.invoiceLineMapper = invoiceLineMapper;
        this.receiptMapper = receiptMapper;
        this.receiptLineMapper = receiptLineMapper;
        this.payableMapper = payableMapper;
    }

    public IPage<PurchaseInvoiceView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return invoiceMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public PurchaseInvoiceView detail(Long id) {
        PurchaseInvoiceView view = invoiceMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购发票不存在");
        }
        view.setLines(invoiceLineMapper.selectViews(id));
        return view;
    }

    public IPage<PayableView> payables(long current,
                                       long size,
                                       String keyword,
                                       Integer status,
                                       Long supplierId,
                                       boolean openOnly) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return payableMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status,
                supplierId,
                openOnly
        );
    }

    /**
     * 按已入库收货单开票并生成应付单。一张收货单只能开一次票。
     */
    @Transactional
    public PurchaseInvoiceView create(PurchaseInvoiceCreateRequest request) {
        PurchaseReceipt receipt = receiptMapper.selectByIdForUpdate(request.receiptId());
        if (receipt == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "收货单不存在");
        }
        if (receipt.getStatus() == null || receipt.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "收货单未入库，不能开票");
        }
        if (invoiceMapper.selectByReceiptIdForUpdate(receipt.getId()) != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "该收货单已开票");
        }

        List<PurchaseReceiptLine> lines = receiptLineMapper.selectList(
                Wrappers.<PurchaseReceiptLine>lambdaQuery()
                        .eq(PurchaseReceiptLine::getReceiptId, receipt.getId())
                        .orderByAsc(PurchaseReceiptLine::getId)
        );
        if (lines.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "收货单没有明细");
        }

        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setInvoiceNo(nextInvoiceNo());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setReceiptId(receipt.getId());
        invoice.setOrderId(receipt.getOrderId());
        invoice.setSupplierId(receipt.getSupplierId());
        invoice.setStatus(0);
        invoice.setRemark(request.remark());
        invoice.setCreatedAt(LocalDateTime.now());

        BigDecimal amountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        for (PurchaseReceiptLine line : lines) {
            amountTotal = amountTotal.add(line.getAmount());
            taxTotal = taxTotal.add(taxOf(line.getAmount(), line.getTaxRate()));
        }
        amountTotal = amountTotal.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        taxTotal = taxTotal.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        invoice.setAmount(amountTotal);
        invoice.setTaxAmount(taxTotal);
        invoice.setTotalAmount(amountTotal);
        invoiceMapper.insert(invoice);

        for (PurchaseReceiptLine line : lines) {
            PurchaseInvoiceLine invoiceLine = new PurchaseInvoiceLine();
            invoiceLine.setInvoiceId(invoice.getId());
            invoiceLine.setReceiptLineId(line.getId());
            invoiceLine.setMaterialId(line.getMaterialId());
            invoiceLine.setQuantity(line.getQuantity());
            invoiceLine.setTaxUnitPrice(line.getTaxUnitPrice());
            invoiceLine.setTaxRate(line.getTaxRate());
            invoiceLine.setAmount(line.getAmount());
            invoiceLine.setTaxAmount(taxOf(line.getAmount(), line.getTaxRate()));
            invoiceLineMapper.insert(invoiceLine);
        }

        Payable payable = new Payable();
        payable.setPayableNo(nextPayableNo());
        payable.setInvoiceId(invoice.getId());
        payable.setSupplierId(invoice.getSupplierId());
        payable.setInvoiceDate(invoice.getInvoiceDate());
        payable.setTotalAmount(invoice.getTotalAmount());
        payable.setPaidAmount(BigDecimal.ZERO);
        payable.setBalance(invoice.getTotalAmount());
        payable.setStatus(invoice.getTotalAmount().signum() == 0 ? 2 : 0);
        payable.setCreatedAt(LocalDateTime.now());
        payableMapper.insert(payable);

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
        return "PINV" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextPayableNo() {
        Long sequence = payableMapper.nextPayableNoSeq();
        return "AP" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
