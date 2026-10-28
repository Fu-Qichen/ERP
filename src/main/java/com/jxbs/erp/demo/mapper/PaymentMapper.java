package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Payment;
import com.jxbs.erp.demo.domain.view.PaymentView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface PaymentMapper extends BaseMapper<Payment> {

    @Select("SELECT nextval('ap_payment_no_seq')")
    Long nextPaymentNoSeq();

    @Select("""
            <script>
            SELECT p.id,
                   p.payment_no,
                   p.payment_date,
                   p.supplier_id,
                   s.supplier_name,
                   p.settle_method_id,
                   sm.method_name AS settle_method_name,
                   p.amount,
                   p.used_amount,
                   p.status,
                   p.remark,
                   p.created_at
            FROM ap_payment p
            JOIN md_supplier s ON s.id = p.supplier_id
            LEFT JOIN md_settle_method sm ON sm.id = p.settle_method_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (p.payment_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR s.supplier_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY p.id DESC
            </script>
            """)
    IPage<PaymentView> selectPageViews(IPage<PaymentView> page,
                                       @Param("keyword") String keyword);

    @Select("""
            SELECT p.id,
                   p.payment_no,
                   p.payment_date,
                   p.supplier_id,
                   s.supplier_name,
                   p.settle_method_id,
                   sm.method_name AS settle_method_name,
                   p.amount,
                   p.used_amount,
                   p.status,
                   p.remark,
                   p.created_at
            FROM ap_payment p
            JOIN md_supplier s ON s.id = p.supplier_id
            LEFT JOIN md_settle_method sm ON sm.id = p.settle_method_id
            WHERE p.id = #{id}
            """)
    PaymentView selectViewById(@Param("id") Long id);
}
