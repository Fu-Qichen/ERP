package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.BomView;
import com.jxbs.erp.demo.dto.BomRequest;
import com.jxbs.erp.demo.service.BomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/boms")
public class BomController {

    private final BomService bomService;

    public BomController(BomService bomService) {
        this.bomService = bomService;
    }

    @GetMapping
    public IPage<BomView> page(@RequestParam(defaultValue = "1") long current,
                               @RequestParam(defaultValue = "10") long size,
                               @RequestParam(required = false) String keyword) {
        return bomService.page(current, size, keyword);
    }

    @GetMapping("/{id}")
    public BomView detail(@PathVariable Long id) {
        return bomService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BomView create(@Valid @RequestBody BomRequest request) {
        return bomService.create(request);
    }

    @PutMapping("/{id}")
    public BomView update(@PathVariable Long id, @Valid @RequestBody BomRequest request) {
        return bomService.update(id, request);
    }

    @PostMapping("/{id}/status")
    public BomView changeStatus(@PathVariable Long id,
                                @RequestParam int status) {
        return bomService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bomService.delete(id);
    }
}
