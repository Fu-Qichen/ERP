package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Invoice;
import com.jxbs.erp.demo.domain.view.InvoiceView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface InvoiceMapper extends BaseMapper<Invoice> {

    @Select("SELECT nextval('so_invoice_no_seq')")
    Long nextInvoiceNoSeq();

    @Select("""
            SELECT *
            FROM so_invoice
            WHERE delivery_id = #{deliveryId}
            FOR UPDATE
            """)
    Invoice selectByDeliveryIdForUpdate(@Param("deliveryId") Long deliveryId);

    @Select("""
            <script>
            SELECT i.id,
                   i.invoice_no,
                   i.invoice_date,
                   i.delivery_id,
                   d.delivery_no,
                   i.order_id,
                   o.order_no,
                   i.customer_id,
                   c.customer_name,
                   i.amount,
                   i.tax_amount,
                   i.total_amount,
                   i.status,
                   i.remark,
                   i.created_at,
                   r.receivable_no
            FROM so_invoice i
            JOIN so_delivery d ON d.id = i.delivery_id
            JOIN so_order o ON o.id = i.order_id
            JOIN md_customer c ON c.id = i.customer_id
            LEFT JOIN ar_receivable r ON r.invoice_id = i.id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (i.invoice_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR d.delivery_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR c.customer_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY i.id DESC
            </script>
            """)
    IPage<InvoiceView> selectPageViews(IPage<InvoiceView> page,
                                       @Param("keyword") String keyword);

    @Select("""
            SELECT i.id,
                   i.invoice_no,
                   i.invoice_date,
                   i.delivery_id,
                   d.delivery_no,
                   i.order_id,
                   o.order_no,
                   i.customer_id,
                   c.customer_name,
                   i.amount,
                   i.tax_amount,
                   i.total_amount,
                   i.status,
                   i.remark,
                   i.created_at,
                   r.receivable_no
            FROM so_invoice i
            JOIN so_delivery d ON d.id = i.delivery_id
            JOIN so_order o ON o.id = i.order_id
            JOIN md_customer c ON c.id = i.customer_id
            LEFT JOIN ar_receivable r ON r.invoice_id = i.id
            WHERE i.id = #{id}
            """)
    InvoiceView selectViewById(@Param("id") Long id);
}
