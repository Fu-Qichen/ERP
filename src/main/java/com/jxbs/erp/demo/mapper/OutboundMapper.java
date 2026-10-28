package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Outbound;
import com.jxbs.erp.demo.domain.view.OutboundView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface OutboundMapper extends BaseMapper<Outbound> {

    @Select("""
            <script>
            SELECT o.id,
                   o.outbound_no,
                   o.delivery_id,
                   d.delivery_no,
                   so.order_no,
                   c.customer_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.posted_at,
                   o.created_at
            FROM so_outbound o
            JOIN so_delivery d ON d.id = o.delivery_id
            JOIN so_order so ON so.id = d.order_id
            JOIN md_customer c ON c.id = d.customer_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (o.outbound_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR d.delivery_no ILIKE CONCAT('%', #{keyword}, '%')
                     OR so.order_no ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY o.id DESC
            </script>
            """)
    IPage<OutboundView> selectPageViews(IPage<OutboundView> page,
                                        @Param("keyword") String keyword);

    @Select("""
            SELECT o.id,
                   o.outbound_no,
                   o.delivery_id,
                   d.delivery_no,
                   so.order_no,
                   c.customer_name,
                   o.warehouse_id,
                   w.warehouse_name,
                   o.status,
                   o.posted_at,
                   o.created_at
            FROM so_outbound o
            JOIN so_delivery d ON d.id = o.delivery_id
            JOIN so_order so ON so.id = d.order_id
            JOIN md_customer c ON c.id = d.customer_id
            JOIN inv_warehouse w ON w.id = o.warehouse_id
            WHERE o.id = #{id}
            """)
    OutboundView selectViewById(@Param("id") Long id);

    @Select("SELECT nextval('so_outbound_no_seq')")
    Long nextOutboundNoSeq();

    @Select("""
            SELECT *
            FROM so_outbound
            WHERE delivery_id = #{deliveryId}
            FOR UPDATE
            """)
    Outbound selectByDeliveryIdForUpdate(@Param("deliveryId") Long deliveryId);

    @Update("""
            UPDATE so_outbound
            SET status = 1, posted_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int markPosted(@Param("id") Long id);
}
