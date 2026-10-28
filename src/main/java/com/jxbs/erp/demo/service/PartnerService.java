package com.jxbs.erp.demo.service;

import com.jxbs.erp.demo.domain.Customer;
import com.jxbs.erp.demo.domain.Supplier;
import com.jxbs.erp.demo.domain.view.CustomerView;
import com.jxbs.erp.demo.domain.view.SupplierView;
import com.jxbs.erp.demo.dto.CustomerRequest;
import com.jxbs.erp.demo.dto.SupplierRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.CurrencyMapper;
import com.jxbs.erp.demo.mapper.CustomerClassMapper;
import com.jxbs.erp.demo.mapper.CustomerMapper;
import com.jxbs.erp.demo.mapper.PayConditionMapper;
import com.jxbs.erp.demo.mapper.SettleMethodMapper;
import com.jxbs.erp.demo.mapper.StaffMapper;
import com.jxbs.erp.demo.mapper.SupplierClassMapper;
import com.jxbs.erp.demo.mapper.SupplierMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PartnerService {

    private final CustomerMapper customerMapper;
    private final SupplierMapper supplierMapper;
    private final CustomerClassMapper customerClassMapper;
    private final SupplierClassMapper supplierClassMapper;
    private final CurrencyMapper currencyMapper;
    private final StaffMapper staffMapper;
    private final SettleMethodMapper settleMethodMapper;
    private final PayConditionMapper payConditionMapper;

    public PartnerService(CustomerMapper customerMapper,
                          SupplierMapper supplierMapper,
                          CustomerClassMapper customerClassMapper,
                          SupplierClassMapper supplierClassMapper,
                          CurrencyMapper currencyMapper,
                          StaffMapper staffMapper,
                          SettleMethodMapper settleMethodMapper,
                          PayConditionMapper payConditionMapper) {
        this.customerMapper = customerMapper;
        this.supplierMapper = supplierMapper;
        this.customerClassMapper = customerClassMapper;
        this.supplierClassMapper = supplierClassMapper;
        this.currencyMapper = currencyMapper;
        this.staffMapper = staffMapper;
        this.settleMethodMapper = settleMethodMapper;
        this.payConditionMapper = payConditionMapper;
    }

    public List<CustomerView> customers() {
        return customerMapper.selectViews();
    }

    public List<SupplierView> suppliers() {
        return supplierMapper.selectViews();
    }

    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        validateCustomerRefs(request);
        Customer customer = new Customer();
        applyCustomer(customer, request);
        customerMapper.insert(customer);
        return customerMapper.selectById(customer.getId());
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerRequest request) {
        Customer existing = customerMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "客户不存在");
        }
        validateCustomerRefs(request);
        applyCustomer(existing, request);
        customerMapper.updateById(existing);
        return customerMapper.selectById(id);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        if (customerMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "客户不存在");
        }
        customerMapper.deleteById(id);
    }

    @Transactional
    public Supplier createSupplier(SupplierRequest request) {
        validateSupplierRefs(request);
        Supplier supplier = new Supplier();
        applySupplier(supplier, request);
        supplierMapper.insert(supplier);
        return supplierMapper.selectById(supplier.getId());
    }

    @Transactional
    public Supplier updateSupplier(Long id, SupplierRequest request) {
        Supplier existing = supplierMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "供应商不存在");
        }
        validateSupplierRefs(request);
        applySupplier(existing, request);
        supplierMapper.updateById(existing);
        return supplierMapper.selectById(id);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        if (supplierMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "供应商不存在");
        }
        supplierMapper.deleteById(id);
    }

    private void applyCustomer(Customer customer, CustomerRequest request) {
        customer.setCustomerCode(request.customerCode());
        customer.setCustomerName(request.customerName());
        customer.setClassId(request.classId());
        customer.setStaffId(request.staffId());
        customer.setCurrencyId(request.currencyId());
        customer.setSettleMethodId(request.settleMethodId());
        customer.setPayConditionId(request.payConditionId());
        customer.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applySupplier(Supplier supplier, SupplierRequest request) {
        supplier.setSupplierCode(request.supplierCode());
        supplier.setSupplierName(request.supplierName());
        supplier.setClassId(request.classId());
        supplier.setCurrencyId(request.currencyId());
        supplier.setPayConditionId(request.payConditionId());
        supplier.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateCustomerRefs(CustomerRequest request) {
        if (customerClassMapper.selectById(request.classId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "客户分类不存在");
        }
        if (currencyMapper.selectById(request.currencyId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "币种不存在");
        }
        if (request.staffId() != null && staffMapper.selectById(request.staffId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "业务员不存在");
        }
        if (request.settleMethodId() != null
                && settleMethodMapper.selectById(request.settleMethodId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "结算方式不存在");
        }
        if (request.payConditionId() != null
                && payConditionMapper.selectById(request.payConditionId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "付款条件不存在");
        }
    }

    private void validateSupplierRefs(SupplierRequest request) {
        if (supplierClassMapper.selectById(request.classId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "供应商分类不存在");
        }
        if (currencyMapper.selectById(request.currencyId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "币种不存在");
        }
        if (request.payConditionId() != null
                && payConditionMapper.selectById(request.payConditionId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "付款条件不存在");
        }
    }
}
