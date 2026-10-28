package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.PayableView;
import com.jxbs.erp.demo.domain.view.PurchaseInvoiceView;
import com.jxbs.erp.demo.dto.PurchaseInvoiceCreateRequest;
import com.jxbs.erp.demo.service.PurchaseInvoiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PurchaseInvoiceController {

    private final PurchaseInvoiceService invoiceService;

    public PurchaseInvoiceController(PurchaseInvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/purchase-invoices")
    public IPage<PurchaseInvoiceView> invoices(@RequestParam(defaultValue = "1") long current,
                                               @RequestParam(defaultValue = "10") long size,
                                               @RequestParam(required = false) String keyword) {
        return invoiceService.page(current, size, keyword);
    }

    @GetMapping("/purchase-invoices/{id}")
    public PurchaseInvoiceView detail(@PathVariable Long id) {
        return invoiceService.detail(id);
    }

    @PostMapping("/purchase-invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseInvoiceView create(@Valid @RequestBody PurchaseInvoiceCreateRequest request) {
        return invoiceService.create(request);
    }

    @GetMapping("/payables")
    public IPage<PayableView> payables(@RequestParam(defaultValue = "1") long current,
                                       @RequestParam(defaultValue = "10") long size,
                                       @RequestParam(required = false) String keyword,
                                       @RequestParam(required = false) Integer status,
                                       @RequestParam(required = false) Long supplierId,
                                       @RequestParam(defaultValue = "false") boolean openOnly) {
        return invoiceService.payables(current, size, keyword, status, supplierId, openOnly);
    }
}
