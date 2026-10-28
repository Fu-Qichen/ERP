package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.InvoiceView;
import com.jxbs.erp.demo.domain.view.ReceivableView;
import com.jxbs.erp.demo.dto.InvoiceCreateRequest;
import com.jxbs.erp.demo.service.InvoiceService;
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
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/invoices")
    public IPage<InvoiceView> invoices(@RequestParam(defaultValue = "1") long current,
                                       @RequestParam(defaultValue = "10") long size,
                                       @RequestParam(required = false) String keyword) {
        return invoiceService.page(current, size, keyword);
    }

    @GetMapping("/invoices/{id}")
    public InvoiceView invoiceDetail(@PathVariable Long id) {
        return invoiceService.detail(id);
    }

    @PostMapping("/invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceView create(@Valid @RequestBody InvoiceCreateRequest request) {
        return invoiceService.create(request);
    }

    @GetMapping("/receivables")
    public IPage<ReceivableView> receivables(@RequestParam(defaultValue = "1") long current,
                                             @RequestParam(defaultValue = "10") long size,
                                             @RequestParam(required = false) String keyword,
                                             @RequestParam(required = false) Integer status,
                                             @RequestParam(required = false) Long customerId,
                                             @RequestParam(defaultValue = "false") boolean openOnly) {
        return invoiceService.receivables(current, size, keyword, status, customerId, openOnly);
    }
}
