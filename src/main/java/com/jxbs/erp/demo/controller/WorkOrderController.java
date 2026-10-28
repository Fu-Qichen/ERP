package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.BomLine;
import com.jxbs.erp.demo.domain.view.IssueRowView;
import com.jxbs.erp.demo.domain.view.ReportRowView;
import com.jxbs.erp.demo.domain.view.WorkOrderView;
import com.jxbs.erp.demo.dto.IssueRequest;
import com.jxbs.erp.demo.dto.ReportRequest;
import com.jxbs.erp.demo.dto.WorkOrderRequest;
import com.jxbs.erp.demo.service.WorkOrderService;
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

import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping
    public IPage<WorkOrderView> page(@RequestParam(defaultValue = "1") long current,
                                     @RequestParam(defaultValue = "10") long size,
                                     @RequestParam(required = false) String keyword,
                                     @RequestParam(required = false) Integer status) {
        return workOrderService.page(current, size, keyword, status);
    }

    @GetMapping("/{id}")
    public WorkOrderView detail(@PathVariable Long id) {
        return workOrderService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkOrderView create(@Valid @RequestBody WorkOrderRequest request) {
        return workOrderService.create(request);
    }

    @PostMapping("/{id}/release")
    public WorkOrderView release(@PathVariable Long id) {
        return workOrderService.release(id);
    }

    @PostMapping("/{id}/issue")
    public WorkOrderView issue(@PathVariable Long id, @Valid @RequestBody IssueRequest request) {
        return workOrderService.issue(id, request);
    }

    @PostMapping("/{id}/report")
    public WorkOrderView report(@PathVariable Long id, @Valid @RequestBody ReportRequest request) {
        return workOrderService.report(id, request.qty(), request.batchNo());
    }

    @GetMapping("/{id}/issues")
    public List<IssueRowView> issues(@PathVariable Long id) {
        return workOrderService.issues(id);
    }

    @GetMapping("/{id}/reports")
    public List<ReportRowView> reports(@PathVariable Long id) {
        return workOrderService.reports(id);
    }

    @GetMapping("/{id}/planned-components")
    public List<BomLine> plannedComponents(@PathVariable Long id) {
        return workOrderService.plannedComponents(id);
    }
}
