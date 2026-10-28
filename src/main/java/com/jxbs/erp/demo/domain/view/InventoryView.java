package com.jxbs.erp.demo.domain.view;

import java.math.BigDecimal;

public class InventoryView {

    private Long id;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private Long warehouseId;
    private String warehouseName;
    private BigDecimal qty;
    private BigDecimal lockedQty;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public BigDecimal getQty() {
        return qty;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }

    public BigDecimal getLockedQty() {
        return lockedQty;
    }

    public void setLockedQty(BigDecimal lockedQty) {
        this.lockedQty = lockedQty;
    }
}
