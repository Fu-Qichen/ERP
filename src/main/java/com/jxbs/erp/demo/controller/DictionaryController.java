package com.jxbs.erp.demo.controller;

import com.jxbs.erp.demo.domain.Currency;
import com.jxbs.erp.demo.domain.CustomerClass;
import com.jxbs.erp.demo.domain.PayCondition;
import com.jxbs.erp.demo.domain.SettleMethod;
import com.jxbs.erp.demo.domain.SupplierClass;
import com.jxbs.erp.demo.dto.ClassRequest;
import com.jxbs.erp.demo.dto.CurrencyRequest;
import com.jxbs.erp.demo.dto.PayConditionRequest;
import com.jxbs.erp.demo.dto.SettleMethodRequest;
import com.jxbs.erp.demo.service.DictionaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @PostMapping("/customer-classes")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerClass createCustomerClass(@Valid @RequestBody ClassRequest request) {
        return dictionaryService.createCustomerClass(request);
    }

    @PutMapping("/customer-classes/{id}")
    public CustomerClass updateCustomerClass(@PathVariable Long id, @Valid @RequestBody ClassRequest request) {
        return dictionaryService.updateCustomerClass(id, request);
    }

    @DeleteMapping("/customer-classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomerClass(@PathVariable Long id) {
        dictionaryService.deleteCustomerClass(id);
    }

    @PostMapping("/supplier-classes")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierClass createSupplierClass(@Valid @RequestBody ClassRequest request) {
        return dictionaryService.createSupplierClass(request);
    }

    @PutMapping("/supplier-classes/{id}")
    public SupplierClass updateSupplierClass(@PathVariable Long id, @Valid @RequestBody ClassRequest request) {
        return dictionaryService.updateSupplierClass(id, request);
    }

    @DeleteMapping("/supplier-classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupplierClass(@PathVariable Long id) {
        dictionaryService.deleteSupplierClass(id);
    }

    @PostMapping("/currencies")
    @ResponseStatus(HttpStatus.CREATED)
    public Currency createCurrency(@Valid @RequestBody CurrencyRequest request) {
        return dictionaryService.createCurrency(request);
    }

    @PutMapping("/currencies/{id}")
    public Currency updateCurrency(@PathVariable Long id, @Valid @RequestBody CurrencyRequest request) {
        return dictionaryService.updateCurrency(id, request);
    }

    @DeleteMapping("/currencies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCurrency(@PathVariable Long id) {
        dictionaryService.deleteCurrency(id);
    }

    @PostMapping("/settle-methods")
    @ResponseStatus(HttpStatus.CREATED)
    public SettleMethod createSettleMethod(@Valid @RequestBody SettleMethodRequest request) {
        return dictionaryService.createSettleMethod(request);
    }

    @PutMapping("/settle-methods/{id}")
    public SettleMethod updateSettleMethod(@PathVariable Long id, @Valid @RequestBody SettleMethodRequest request) {
        return dictionaryService.updateSettleMethod(id, request);
    }

    @DeleteMapping("/settle-methods/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSettleMethod(@PathVariable Long id) {
        dictionaryService.deleteSettleMethod(id);
    }

    @PostMapping("/pay-conditions")
    @ResponseStatus(HttpStatus.CREATED)
    public PayCondition createPayCondition(@Valid @RequestBody PayConditionRequest request) {
        return dictionaryService.createPayCondition(request);
    }

    @PutMapping("/pay-conditions/{id}")
    public PayCondition updatePayCondition(@PathVariable Long id, @Valid @RequestBody PayConditionRequest request) {
        return dictionaryService.updatePayCondition(id, request);
    }

    @DeleteMapping("/pay-conditions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePayCondition(@PathVariable Long id) {
        dictionaryService.deletePayCondition(id);
    }
}
