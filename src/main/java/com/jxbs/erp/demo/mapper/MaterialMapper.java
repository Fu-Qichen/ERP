package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.view.MaterialView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface MaterialMapper extends BaseMapper<Material> {

    @Select("""
            <script>
            SELECT m.id,
                   m.code,
                   m.name,
                   m.spec,
                   m.class_id,
                   c.class_code,
                   c.class_name,
                   m.uom_id,
                   u.unit_code,
                   u.unit_name,
                   m.batch_mode,
                   m.status,
                   m.created_at,
                   m.updated_at
            FROM md_material m
            LEFT JOIN md_material_class c ON c.id = m.class_id
            LEFT JOIN md_uom u ON u.id = m.uom_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (m.code ILIKE CONCAT('%', #{keyword}, '%')
                     OR m.name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="classId != null">AND m.class_id = #{classId}</if>
            ORDER BY m.id DESC
            </script>
            """)
    IPage<MaterialView> selectPageViews(IPage<MaterialView> page,
                                        @Param("keyword") String keyword,
                                        @Param("classId") Long classId);

    @Select("""
            SELECT m.id,
                   m.code,
                   m.name,
                   m.spec,
                   m.class_id,
                   c.class_code,
                   c.class_name,
                   m.uom_id,
                   u.unit_code,
                   u.unit_name,
                   m.batch_mode,
                   m.status,
                   m.created_at,
                   m.updated_at
            FROM md_material m
            LEFT JOIN md_material_class c ON c.id = m.class_id
            LEFT JOIN md_uom u ON u.id = m.uom_id
            WHERE m.id = #{id}
            """)
    MaterialView selectViewById(@Param("id") Long id);
}
