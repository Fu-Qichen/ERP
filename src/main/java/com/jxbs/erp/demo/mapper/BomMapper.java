package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Bom;
import com.jxbs.erp.demo.domain.view.BomView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface BomMapper extends BaseMapper<Bom> {

    @Update("""
            UPDATE mfg_bom
            SET status = #{status}, updated_at = now()
            WHERE id = #{id}
            """)
    int updateStatus(@Param("id") Long id, @Param("status") int status);

    @Select("""
            <script>
            SELECT b.id,
                   b.bom_code,
                   b.version,
                   b.base_qty,
                   b.product_id,
                   p.code AS product_code,
                   p.name AS product_name,
                   b.status,
                   b.remark
            FROM mfg_bom b
            JOIN md_material p ON p.id = b.product_id
            WHERE 1 = 1
            <if test="keyword != null and keyword != ''">
                AND (b.bom_code ILIKE CONCAT('%', #{keyword}, '%')
                     OR p.code ILIKE CONCAT('%', #{keyword}, '%')
                     OR p.name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY b.id DESC
            </script>
            """)
    IPage<BomView> selectPageViews(IPage<BomView> page,
                                   @Param("keyword") String keyword);

    @Select("""
            SELECT b.id,
                   b.bom_code,
                   b.version,
                   b.base_qty,
                   b.product_id,
                   p.code AS product_code,
                   p.name AS product_name,
                   b.status,
                   b.remark
            FROM mfg_bom b
            JOIN md_material p ON p.id = b.product_id
            WHERE b.id = #{id}
            """)
    BomView selectViewById(@Param("id") Long id);
}
