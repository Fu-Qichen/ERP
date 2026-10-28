package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.ReceiptView;
import com.jxbs.erp.demo.dto.ReceiptCreateRequest;
import com.jxbs.erp.demo.service.ReceiptService;
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
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final ReceiptService receiptService;

    public ReceiptController(ReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @GetMapping
    public IPage<ReceiptView> page(@RequestParam(defaultValue = "1") long current,
                                   @RequestParam(defaultValue = "10") long size,
                                   @RequestParam(required = false) String keyword) {
        return receiptService.page(current, size, keyword);
    }

    @GetMapping("/{id}")
    public ReceiptView detail(@PathVariable Long id) {
        return receiptService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReceiptView create(@Valid @RequestBody ReceiptCreateRequest request) {
        return receiptService.create(request);
    }
}
