package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.view.ApprovalLogView;
import com.jxbs.erp.demo.domain.view.ApprovalView;
import com.jxbs.erp.demo.dto.ApprovalDecisionRequest;
import com.jxbs.erp.demo.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    public IPage<ApprovalView> page(@RequestParam(defaultValue = "1") long current,
                                    @RequestParam(defaultValue = "10") long size,
                                    @RequestParam(required = false) String bizType,
                                    @RequestParam(required = false) Integer status,
                                    @RequestParam(required = false) String keyword) {
        return approvalService.page(current, size, bizType, status, keyword);
    }

    @GetMapping("/{id}")
    public ApprovalView detail(@PathVariable Long id) {
        return approvalService.detail(id);
    }

    @PostMapping("/{id}/decide")
    public ApprovalView decide(@PathVariable Long id,
                               @Valid @RequestBody ApprovalDecisionRequest request) {
        approvalService.decide(id, request);
        return approvalService.detail(id);
    }

    @GetMapping("/logs")
    public List<ApprovalLogView> logs(@RequestParam String bizType,
                                      @RequestParam Long bizId) {
        return approvalService.logsOf(bizType, bizId);
    }

    @GetMapping("/pending-count")
    public long pendingCount() {
        return approvalService.pendingCount();
    }
}
