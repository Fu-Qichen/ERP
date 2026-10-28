package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.WorkOrder;
import com.jxbs.erp.demo.domain.view.WorkOrderView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface WorkOrderMapper extends BaseMapper<WorkOrder> {

    @Select("SELECT nextval('mfg_work_order_no_seq')")
    Long nextWorkOrderNoSeq();

    @Select("""
            SELECT *
            FROM mfg_work_order
            WHERE id = #{id}
            FOR UPDATE
            """)
    WorkOrder selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE mfg_work_order
            SET status = #{status}, updated_at = now()
            WHERE id = #{id} AND status = #{fromStatus}
            """)
    int changeStatus(@Param("id") Long id,
                     @Param("fromStatus") int fromStatus,
                     @Param("status") int status);

    @Update("""
            UPDATE mfg_work_order
            SET finish_qty = finish_qty + #{qty},
                status = CASE WHEN finish_qty + #{qty} >= plan_qty THEN 2 ELSE status END,
                updated_at = now()
            WHERE id = #{id} AND finish_qty + #{qty} <= plan_qty
            """)
    int addFinish(@Param("id") Long id, @Param("qty") java.math.BigDecimal qty);

    @Select("""
            <script>
            SELECT w.id,
                   w.work_order_no,
                   w.order_date,
                   w.product_id,
                   p.code AS product_code,
                   p.name AS product_name,
                   w.bom_id,
                   b.bom_code,
                   w.warehouse_id,
                   wh.warehouse_name,
                   w.plan_qty,
                   w.finish_qty,
                   COALESCE(SUM(i.qty), 0) AS issued_qty,
                   w.status,
                   w.remark,
                   w.created_at
            FROM mfg_work_order w
            JOIN md_material p ON p.id = w.product_id
            JOIN mfg_bom b ON b.id = w.bom_id
            JOIN inv_warehouse wh ON wh.id = w.warehouse_id
            LEFT JOIN mfg_issue i ON i.work_order_id = w.id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (w.work_order_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR p.code ILIKE CONCAT('%', #{keyword}, '%')
                     OR p.name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND w.status = #{status}</if>
            GROUP BY w.id, p.code, p.name, b.bom_code, wh.warehouse_name
            ORDER BY w.id DESC
            </script>
            """)
    IPage<WorkOrderView> selectPageViews(IPage<WorkOrderView> page,
                                         @Param("keyword") String keyword,
                                         @Param("status") Integer status);

    @Select("""
            SELECT w.id,
                   w.work_order_no,
                   w.order_date,
                   w.product_id,
                   p.code AS product_code,
                   p.name AS product_name,
                   w.bom_id,
                   b.bom_code,
                   w.warehouse_id,
                   wh.warehouse_name,
                   w.plan_qty,
                   w.finish_qty,
                   COALESCE(SUM(i.qty), 0) AS issued_qty,
                   w.status,
                   w.remark,
                   w.created_at
            FROM mfg_work_order w
            JOIN md_material p ON p.id = w.product_id
            JOIN mfg_bom b ON b.id = w.bom_id
            JOIN inv_warehouse wh ON wh.id = w.warehouse_id
            LEFT JOIN mfg_issue i ON i.work_order_id = w.id
            WHERE w.id = #{id}
            GROUP BY w.id, p.code, p.name, b.bom_code, wh.warehouse_name
            """)
    WorkOrderView selectViewById(@Param("id") Long id);
}
