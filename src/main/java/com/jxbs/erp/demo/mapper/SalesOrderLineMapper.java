package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.SalesOrderLine;
import com.jxbs.erp.demo.domain.view.SalesOrderLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;

public interface SalesOrderLineMapper extends BaseMapper<SalesOrderLine> {

    @Update("""
            UPDATE so_order_line
            SET delivered_qty = delivered_qty + #{qty}
            WHERE id = #{id} AND delivered_qty + #{qty} <= quantity
            """)
    int addDelivered(@Param("id") Long id, @Param("qty") BigDecimal qty);

    @Select("""
            SELECT l.id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.quantity,
                   l.tax_unit_price,
                   l.tax_rate,
                   l.amount,
                   l.delivered_qty
            FROM so_order_line l
            JOIN md_material m ON m.id = l.material_id
            WHERE l.order_id = #{orderId}
            ORDER BY l.id
            """)
    List<SalesOrderLineView> selectViews(@Param("orderId") Long orderId);
}
