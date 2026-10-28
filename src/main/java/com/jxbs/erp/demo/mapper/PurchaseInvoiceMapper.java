package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.PurchaseInvoice;
import com.jxbs.erp.demo.domain.view.PurchaseInvoiceView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface PurchaseInvoiceMapper extends BaseMapper<PurchaseInvoice> {

    @Select("SELECT nextval('po_invoice_no_seq')")
    Long nextInvoiceNoSeq();

    @Select("""
            SELECT *
            FROM po_invoice
            WHERE receipt_id = #{receiptId}
            FOR UPDATE
            """)
    PurchaseInvoice selectByReceiptIdForUpdate(@Param("receiptId") Long receiptId);

    @Select("""
            <script>
            SELECT i.id,
                   i.invoice_no,
                   i.invoice_date,
                   i.receipt_id,
                   r.receipt_no,
                   i.order_id,
                   o.order_no,
                   i.supplier_id,
                   s.supplier_name,
                   i.amount,
                   i.tax_amount,
                   i.total_amount,
                   i.status,
                   i.remark,
                   i.created_at,
                   p.payable_no
            FROM po_invoice i
            JOIN po_receipt r ON r.id = i.receipt_id
            JOIN po_order o ON o.id = i.order_id
            JOIN md_supplier s ON s.id = i.supplier_id
            LEFT JOIN ap_payable p ON p.invoice_id = i.id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (i.invoice_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR r.receipt_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR s.supplier_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY i.id DESC
            </script>
            """)
    IPage<PurchaseInvoiceView> selectPageViews(IPage<PurchaseInvoiceView> page,
                                               @Param("keyword") String keyword);

    @Select("""
            SELECT i.id,
                   i.invoice_no,
                   i.invoice_date,
                   i.receipt_id,
                   r.receipt_no,
                   i.order_id,
                   o.order_no,
                   i.supplier_id,
                   s.supplier_name,
                   i.amount,
                   i.tax_amount,
                   i.total_amount,
                   i.status,
                   i.remark,
                   i.created_at,
                   p.payable_no
            FROM po_invoice i
            JOIN po_receipt r ON r.id = i.receipt_id
            JOIN po_order o ON o.id = i.order_id
            JOIN md_supplier s ON s.id = i.supplier_id
            LEFT JOIN ap_payable p ON p.invoice_id = i.id
            WHERE i.id = #{id}
            """)
    PurchaseInvoiceView selectViewById(@Param("id") Long id);
}
