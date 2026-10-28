package com.jxbs.erp.demo.domain.view;

import java.math.BigDecimal;

public class ReconcileRowView {

    private Long materialId;
    private String materialCode;
    private String materialName;
    private Long warehouseId;
    private String warehouseName;
    private Long batchId;
    private String batchNo;
    private BigDecimal balanceQty;
    private BigDecimal ledgerQty;
    private BigDecimal diffQty;
    private String status;

    public Long getMaterialId() {
        return materialId;
    }

    public void setMaterialId(Long materialId) {
        this.materialId = materialId;
    }

    public String getMaterialCode() {
        return materialCode;
    }

    public void setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
    }

    public String getMaterialName() {
        return materialName;
    }

    public void setMaterialName(String materialName) {
        this.materialName = materialName;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public String getBatchNo() {
        return batchNo;
    }

    public void setBatchNo(String batchNo) {
        this.batchNo = batchNo;
    }

    public BigDecimal getBalanceQty() {
        return balanceQty;
    }

    public void setBalanceQty(BigDecimal balanceQty) {
        this.balanceQty = balanceQty;
    }

    public BigDecimal getLedgerQty() {
        return ledgerQty;
    }

    public void setLedgerQty(BigDecimal ledgerQty) {
        this.ledgerQty = ledgerQty;
    }

    public BigDecimal getDiffQty() {
        return diffQty;
    }

    public void setDiffQty(BigDecimal diffQty) {
        this.diffQty = diffQty;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
