package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.DeliveryView;
import com.jxbs.erp.demo.dto.DeliveryCreateRequest;
import com.jxbs.erp.demo.service.DeliveryService;
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
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public IPage<DeliveryView> page(@RequestParam(defaultValue = "1") long current,
                                    @RequestParam(defaultValue = "10") long size,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(required = false) Integer status) {
        return deliveryService.page(current, size, keyword, status);
    }

    @GetMapping("/{id}")
    public DeliveryView detail(@PathVariable Long id) {
        return deliveryService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryView create(@Valid @RequestBody DeliveryCreateRequest request) {
        return deliveryService.create(request);
    }

    @PostMapping("/{id}/ship")
    public DeliveryView ship(@PathVariable Long id) {
        return deliveryService.ship(id);
    }
}
