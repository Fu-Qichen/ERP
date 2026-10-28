package com.jxbs.erp.demo.controller;

import com.jxbs.erp.demo.domain.view.InventoryView;
import com.jxbs.erp.demo.mapper.InventoryBalanceMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MasterDataController {

    private final InventoryBalanceMapper balanceMapper;

    public MasterDataController(InventoryBalanceMapper balanceMapper) {
        this.balanceMapper = balanceMapper;
    }

    @GetMapping("/inventory")
    public List<InventoryView> inventory(@RequestParam(required = false) Long warehouseId,
                                         @RequestParam(required = false) Long materialId) {
        return balanceMapper.selectViews(warehouseId, materialId);
    }
}
