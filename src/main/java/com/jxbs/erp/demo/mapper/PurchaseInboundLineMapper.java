package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.PurchaseInboundLine;
import com.jxbs.erp.demo.domain.view.InboundLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface PurchaseInboundLineMapper extends BaseMapper<PurchaseInboundLine> {

    @Select("""
            SELECT l.id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.quantity,
                   l.tax_unit_price
            FROM po_inbound_line l
            JOIN md_material m ON m.id = l.material_id
            WHERE l.inbound_id = #{inboundId}
            ORDER BY l.id
            """)
    List<InboundLineView> selectViews(@Param("inboundId") Long inboundId);
}
