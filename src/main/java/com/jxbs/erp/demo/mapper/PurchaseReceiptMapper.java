package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.PurchaseReceipt;
import com.jxbs.erp.demo.domain.view.PurchaseReceiptView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface PurchaseReceiptMapper extends BaseMapper<PurchaseReceipt> {

    @Select("SELECT nextval('po_receipt_no_seq')")
    Long nextReceiptNoSeq();

    @Select("""
            SELECT *
            FROM po_receipt
            WHERE id = #{id}
            FOR UPDATE
            """)
    PurchaseReceipt selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE po_receipt
            SET status = 1
            WHERE id = #{id} AND status = 0
            """)
    int markReceived(@Param("id") Long id);

    @Select("""
            <script>
            SELECT r.id,
                   r.receipt_no,
                   r.receipt_date,
                   r.order_id,
                   o.order_no,
                   r.supplier_id,
                   s.supplier_name,
                   r.warehouse_id,
                   w.warehouse_name,
                   r.status,
                   r.remark,
                   r.created_at,
                   i.inbound_no
            FROM po_receipt r
            JOIN po_order o ON o.id = r.order_id
            JOIN md_supplier s ON s.id = r.supplier_id
            JOIN inv_warehouse w ON w.id = r.warehouse_id
            LEFT JOIN po_inbound i ON i.receipt_id = r.id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (r.receipt_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR o.order_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR s.supplier_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND r.status = #{status}</if>
            ORDER BY r.id DESC
            </script>
            """)
    IPage<PurchaseReceiptView> selectPageViews(IPage<PurchaseReceiptView> page,
                                               @Param("keyword") String keyword,
                                               @Param("status") Integer status);

    @Select("""
            SELECT r.id,
                   r.receipt_no,
                   r.receipt_date,
                   r.order_id,
                   o.order_no,
                   r.supplier_id,
                   s.supplier_name,
                   r.warehouse_id,
                   w.warehouse_name,
                   r.status,
                   r.remark,
                   r.created_at,
                   i.inbound_no
            FROM po_receipt r
            JOIN po_order o ON o.id = r.order_id
            JOIN md_supplier s ON s.id = r.supplier_id
            JOIN inv_warehouse w ON w.id = r.warehouse_id
            LEFT JOIN po_inbound i ON i.receipt_id = r.id
            WHERE r.id = #{id}
            """)
    PurchaseReceiptView selectViewById(@Param("id") Long id);
}
