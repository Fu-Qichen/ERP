package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.OutboundLine;
import com.jxbs.erp.demo.domain.view.OutboundLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface OutboundLineMapper extends BaseMapper<OutboundLine> {

    @Select("""
            SELECT l.id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.quantity,
                   l.tax_unit_price,
                   l.amount
            FROM so_outbound_line l
            JOIN md_material m ON m.id = l.material_id
            WHERE l.outbound_id = #{outboundId}
            ORDER BY l.id
            """)
    List<OutboundLineView> selectViews(@Param("outboundId") Long outboundId);
}
