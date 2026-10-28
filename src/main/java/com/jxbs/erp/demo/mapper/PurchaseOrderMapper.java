package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.PurchaseOrder;
import com.jxbs.erp.demo.domain.view.PurchaseOrderView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface PurchaseOrderMapper extends BaseMapper<PurchaseOrder> {

    @Select("SELECT nextval('po_order_no_seq')")
    Long nextOrderNoSeq();

    @Select("""
            SELECT *
            FROM po_order
            WHERE id = #{id}
            FOR UPDATE
            """)
    PurchaseOrder selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE po_order
            SET status = 1, updated_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int markAudited(@Param("id") Long id);

    @Update("""
            UPDATE po_order
            SET status = 2, updated_at = now()
            WHERE id = #{id} AND status = 1
            """)
    int markClosed(@Param("id") Long id);

    @Select("""
            <script>
            SELECT o.id,
                   o.order_no,
                   o.order_date,
                   o.supplier_id,
                   s.supplier_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.total_amount,
                   o.remark,
                   o.created_at
            FROM po_order o
            JOIN md_supplier s ON s.id = o.supplier_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (o.order_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR s.supplier_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND o.status = #{status}</if>
            ORDER BY o.id DESC
            </script>
            """)
    IPage<PurchaseOrderView> selectPageViews(IPage<PurchaseOrderView> page,
                                             @Param("keyword") String keyword,
                                             @Param("status") Integer status);

    @Select("""
            SELECT o.id,
                   o.order_no,
                   o.order_date,
                   o.supplier_id,
                   s.supplier_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.total_amount,
                   o.remark,
                   o.created_at
            FROM po_order o
            JOIN md_supplier s ON s.id = o.supplier_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE o.id = #{id}
            """)
    PurchaseOrderView selectViewById(@Param("id") Long id);
}
