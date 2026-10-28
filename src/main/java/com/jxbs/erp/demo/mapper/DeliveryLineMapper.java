package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.DeliveryLine;
import com.jxbs.erp.demo.domain.view.DeliveryLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface DeliveryLineMapper extends BaseMapper<DeliveryLine> {

    @Select("""
            SELECT l.id,
                   l.order_line_id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.quantity,
                   l.tax_unit_price,
                   l.tax_rate,
                   l.amount
            FROM so_delivery_line l
            JOIN md_material m ON m.id = l.material_id
            WHERE l.delivery_id = #{deliveryId}
            ORDER BY l.id
            """)
    List<DeliveryLineView> selectViews(@Param("deliveryId") Long deliveryId);
}
