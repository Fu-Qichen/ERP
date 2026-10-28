package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Receipt;
import com.jxbs.erp.demo.domain.ReceiptDetail;
import com.jxbs.erp.demo.domain.Receivable;
import com.jxbs.erp.demo.domain.view.ReceiptView;
import com.jxbs.erp.demo.dto.ReceiptCreateRequest;
import com.jxbs.erp.demo.dto.ReceiptDetailRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.CustomerMapper;
import com.jxbs.erp.demo.mapper.ReceiptDetailMapper;
import com.jxbs.erp.demo.mapper.ReceiptMapper;
import com.jxbs.erp.demo.mapper.ReceivableMapper;
import com.jxbs.erp.demo.mapper.SettleMethodMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int AMOUNT_SCALE = 6;

    private final ReceiptMapper receiptMapper;
    private final ReceiptDetailMapper receiptDetailMapper;
    private final ReceivableMapper receivableMapper;
    private final CustomerMapper customerMapper;
    private final SettleMethodMapper settleMethodMapper;

    public ReceiptService(ReceiptMapper receiptMapper,
                          ReceiptDetailMapper receiptDetailMapper,
                          ReceivableMapper receivableMapper,
                          CustomerMapper customerMapper,
                          SettleMethodMapper settleMethodMapper) {
        this.receiptMapper = receiptMapper;
        this.receiptDetailMapper = receiptDetailMapper;
        this.receivableMapper = receivableMapper;
        this.customerMapper = customerMapper;
        this.settleMethodMapper = settleMethodMapper;
    }

    public IPage<ReceiptView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return receiptMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public ReceiptView detail(Long id) {
        ReceiptView view = receiptMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "收款单不存在");
        }
        view.setDetails(receiptDetailMapper.selectViews(id));
        return view;
    }

    /**
     * 收款并核销应收：先锁应收单，再核销；核销总额不能超过收款金额，也不能超过应收余额。
     */
    @Transactional
    public ReceiptView create(ReceiptCreateRequest request) {
        if (customerMapper.selectById(request.customerId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "客户不存在");
        }
        if (request.settleMethodId() != null
                && settleMethodMapper.selectById(request.settleMethodId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "结算方式不存在");
        }

        BigDecimal detailTotal = request.details().stream()
                .map(ReceiptDetailRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        BigDecimal amount = request.amount().setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
        if (detailTotal.compareTo(amount) != 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "核销金额合计必须等于收款金额");
        }

        Receipt receipt = new Receipt();
        receipt.setReceiptNo(nextReceiptNo());
        receipt.setReceiptDate(request.receiptDate());
        receipt.setCustomerId(request.customerId());
        receipt.setSettleMethodId(request.settleMethodId());
        receipt.setAmount(amount);
        receipt.setUsedAmount(amount);
        receipt.setStatus(0);
        receipt.setRemark(request.remark());
        receipt.setCreatedAt(LocalDateTime.now());
        receiptMapper.insert(receipt);

        for (ReceiptDetailRequest detailRequest : request.details()) {
            Receivable receivable = receivableMapper.selectByIdForUpdate(detailRequest.receivableId());
            if (receivable == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "应收单不存在：" + detailRequest.receivableId());
            }
            if (!receivable.getCustomerId().equals(request.customerId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "应收单不属于该客户：" + receivable.getReceivableNo());
            }
            BigDecimal amountToWrite = detailRequest.amount().setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);
            if (receivableMapper.writeOff(receivable.getId(), amountToWrite) == 0) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "应收单 " + receivable.getReceivableNo() + " 余额不足，不能核销该金额");
            }

            ReceiptDetail detail = new ReceiptDetail();
            detail.setReceiptId(receipt.getId());
            detail.setReceivableId(receivable.getId());
            detail.setAmount(amountToWrite);
            detail.setCreatedAt(LocalDateTime.now());
            receiptDetailMapper.insert(detail);
        }

        return detail(receipt.getId());
    }

    private String nextReceiptNo() {
        Long sequence = receiptMapper.nextReceiptNoSeq();
        return "RC" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
