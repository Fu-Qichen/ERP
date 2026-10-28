package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.SalesOrderView;
import com.jxbs.erp.demo.dto.SalesOrderCreateRequest;
import com.jxbs.erp.demo.service.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    public IPage<SalesOrderView> page(@RequestParam(defaultValue = "1") long current,
                                      @RequestParam(defaultValue = "10") long size,
                                      @RequestParam(required = false) String keyword,
                                      @RequestParam(required = false) Integer status) {
        return salesOrderService.page(current, size, keyword, status);
    }

    @GetMapping("/{id}")
    public SalesOrderView detail(@PathVariable Long id) {
        return salesOrderService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalesOrderView create(@Valid @RequestBody SalesOrderCreateRequest request) {
        return salesOrderService.create(request);
    }

    @PostMapping("/{id}/audit")
    public SalesOrderView audit(@PathVariable Long id) {
        return salesOrderService.audit(id);
    }

    @PostMapping("/{id}/close")
    public SalesOrderView close(@PathVariable Long id) {
        return salesOrderService.close(id);
    }
}
