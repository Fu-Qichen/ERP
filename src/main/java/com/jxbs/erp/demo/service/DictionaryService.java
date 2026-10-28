package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.jxbs.erp.demo.domain.Currency;
import com.jxbs.erp.demo.domain.Customer;
import com.jxbs.erp.demo.domain.CustomerClass;
import com.jxbs.erp.demo.domain.PayCondition;
import com.jxbs.erp.demo.domain.SettleMethod;
import com.jxbs.erp.demo.domain.Supplier;
import com.jxbs.erp.demo.domain.SupplierClass;
import com.jxbs.erp.demo.dto.ClassRequest;
import com.jxbs.erp.demo.dto.CurrencyRequest;
import com.jxbs.erp.demo.dto.PayConditionRequest;
import com.jxbs.erp.demo.dto.SettleMethodRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.CurrencyMapper;
import com.jxbs.erp.demo.mapper.CustomerClassMapper;
import com.jxbs.erp.demo.mapper.CustomerMapper;
import com.jxbs.erp.demo.mapper.PayConditionMapper;
import com.jxbs.erp.demo.mapper.SettleMethodMapper;
import com.jxbs.erp.demo.mapper.SupplierClassMapper;
import com.jxbs.erp.demo.mapper.SupplierMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DictionaryService {

    private final CustomerClassMapper customerClassMapper;
    private final SupplierClassMapper supplierClassMapper;
    private final CurrencyMapper currencyMapper;
    private final SettleMethodMapper settleMethodMapper;
    private final PayConditionMapper payConditionMapper;
    private final CustomerMapper customerMapper;
    private final SupplierMapper supplierMapper;

    public DictionaryService(CustomerClassMapper customerClassMapper,
                             SupplierClassMapper supplierClassMapper,
                             CurrencyMapper currencyMapper,
                             SettleMethodMapper settleMethodMapper,
                             PayConditionMapper payConditionMapper,
                             CustomerMapper customerMapper,
                             SupplierMapper supplierMapper) {
        this.customerClassMapper = customerClassMapper;
        this.supplierClassMapper = supplierClassMapper;
        this.currencyMapper = currencyMapper;
        this.settleMethodMapper = settleMethodMapper;
        this.payConditionMapper = payConditionMapper;
        this.customerMapper = customerMapper;
        this.supplierMapper = supplierMapper;
    }

    @Transactional
    public CustomerClass createCustomerClass(ClassRequest request) {
        validateCustomerClassParent(null, request.parentId());
        CustomerClass item = new CustomerClass();
        applyCustomerClass(item, request);
        customerClassMapper.insert(item);
        return item;
    }

    @Transactional
    public CustomerClass updateCustomerClass(Long id, ClassRequest request) {
        CustomerClass item = customerClassMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "客户分类不存在");
        }
        validateCustomerClassParent(id, request.parentId());
        applyCustomerClass(item, request);
        customerClassMapper.updateById(item);
        return customerClassMapper.selectById(id);
    }

    @Transactional
    public void deleteCustomerClass(Long id) {
        if (customerClassMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "客户分类不存在");
        }
        if (customerClassMapper.selectCount(
                Wrappers.<CustomerClass>lambdaQuery().eq(CustomerClass::getParentId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类下还有子分类，不能删除");
        }
        if (customerMapper.selectCount(
                Wrappers.<Customer>lambdaQuery().eq(Customer::getClassId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类已被客户引用，不能删除");
        }
        customerClassMapper.deleteById(id);
    }

    @Transactional
    public SupplierClass createSupplierClass(ClassRequest request) {
        validateSupplierClassParent(null, request.parentId());
        SupplierClass item = new SupplierClass();
        applySupplierClass(item, request);
        supplierClassMapper.insert(item);
        return item;
    }

    @Transactional
    public SupplierClass updateSupplierClass(Long id, ClassRequest request) {
        SupplierClass item = supplierClassMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "供应商分类不存在");
        }
        validateSupplierClassParent(id, request.parentId());
        applySupplierClass(item, request);
        supplierClassMapper.updateById(item);
        return supplierClassMapper.selectById(id);
    }

    @Transactional
    public void deleteSupplierClass(Long id) {
        if (supplierClassMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "供应商分类不存在");
        }
        if (supplierClassMapper.selectCount(
                Wrappers.<SupplierClass>lambdaQuery().eq(SupplierClass::getParentId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类下还有子分类，不能删除");
        }
        if (supplierMapper.selectCount(
                Wrappers.<Supplier>lambdaQuery().eq(Supplier::getClassId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "分类已被供应商引用，不能删除");
        }
        supplierClassMapper.deleteById(id);
    }

    @Transactional
    public Currency createCurrency(CurrencyRequest request) {
        Currency item = new Currency();
        applyCurrency(item, request);
        currencyMapper.insert(item);
        return item;
    }

    @Transactional
    public Currency updateCurrency(Long id, CurrencyRequest request) {
        Currency item = currencyMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "币种不存在");
        }
        applyCurrency(item, request);
        currencyMapper.updateById(item);
        return currencyMapper.selectById(id);
    }

    @Transactional
    public void deleteCurrency(Long id) {
        if (currencyMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "币种不存在");
        }
        if (customerMapper.selectCount(
                Wrappers.<Customer>lambdaQuery().eq(Customer::getCurrencyId, id)) > 0
                || supplierMapper.selectCount(
                Wrappers.<Supplier>lambdaQuery().eq(Supplier::getCurrencyId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "币种已被客商引用，不能删除");
        }
        currencyMapper.deleteById(id);
    }

    @Transactional
    public SettleMethod createSettleMethod(SettleMethodRequest request) {
        SettleMethod item = new SettleMethod();
        applySettleMethod(item, request);
        settleMethodMapper.insert(item);
        return item;
    }

    @Transactional
    public SettleMethod updateSettleMethod(Long id, SettleMethodRequest request) {
        SettleMethod item = settleMethodMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "结算方式不存在");
        }
        applySettleMethod(item, request);
        settleMethodMapper.updateById(item);
        return settleMethodMapper.selectById(id);
    }

    @Transactional
    public void deleteSettleMethod(Long id) {
        if (settleMethodMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "结算方式不存在");
        }
        if (customerMapper.selectCount(
                Wrappers.<Customer>lambdaQuery().eq(Customer::getSettleMethodId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "结算方式已被客户引用，不能删除");
        }
        settleMethodMapper.deleteById(id);
    }

    @Transactional
    public PayCondition createPayCondition(PayConditionRequest request) {
        PayCondition item = new PayCondition();
        applyPayCondition(item, request);
        payConditionMapper.insert(item);
        return item;
    }

    @Transactional
    public PayCondition updatePayCondition(Long id, PayConditionRequest request) {
        PayCondition item = payConditionMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "付款条件不存在");
        }
        applyPayCondition(item, request);
        payConditionMapper.updateById(item);
        return payConditionMapper.selectById(id);
    }

    @Transactional
    public void deletePayCondition(Long id) {
        if (payConditionMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "付款条件不存在");
        }
        if (customerMapper.selectCount(
                Wrappers.<Customer>lambdaQuery().eq(Customer::getPayConditionId, id)) > 0
                || supplierMapper.selectCount(
                Wrappers.<Supplier>lambdaQuery().eq(Supplier::getPayConditionId, id)) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "付款条件已被客商引用，不能删除");
        }
        payConditionMapper.deleteById(id);
    }

    private void applyCustomerClass(CustomerClass item, ClassRequest request) {
        item.setClassCode(request.classCode());
        item.setClassName(request.className());
        item.setParentId(request.parentId());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applySupplierClass(SupplierClass item, ClassRequest request) {
        item.setClassCode(request.classCode());
        item.setClassName(request.className());
        item.setParentId(request.parentId());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applyCurrency(Currency item, CurrencyRequest request) {
        item.setCurrencyCode(request.currencyCode());
        item.setCurrencyName(request.currencyName());
        item.setExchangeRate(request.exchangeRate());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applySettleMethod(SettleMethod item, SettleMethodRequest request) {
        item.setMethodCode(request.methodCode());
        item.setMethodName(request.methodName());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applyPayCondition(PayCondition item, PayConditionRequest request) {
        item.setConditionCode(request.conditionCode());
        item.setConditionName(request.conditionName());
        item.setDays(request.days());
        item.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateCustomerClassParent(Long id, Long parentId) {
        if (parentId == null) {
            return;
        }
        if (id != null && id.equals(parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是自己");
        }
        Long cursor = parentId;
        while (cursor != null) {
            if (id != null && id.equals(cursor)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是当前分类的下级");
            }
            CustomerClass parent = customerClassMapper.selectById(cursor);
            if (parent == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不存在");
            }
            cursor = parent.getParentId();
        }
    }

    private void validateSupplierClassParent(Long id, Long parentId) {
        if (parentId == null) {
            return;
        }
        if (id != null && id.equals(parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是自己");
        }
        Long cursor = parentId;
        while (cursor != null) {
            if (id != null && id.equals(cursor)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不能是当前分类的下级");
            }
            SupplierClass parent = supplierClassMapper.selectById(cursor);
            if (parent == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级分类不存在");
            }
            cursor = parent.getParentId();
        }
    }
}
