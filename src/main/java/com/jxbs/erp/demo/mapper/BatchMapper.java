package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Batch;
import com.jxbs.erp.demo.domain.view.BatchView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface BatchMapper extends BaseMapper<Batch> {

    @Select("""
            <script>
            SELECT b.id,
                   b.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   b.batch_no,
                   b.produce_date,
                   b.expire_date,
                   b.source_type,
                   b.source_id,
                   b.status,
                   b.remark,
                   b.created_at,
                   COALESCE((SELECT bal.qty
                             FROM inv_balance bal
                             WHERE bal.material_id = b.material_id
                               AND bal.batch_id = b.id
                             <if test="warehouseId != null">AND bal.warehouse_id = #{warehouseId}</if>
                            ), 0) AS available_qty
            FROM inv_batch b
            JOIN md_material m ON m.id = b.material_id
            <where>
                <if test="materialId != null">b.material_id = #{materialId}</if>
                <if test="keyword != null and keyword != ''">
                    AND (b.batch_no ILIKE CONCAT('%', #{keyword}, '%')
                         OR m.code ILIKE CONCAT('%', #{keyword}, '%')
                         OR m.name ILIKE CONCAT('%', #{keyword}, '%'))
                </if>
            </where>
            ORDER BY m.code, b.expire_date NULLS LAST, b.id DESC
            </script>
            """)
    IPage<BatchView> selectPageViews(IPage<BatchView> page,
                                     @Param("materialId") Long materialId,
                                     @Param("warehouseId") Long warehouseId,
                                     @Param("keyword") String keyword);

    @Select("""
            <script>
            SELECT b.id,
                   b.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   b.batch_no,
                   b.produce_date,
                   b.expire_date,
                   b.source_type,
                   b.source_id,
                   b.status,
                   b.remark,
                   b.created_at,
                   COALESCE(bal.qty, 0) AS available_qty
            FROM inv_batch b
            JOIN md_material m ON m.id = b.material_id
            LEFT JOIN inv_balance bal ON bal.material_id = b.material_id
                                      AND bal.batch_id = b.id
                                      AND bal.warehouse_id = #{warehouseId}
            WHERE b.material_id = #{materialId}
              AND b.status = 1
            ORDER BY b.expire_date NULLS LAST, b.id
            </script>
            """)
    List<BatchView> selectAvailable(@Param("materialId") Long materialId,
                                    @Param("warehouseId") Long warehouseId);

    @Select("""
            SELECT b.id,
                   b.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   b.batch_no,
                   b.produce_date,
                   b.expire_date,
                   b.source_type,
                   b.source_id,
                   b.status,
                   b.remark,
                   b.created_at,
                   0 AS available_qty
            FROM inv_batch b
            JOIN md_material m ON m.id = b.material_id
            WHERE b.id = #{id}
            """)
    BatchView selectViewById(@Param("id") Long id);
}
