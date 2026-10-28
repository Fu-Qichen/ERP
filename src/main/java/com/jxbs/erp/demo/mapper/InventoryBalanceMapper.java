package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.InventoryBalance;
import com.jxbs.erp.demo.domain.view.InventoryView;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;

public interface InventoryBalanceMapper extends BaseMapper<InventoryBalance> {

    /**
     * 条件扣减：库存不足时返回 0。按批次维度定位余额行，非批次物料 batchId 为空。
     */
    @Update("""
            UPDATE inv_balance
            SET qty = qty - #{qty}, updated_at = now()
            WHERE material_id = #{materialId}
              AND warehouse_id = #{warehouseId}
              AND COALESCE(batch_id, 0) = COALESCE(#{batchId}, 0)
              AND qty >= #{qty}
            """)
    int deduct(@Param("materialId") Long materialId,
               @Param("warehouseId") Long warehouseId,
               @Param("batchId") Long batchId,
               @Param("qty") BigDecimal qty);

    /**
     * 入库累加：不存在则插入。冲突键是 (material_id, warehouse_id, COALESCE(batch_id, 0)) 唯一索引。
     */
    @Insert("""
            INSERT INTO inv_balance (material_id, warehouse_id, batch_id, qty, locked_qty)
            VALUES (#{materialId}, #{warehouseId}, #{batchId}, #{qty}, 0)
            ON CONFLICT (material_id, warehouse_id, COALESCE(batch_id, 0))
            DO UPDATE SET qty = inv_balance.qty + EXCLUDED.qty, updated_at = now()
            """)
    int addStock(@Param("materialId") Long materialId,
                 @Param("warehouseId") Long warehouseId,
                 @Param("batchId") Long batchId,
                 @Param("qty") BigDecimal qty);

    @Select("""
            <script>
            SELECT b.id,
                   b.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   b.warehouse_id,
                   w.warehouse_name,
                   b.qty,
                   b.locked_qty,
                   b.batch_id,
                   bt.batch_no,
                   bt.expire_date
            FROM inv_balance b
            JOIN md_material m ON m.id = b.material_id
            JOIN inv_warehouse w ON w.id = b.warehouse_id
            LEFT JOIN inv_batch bt ON bt.id = b.batch_id
            <where>
                <if test="warehouseId != null">b.warehouse_id = #{warehouseId}</if>
                <if test="materialId != null">b.material_id = #{materialId}</if>
            </where>
            ORDER BY m.code, bt.expire_date NULLS LAST
            </script>
            """)
    List<InventoryView> selectViews(@Param("warehouseId") Long warehouseId,
                                    @Param("materialId") Long materialId);
}
