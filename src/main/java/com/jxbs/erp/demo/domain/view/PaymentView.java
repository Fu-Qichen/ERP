package com.jxbs.erp.demo.domain.view;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PaymentView {

    private Long id;
    private String paymentNo;
    private LocalDate paymentDate;
    private Long supplierId;
    private String supplierName;
    private Long settleMethodId;
    private String settleMethodName;
    private BigDecimal amount;
    private BigDecimal usedAmount;
    private Integer status;
    private String remark;
    private LocalDateTime createdAt;
    private List<PaymentDetailView> details;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPaymentNo() {
        return paymentNo;
    }

    public void setPaymentNo(String paymentNo) {
        this.paymentNo = paymentNo;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public Long getSettleMethodId() {
        return settleMethodId;
    }

    public void setSettleMethodId(Long settleMethodId) {
        this.settleMethodId = settleMethodId;
    }

    public String getSettleMethodName() {
        return settleMethodName;
    }

    public void setSettleMethodName(String settleMethodName) {
        this.settleMethodName = settleMethodName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public void setUsedAmount(BigDecimal usedAmount) {
        this.usedAmount = usedAmount;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<PaymentDetailView> getDetails() {
        return details;
    }

    public void setDetails(List<PaymentDetailView> details) {
        this.details = details;
    }
}
