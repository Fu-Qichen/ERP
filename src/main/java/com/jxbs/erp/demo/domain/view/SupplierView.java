package com.jxbs.erp.demo.domain.view;

public class SupplierView {

    private Long id;
    private String supplierCode;
    private String supplierName;
    private Long classId;
    private String className;
    private Long currencyId;
    private String currencyName;
    private Long payConditionId;
    private String payConditionName;
    private Integer status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSupplierCode() {
        return supplierCode;
    }

    public void setSupplierCode(String supplierCode) {
        this.supplierCode = supplierCode;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Long getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Long currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyName() {
        return currencyName;
    }

    public void setCurrencyName(String currencyName) {
        this.currencyName = currencyName;
    }

    public Long getPayConditionId() {
        return payConditionId;
    }

    public void setPayConditionId(Long payConditionId) {
        this.payConditionId = payConditionId;
    }

    public String getPayConditionName() {
        return payConditionName;
    }

    public void setPayConditionName(String payConditionName) {
        this.payConditionName = payConditionName;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
