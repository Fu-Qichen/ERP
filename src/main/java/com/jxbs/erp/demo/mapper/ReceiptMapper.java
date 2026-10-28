package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Receipt;
import com.jxbs.erp.demo.domain.view.ReceiptView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface ReceiptMapper extends BaseMapper<Receipt> {

    @Select("SELECT nextval('ar_receipt_no_seq')")
    Long nextReceiptNoSeq();

    @Select("""
            <script>
            SELECT r.id,
                   r.receipt_no,
                   r.receipt_date,
                   r.customer_id,
                   c.customer_name,
                   r.settle_method_id,
                   sm.method_name AS settle_method_name,
                   r.amount,
                   r.used_amount,
                   r.status,
                   r.remark,
                   r.created_at
            FROM ar_receipt r
            JOIN md_customer c ON c.id = r.customer_id
            LEFT JOIN md_settle_method sm ON sm.id = r.settle_method_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (r.receipt_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR c.customer_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY r.id DESC
            </script>
            """)
    IPage<ReceiptView> selectPageViews(IPage<ReceiptView> page,
                                       @Param("keyword") String keyword);

    @Select("""
            SELECT r.id,
                   r.receipt_no,
                   r.receipt_date,
                   r.customer_id,
                   c.customer_name,
                   r.settle_method_id,
                   sm.method_name AS settle_method_name,
                   r.amount,
                   r.used_amount,
                   r.status,
                   r.remark,
                   r.created_at
            FROM ar_receipt r
            JOIN md_customer c ON c.id = r.customer_id
            LEFT JOIN md_settle_method sm ON sm.id = r.settle_method_id
            WHERE r.id = #{id}
            """)
    ReceiptView selectViewById(@Param("id") Long id);
}
