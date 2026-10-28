package com.jxbs.erp.demo.controller;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.jxbs.erp.demo.domain.Customer;
import com.jxbs.erp.demo.domain.CustomerClass;
import com.jxbs.erp.demo.domain.Currency;
import com.jxbs.erp.demo.domain.PayCondition;
import com.jxbs.erp.demo.domain.SettleMethod;
import com.jxbs.erp.demo.domain.Supplier;
import com.jxbs.erp.demo.domain.SupplierClass;
import com.jxbs.erp.demo.domain.view.CustomerView;
import com.jxbs.erp.demo.domain.view.SupplierView;
import com.jxbs.erp.demo.dto.CustomerRequest;
import com.jxbs.erp.demo.dto.SupplierRequest;
import com.jxbs.erp.demo.mapper.CurrencyMapper;
import com.jxbs.erp.demo.mapper.CustomerClassMapper;
import com.jxbs.erp.demo.mapper.PayConditionMapper;
import com.jxbs.erp.demo.mapper.SettleMethodMapper;
import com.jxbs.erp.demo.mapper.SupplierClassMapper;
import com.jxbs.erp.demo.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PartnerController {

    private final PartnerService partnerService;
    private final CustomerClassMapper customerClassMapper;
    private final SupplierClassMapper supplierClassMapper;
    private final CurrencyMapper currencyMapper;
    private final SettleMethodMapper settleMethodMapper;
    private final PayConditionMapper payConditionMapper;

    public PartnerController(PartnerService partnerService,
                             CustomerClassMapper customerClassMapper,
                             SupplierClassMapper supplierClassMapper,
                             CurrencyMapper currencyMapper,
                             SettleMethodMapper settleMethodMapper,
                             PayConditionMapper payConditionMapper) {
        this.partnerService = partnerService;
        this.customerClassMapper = customerClassMapper;
        this.supplierClassMapper = supplierClassMapper;
        this.currencyMapper = currencyMapper;
        this.settleMethodMapper = settleMethodMapper;
        this.payConditionMapper = payConditionMapper;
    }

    @GetMapping("/customers")
    public List<CustomerView> customers() {
        return partnerService.customers();
    }

    @PostMapping("/customers")
    @ResponseStatus(HttpStatus.CREATED)
    public Customer createCustomer(@Valid @RequestBody CustomerRequest request) {
        return partnerService.createCustomer(request);
    }

    @PutMapping("/customers/{id}")
    public Customer updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return partnerService.updateCustomer(id, request);
    }

    @DeleteMapping("/customers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomer(@PathVariable Long id) {
        partnerService.deleteCustomer(id);
    }

    @GetMapping("/suppliers")
    public List<SupplierView> suppliers() {
        return partnerService.suppliers();
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    public Supplier createSupplier(@Valid @RequestBody SupplierRequest request) {
        return partnerService.createSupplier(request);
    }

    @PutMapping("/suppliers/{id}")
    public Supplier updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return partnerService.updateSupplier(id, request);
    }

    @DeleteMapping("/suppliers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupplier(@PathVariable Long id) {
        partnerService.deleteSupplier(id);
    }

    @GetMapping("/customer-classes")
    public List<CustomerClass> customerClasses() {
        return customerClassMapper.selectList(
                Wrappers.<CustomerClass>lambdaQuery()
                        .eq(CustomerClass::getStatus, 1)
                        .orderByAsc(CustomerClass::getClassCode)
        );
    }

    @GetMapping("/supplier-classes")
    public List<SupplierClass> supplierClasses() {
        return supplierClassMapper.selectList(
                Wrappers.<SupplierClass>lambdaQuery()
                        .eq(SupplierClass::getStatus, 1)
                        .orderByAsc(SupplierClass::getClassCode)
        );
    }

    @GetMapping("/currencies")
    public List<Currency> currencies() {
        return currencyMapper.selectList(
                Wrappers.<Currency>lambdaQuery()
                        .eq(Currency::getStatus, 1)
                        .orderByAsc(Currency::getCurrencyCode)
        );
    }

    @GetMapping("/settle-methods")
    public List<SettleMethod> settleMethods() {
        return settleMethodMapper.selectList(
                Wrappers.<SettleMethod>lambdaQuery()
                        .eq(SettleMethod::getStatus, 1)
                        .orderByAsc(SettleMethod::getMethodCode)
        );
    }

    @GetMapping("/pay-conditions")
    public List<PayCondition> payConditions() {
        return payConditionMapper.selectList(
                Wrappers.<PayCondition>lambdaQuery()
                        .eq(PayCondition::getStatus, 1)
                        .orderByAsc(PayCondition::getConditionCode)
        );
    }
}
