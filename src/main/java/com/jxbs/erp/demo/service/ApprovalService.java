package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Approval;
import com.jxbs.erp.demo.domain.ApprovalLog;
import com.jxbs.erp.demo.domain.view.ApprovalLogView;
import com.jxbs.erp.demo.domain.view.ApprovalView;
import com.jxbs.erp.demo.dto.ApprovalDecisionRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.ApprovalLogMapper;
import com.jxbs.erp.demo.mapper.ApprovalMapper;
import com.jxbs.erp.demo.mapper.PurchaseOrderMapper;
import com.jxbs.erp.demo.mapper.SalesOrderMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApprovalService {

    public static final String SALES_ORDER = "SALES_ORDER";
    public static final String PURCHASE_ORDER = "PURCHASE_ORDER";

    public static final int PENDING = 0;
    public static final int APPROVED = 1;
    public static final int REJECTED = 2;

    private final ApprovalMapper approvalMapper;
    private final ApprovalLogMapper logMapper;
    private final SalesOrderMapper salesOrderMapper;
    private final PurchaseOrderMapper purchaseOrderMapper;

    public ApprovalService(ApprovalMapper approvalMapper,
                           ApprovalLogMapper logMapper,
                           SalesOrderMapper salesOrderMapper,
                           PurchaseOrderMapper purchaseOrderMapper) {
        this.approvalMapper = approvalMapper;
        this.logMapper = logMapper;
        this.salesOrderMapper = salesOrderMapper;
        this.purchaseOrderMapper = purchaseOrderMapper;
    }

    /**
     * 提交审批：同一单据已有待审批记录时拒绝重复提交。
     */
    @Transactional
    public Approval submit(String bizType,
                           Long bizId,
                           String bizNo,
                           BigDecimal amount,
                           String approver,
                           String remark) {
        Approval existing = approvalMapper.selectLatest(bizType, bizId);
        if (existing != null && existing.getStatus() == PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "该单据已在审批中，不能重复提交");
        }
        Approval approval = new Approval();
        approval.setBizType(bizType);
        approval.setBizId(bizId);
        approval.setBizNo(bizNo);
        approval.setStatus(PENDING);
        approval.setCurrentStep(1);
        approval.setTotalSteps(1);
        approval.setAmount(amount);
        approval.setSubmitRemark(remark);
        approval.setSubmittedAt(LocalDateTime.now());
        approvalMapper.insert(approval);

        writeLog(approval.getId(), 1, "SUBMIT", approver, remark);
        return approval;
    }

    /**
     * 审批决定：通过则结算审批单，驳回则同步回落业务单据状态。
     */
    @Transactional
    public Approval decide(Long approvalId, ApprovalDecisionRequest request) {
        Approval approval = approvalMapper.selectByIdForUpdate(approvalId);
        if (approval == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "审批单不存在");
        }
        if (approval.getStatus() != PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "审批单已处理，不能重复审批");
        }
        int status = request.approved() ? APPROVED : REJECTED;
        if (approvalMapper.finish(approvalId, status, approval.getCurrentStep()) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "审批单状态已变化，请刷新后重试");
        }
        writeLog(approvalId, approval.getCurrentStep(),
                request.approved() ? "APPROVE" : "REJECT",
                request.approver(), request.remark());

        if (!request.approved()) {
            rollbackBusiness(approval);
        }
        return approvalMapper.selectById(approvalId);
    }

    /**
     * 驳回时把业务单据退回草稿，保证审批与单据状态一致。
     */
    private void rollbackBusiness(Approval approval) {
        if (SALES_ORDER.equals(approval.getBizType())) {
            salesOrderMapper.markDraft(approval.getBizId());
        } else if (PURCHASE_ORDER.equals(approval.getBizType())) {
            purchaseOrderMapper.markDraft(approval.getBizId());
        }
    }

    public Approval latest(String bizType, Long bizId) {
        return approvalMapper.selectLatest(bizType, bizId);
    }

    public List<ApprovalLogView> logs(Long approvalId) {
        return logMapper.selectViews(approvalId);
    }

    public List<ApprovalLogView> logsOf(String bizType, Long bizId) {
        Approval approval = approvalMapper.selectLatest(bizType, bizId);
        if (approval == null) {
            return List.of();
        }
        return logMapper.selectViews(approval.getId());
    }

    public IPage<ApprovalView> page(long current, long size, String bizType, Integer status, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return approvalMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                bizType,
                status,
                keyword
        );
    }

    public ApprovalView detail(Long id) {
        ApprovalView view = approvalMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "审批单不存在");
        }
        view.setLogs(logMapper.selectViews(id));
        return view;
    }

    public long pendingCount() {
        return approvalMapper.selectCount(
                Wrappers.<Approval>lambdaQuery().eq(Approval::getStatus, PENDING));
    }

    private void writeLog(Long approvalId, int step, String action, String approver, String remark) {
        ApprovalLog log = new ApprovalLog();
        log.setApprovalId(approvalId);
        log.setStep(step);
        log.setAction(action);
        log.setApprover(approver);
        log.setRemark(remark);
        log.setCreatedAt(LocalDateTime.now());
        logMapper.insert(log);
    }
}
