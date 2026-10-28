package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.PaymentView;
import com.jxbs.erp.demo.dto.PaymentCreateRequest;
import com.jxbs.erp.demo.service.PaymentService;
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
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public IPage<PaymentView> page(@RequestParam(defaultValue = "1") long current,
                                   @RequestParam(defaultValue = "10") long size,
                                   @RequestParam(required = false) String keyword) {
        return paymentService.page(current, size, keyword);
    }

    @GetMapping("/{id}")
    public PaymentView detail(@PathVariable Long id) {
        return paymentService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentView create(@Valid @RequestBody PaymentCreateRequest request) {
        return paymentService.create(request);
    }
}
