package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Receivable;
import com.jxbs.erp.demo.domain.view.ReceivableView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;

public interface ReceivableMapper extends BaseMapper<Receivable> {

    @Select("SELECT nextval('ar_receivable_no_seq')")
    Long nextReceivableNoSeq();

    @Select("""
            SELECT COALESCE(SUM(balance), 0)
            FROM ar_receivable
            WHERE status <> 2
            """)
    BigDecimal totalOutstanding();

    @Select("""
            SELECT COALESCE(SUM(balance), 0)
            FROM ar_receivable
            WHERE customer_id = #{customerId} AND status <> 2
            """)
    BigDecimal outstandingByCustomer(@Param("customerId") Long customerId);

    @Select("""
            SELECT *
            FROM ar_receivable
            WHERE id = #{id}
            FOR UPDATE
            """)
    Receivable selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE ar_receivable
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
            SELECT r.id,
                   r.receivable_no,
                   r.invoice_id,
                   i.invoice_no,
                   r.customer_id,
                   c.customer_name,
                   r.invoice_date,
                   r.total_amount,
                   r.paid_amount,
                   r.balance,
                   r.status,
                   r.created_at
            FROM ar_receivable r
            JOIN so_invoice i ON i.id = r.invoice_id
            JOIN md_customer c ON c.id = r.customer_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (r.receivable_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR i.invoice_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR c.customer_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND r.status = #{status}</if>
            <if test="customerId != null">AND r.customer_id = #{customerId}</if>
            <if test="openOnly">AND r.balance &gt; 0</if>
            ORDER BY r.id DESC
            </script>
            """)
    IPage<ReceivableView> selectPageViews(IPage<ReceivableView> page,
                                          @Param("keyword") String keyword,
                                          @Param("status") Integer status,
                                          @Param("customerId") Long customerId,
                                          @Param("openOnly") boolean openOnly);
}
