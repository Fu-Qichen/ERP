package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Delivery;
import com.jxbs.erp.demo.domain.view.DeliveryView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface DeliveryMapper extends BaseMapper<Delivery> {

    @Select("SELECT nextval('so_delivery_no_seq')")
    Long nextDeliveryNoSeq();

    @Select("""
            SELECT *
            FROM so_delivery
            WHERE id = #{id}
            FOR UPDATE
            """)
    Delivery selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE so_delivery
            SET status = 1, updated_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int markShipped(@Param("id") Long id);

    @Select("""
            <script>
            SELECT d.id,
                   d.delivery_no,
                   d.delivery_date,
                   d.order_id,
                   o.order_no,
                   d.customer_id,
                   c.customer_name,
                   d.warehouse_id,
                   w.warehouse_name,
                   d.status,
                   d.remark,
                   d.created_at,
                   ob.id AS outbound_id,
                   ob.outbound_no,
                   ob.status AS outbound_status
            FROM so_delivery d
            JOIN so_order o ON o.id = d.order_id
            JOIN md_customer c ON c.id = d.customer_id
            JOIN inv_warehouse w ON w.id = d.warehouse_id
            LEFT JOIN so_outbound ob ON ob.delivery_id = d.id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (d.delivery_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR o.order_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR c.customer_name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="status != null">AND d.status = #{status}</if>
            ORDER BY d.id DESC
            </script>
            """)
    IPage<DeliveryView> selectPageViews(IPage<DeliveryView> page,
                                        @Param("keyword") String keyword,
                                        @Param("status") Integer status);

    @Select("""
            SELECT d.id,
                   d.delivery_no,
                   d.delivery_date,
                   d.order_id,
                   o.order_no,
                   d.customer_id,
                   c.customer_name,
                   d.warehouse_id,
                   w.warehouse_name,
                   d.status,
                   d.remark,
                   d.created_at,
                   ob.id AS outbound_id,
                   ob.outbound_no,
                   ob.status AS outbound_status
            FROM so_delivery d
            JOIN so_order o ON o.id = d.order_id
            JOIN md_customer c ON c.id = d.customer_id
            JOIN inv_warehouse w ON w.id = d.warehouse_id
            LEFT JOIN so_outbound ob ON ob.delivery_id = d.id
            WHERE d.id = #{id}
            """)
    DeliveryView selectViewById(@Param("id") Long id);
}
