package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.PurchaseReceiptView;
import com.jxbs.erp.demo.dto.PurchaseReceiptCreateRequest;
import com.jxbs.erp.demo.service.PurchaseReceiptService;
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
@RequestMapping("/api/purchase-receipts")
public class PurchaseReceiptController {

    private final PurchaseReceiptService receiptService;

    public PurchaseReceiptController(PurchaseReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @GetMapping
    public IPage<PurchaseReceiptView> page(@RequestParam(defaultValue = "1") long current,
                                           @RequestParam(defaultValue = "10") long size,
                                           @RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) Integer status) {
        return receiptService.page(current, size, keyword, status);
    }

    @GetMapping("/{id}")
    public PurchaseReceiptView detail(@PathVariable Long id) {
        return receiptService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseReceiptView create(@Valid @RequestBody PurchaseReceiptCreateRequest request) {
        return receiptService.create(request);
    }

    @PostMapping("/{id}/receive")
    public PurchaseReceiptView receive(@PathVariable Long id) {
        return receiptService.receive(id);
    }
}
