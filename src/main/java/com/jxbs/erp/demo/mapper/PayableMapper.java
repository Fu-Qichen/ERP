package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Payable;
import com.jxbs.erp.demo.domain.view.PayableView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;

public interface PayableMapper extends BaseMapper<Payable> {

    @Select("SELECT nextval('ap_payable_no_seq')")
    Long nextPayableNoSeq();

    @Select("""
            SELECT *
            FROM ap_payable
            WHERE id = #{id}
            FOR UPDATE
            """)
    Payable selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE ap_payable
            SET paid_amount = paid_amount + #{amount},
                balance = balance - #{amount},
                status = CASE
                             WHEN balance - #{amount} <= 0 THEN 2
                             WHEN paid_amount + #{amount} > 0 THEN 1
                             ELSE 0
                         END
            WHERE id = #{id}
              AND balance >= #{amount}
            """)
    int writeOff(@Param("id") Long id, @Param("amount") BigDecimal amount);

    @Select("""
            <script>
            SELECT p.id,
                   p.payable_no,
                   p.invoice_id,
                   i.invoice_no,
                   p.supplier_id,
                   s.supplier_name,
                   p.invoice_date,
                   p.total_amount,
                   p.paid_amount,
                   p.balance,
                   p.status,
                   p.created_at
            FROM ap_payable p
            JOIN po_invoice i ON i.id = p.invoice_id
            JOIN md_supplier s ON s.id = p.supplier_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (p.payable_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR i.invoice_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR s.supplier_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND p.status = #{status}</if>
            <if test="supplierId != null">AND p.supplier_id = #{supplierId}</if>
            <if test="openOnly">AND p.balance &gt; 0</if>
            ORDER BY p.id DESC
            </script>
            """)
    IPage<PayableView> selectPageViews(IPage<PayableView> page,
                                       @Param("keyword") String keyword,
                                       @Param("status") Integer status,
                                       @Param("supplierId") Long supplierId,
                                       @Param("openOnly") boolean openOnly);
}
