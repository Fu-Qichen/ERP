package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.PaymentDetail;
import com.jxbs.erp.demo.domain.view.PaymentDetailView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface PaymentDetailMapper extends BaseMapper<PaymentDetail> {

    @Select("""
            SELECT d.id,
                   d.payable_id,
                   p.payable_no,
                   i.invoice_no,
                   d.amount
            FROM ap_payment_detail d
            JOIN ap_payable p ON p.id = d.payable_id
            JOIN po_invoice i ON i.id = p.invoice_id
            WHERE d.payment_id = #{paymentId}
            ORDER BY d.id
            """)
    List<PaymentDetailView> selectViews(@Param("paymentId") Long paymentId);
}
