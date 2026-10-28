package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.PurchaseOrderLine;
import com.jxbs.erp.demo.domain.view.PurchaseOrderLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;

public interface PurchaseOrderLineMapper extends BaseMapper<PurchaseOrderLine> {

    @Update("""
            UPDATE po_order_line
            SET received_qty = received_qty + #{qty}
            WHERE id = #{id} AND received_qty + #{qty} <= quantity
            """)
    int addReceived(@Param("id") Long id, @Param("qty") BigDecimal qty);

    @Select("""
            SELECT l.id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.quantity,
                   l.tax_unit_price,
                   l.tax_rate,
                   l.amount,
                   l.received_qty
            FROM po_order_line l
            JOIN md_material m ON m.id = l.material_id
            WHERE l.order_id = #{orderId}
            ORDER BY l.id
            """)
    List<PurchaseOrderLineView> selectViews(@Param("orderId") Long orderId);
}
