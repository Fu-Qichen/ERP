package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Payable;
import com.jxbs.erp.demo.domain.Payment;
import com.jxbs.erp.demo.domain.PaymentDetail;
import com.jxbs.erp.demo.domain.view.PaymentView;
import com.jxbs.erp.demo.dto.PaymentCreateRequest;
import com.jxbs.erp.demo.dto.PaymentDetailRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.PayableMapper;
import com.jxbs.erp.demo.mapper.PaymentDetailMapper;
import com.jxbs.erp.demo.mapper.PaymentMapper;
import com.jxbs.erp.demo.mapper.SettleMethodMapper;
import com.jxbs.erp.demo.mapper.SupplierMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PaymentService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final PaymentMapper paymentMapper;
    private final PaymentDetailMapper paymentDetailMapper;
    private final PayableMapper payableMapper;
    private final SupplierMapper supplierMapper;
    private final SettleMethodMapper settleMethodMapper;

    public PaymentService(PaymentMapper paymentMapper,
                          PaymentDetailMapper paymentDetailMapper,
                          PayableMapper payableMapper,
                          SupplierMapper supplierMapper,
                          SettleMethodMapper settleMethodMapper) {
        this.paymentMapper = paymentMapper;
        this.paymentDetailMapper = paymentDetailMapper;
        this.payableMapper = payableMapper;
        this.supplierMapper = supplierMapper;
        this.settleMethodMapper = settleMethodMapper;
    }

    public IPage<PaymentView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return paymentMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public PaymentView detail(Long id) {
        PaymentView view = paymentMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "付款单不存在");
        }
        view.setDetails(paymentDetailMapper.selectViews(id));
        return view;
    }

    /**
     * 付款并核销应付：核销总额必须等于付款金额，单张应付不能超额核销。
     */
    @Transactional
    public PaymentView create(PaymentCreateRequest request) {
        if (supplierMapper.selectById(request.supplierId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "供应商不存在");
        }
        if (request.settleMethodId() != null
                && settleMethodMapper.selectById(request.settleMethodId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "结算方式不存在");
        }

        BigDecimal detailTotal = request.details().stream()
                .map(PaymentDetailRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        BigDecimal amount = request.amount().setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        if (detailTotal.compareTo(amount) != 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "核销金额合计必须等于付款金额");
        }

        Payment payment = new Payment();
        payment.setPaymentNo(nextPaymentNo());
        payment.setPaymentDate(request.paymentDate());
        payment.setSupplierId(request.supplierId());
        payment.setSettleMethodId(request.settleMethodId());
        payment.setAmount(amount);
        payment.setUsedAmount(amount);
        payment.setStatus(0);
        payment.setRemark(request.remark());
        payment.setCreatedAt(LocalDateTime.now());
        paymentMapper.insert(payment);

        for (PaymentDetailRequest detailRequest : request.details()) {
            Payable payable = payableMapper.selectByIdForUpdate(detailRequest.payableId());
            if (payable == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "应付单不存在：" + detailRequest.payableId());
            }
            if (!payable.getSupplierId().equals(request.supplierId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "应付单不属于该供应商：" + payable.getPayableNo());
            }
            BigDecimal amountToWrite = detailRequest.amount().setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
            if (payableMapper.writeOff(payable.getId(), amountToWrite) == 0) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "应付单 " + payable.getPayableNo() + " 余额不足，不能核销该金额");
            }

            PaymentDetail detail = new PaymentDetail();
            detail.setPaymentId(payment.getId());
            detail.setPayableId(payable.getId());
            detail.setAmount(amountToWrite);
            detail.setCreatedAt(LocalDateTime.now());
            paymentDetailMapper.insert(detail);
        }

        return detail(payment.getId());
    }

    private String nextPaymentNo() {
        Long sequence = paymentMapper.nextPaymentNoSeq();
        return "PY" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
