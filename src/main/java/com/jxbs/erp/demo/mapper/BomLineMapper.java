package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.BomLine;
import com.jxbs.erp.demo.domain.view.BomLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface BomLineMapper extends BaseMapper<BomLine> {

    @Select("""
            SELECT l.id,
                   l.component_id,
                   c.code AS component_code,
                   c.name AS component_name,
                   u.unit_name,
                   l.qty,
                   l.loss_rate
            FROM mfg_bom_line l
            JOIN md_material c ON c.id = l.component_id
            LEFT JOIN md_uom u ON u.id = c.uom_id
            WHERE l.bom_id = #{bomId}
            ORDER BY l.sort_no, l.id
            """)
    List<BomLineView> selectViews(@Param("bomId") Long bomId);
}
