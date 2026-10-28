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

    @Update("""
            UPDATE inv_balance
            SET qty = qty - #{qty}, updated_at = now()
            WHERE material_id = #{materialId}
              AND warehouse_id = #{warehouseId}
              AND qty >= #{qty}
            """)
    int deduct(@Param("materialId") Long materialId,
               @Param("warehouseId") Long warehouseId,
               @Param("qty") BigDecimal qty);

    @Insert("""
            INSERT INTO inv_balance (material_id, warehouse_id, qty, locked_qty)
            VALUES (#{materialId}, #{warehouseId}, #{qty}, 0)
            ON CONFLICT (material_id, warehouse_id)
            DO UPDATE SET qty = inv_balance.qty + EXCLUDED.qty, updated_at = now()
            """)
    int addStock(@Param("materialId") Long materialId,
                 @Param("warehouseId") Long warehouseId,
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
                   b.locked_qty
            FROM inv_balance b
            JOIN md_material m ON m.id = b.material_id
            JOIN inv_warehouse w ON w.id = b.warehouse_id
            <where>
                <if test="warehouseId != null">b.warehouse_id = #{warehouseId}</if>
            </where>
            ORDER BY m.code
            </script>
            """)
    List<InventoryView> selectViews(@Param("warehouseId") Long warehouseId);
}
