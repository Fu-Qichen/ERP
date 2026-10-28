package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.PurchaseInbound;
import com.jxbs.erp.demo.domain.view.InboundView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface PurchaseInboundMapper extends BaseMapper<PurchaseInbound> {

    @Select("""
            <script>
            SELECT i.id,
                   i.inbound_no,
                   i.receipt_id,
                   r.receipt_no,
                   o.order_no,
                   s.supplier_name,
                   i.warehouse_id,
                   w.warehouse_name,
                   i.status,
                   i.posted_at,
                   i.created_at
            FROM po_inbound i
            JOIN po_receipt r ON r.id = i.receipt_id
            JOIN po_order o ON o.id = r.order_id
            JOIN md_supplier s ON s.id = r.supplier_id
            JOIN inv_warehouse w ON w.id = i.warehouse_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (i.inbound_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR r.receipt_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR o.order_no ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY i.id DESC
            </script>
            """)
    IPage<InboundView> selectPageViews(IPage<InboundView> page,
                                       @Param("keyword") String keyword);

    @Select("""
            SELECT i.id,
                   i.inbound_no,
                   i.receipt_id,
                   r.receipt_no,
                   o.order_no,
                   s.supplier_name,
                   i.warehouse_id,
                   w.warehouse_name,
                   i.status,
                   i.posted_at,
                   i.created_at
            FROM po_inbound i
            JOIN po_receipt r ON r.id = i.receipt_id
            JOIN po_order o ON o.id = r.order_id
            JOIN md_supplier s ON s.id = r.supplier_id
            JOIN inv_warehouse w ON w.id = i.warehouse_id
            WHERE i.id = #{id}
            """)
    InboundView selectViewById(@Param("id") Long id);

    @Select("SELECT nextval('po_inbound_no_seq')")
    Long nextInboundNoSeq();

    @Select("""
            SELECT *
            FROM po_inbound
            WHERE receipt_id = #{receiptId}
            FOR UPDATE
            """)
    PurchaseInbound selectByReceiptIdForUpdate(@Param("receiptId") Long receiptId);

    @Update("""
            UPDATE po_inbound
            SET status = 1, posted_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int markPosted(@Param("id") Long id);
}
