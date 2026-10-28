package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.SalesOrder;
import com.jxbs.erp.demo.domain.view.SalesOrderView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface SalesOrderMapper extends BaseMapper<SalesOrder> {

    @Select("SELECT nextval('so_order_no_seq')")
    Long nextOrderNoSeq();

    @Select("""
            SELECT *
            FROM so_order
            WHERE id = #{id}
            FOR UPDATE
            """)
    SalesOrder selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE so_order
            SET status = 1, updated_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int markAudited(@Param("id") Long id);

    @Update("""
            UPDATE so_order
            SET status = 2, updated_at = now()
            WHERE id = #{id} AND status = 1
            """)
    int markClosed(@Param("id") Long id);

    @Update("""
            UPDATE so_order
            SET status = 0, updated_at = now()
            WHERE id = #{id} AND status = 1
            """)
    int markDraft(@Param("id") Long id);

    @Select("""
            <script>
            SELECT o.id,
                   o.order_no,
                   o.order_date,
                   o.customer_id,
                   c.customer_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.total_amount,
                   o.remark,
                   o.created_at
            FROM so_order o
            JOIN md_customer c ON c.id = o.customer_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (o.order_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR c.customer_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND o.status = #{status}</if>
            ORDER BY o.id DESC
            </script>
            """)
    IPage<SalesOrderView> selectPageViews(IPage<SalesOrderView> page,
                                          @Param("keyword") String keyword,
                                          @Param("status") Integer status);

    @Select("""
            SELECT o.id,
                   o.order_no,
                   o.order_date,
                   o.customer_id,
                   c.customer_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.total_amount,
                   o.remark,
                   o.created_at
            FROM so_order o
            JOIN md_customer c ON c.id = o.customer_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE o.id = #{id}
            """)
    SalesOrderView selectViewById(@Param("id") Long id);
}
