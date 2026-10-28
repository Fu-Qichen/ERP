package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.PurchaseOrderView;
import com.jxbs.erp.demo.dto.ApprovalDecisionRequest;
import com.jxbs.erp.demo.dto.PurchaseOrderCreateRequest;
import com.jxbs.erp.demo.service.PurchaseOrderService;
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
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public IPage<PurchaseOrderView> page(@RequestParam(defaultValue = "1") long current,
                                         @RequestParam(defaultValue = "10") long size,
                                         @RequestParam(required = false) String keyword,
                                         @RequestParam(required = false) Integer status) {
        return purchaseOrderService.page(current, size, keyword, status);
    }

    @GetMapping("/{id}")
    public PurchaseOrderView detail(@PathVariable Long id) {
        return purchaseOrderService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrderView create(@Valid @RequestBody PurchaseOrderCreateRequest request) {
        return purchaseOrderService.create(request);
    }

    @PostMapping("/{id}/audit")
    public PurchaseOrderView audit(@PathVariable Long id) {
        return purchaseOrderService.audit(id);
    }

    @PostMapping("/{id}/close")
    public PurchaseOrderView close(@PathVariable Long id) {
        return purchaseOrderService.close(id);
    }

    @PostMapping("/{id}/decide")
    public PurchaseOrderView decide(@PathVariable Long id,
                                    @Valid @RequestBody ApprovalDecisionRequest request) {
        return purchaseOrderService.decide(id, request);
    }
}
