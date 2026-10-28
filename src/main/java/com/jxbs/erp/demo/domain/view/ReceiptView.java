package com.jxbs.erp.demo.domain.view;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ReceiptView {

    private Long id;
    private String receiptNo;
    private LocalDate receiptDate;
    private Long customerId;
    private String customerName;
    private Long settleMethodId;
    private String settleMethodName;
    private BigDecimal amount;
    private BigDecimal usedAmount;
    private Integer status;
    private String remark;
    private LocalDateTime createdAt;
    private List<ReceiptDetailView> details;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNo() {
        return receiptNo;
    }

    public void setReceiptNo(String receiptNo) {
        this.receiptNo = receiptNo;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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

    public List<ReceiptDetailView> getDetails() {
        return details;
    }

    public void setDetails(List<ReceiptDetailView> details) {
        this.details = details;
    }
}
