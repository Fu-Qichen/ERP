package com.jxbs.erp.demo.mapper;

import com.jxbs.erp.demo.domain.view.ReconcileRowView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ReconcileMapper {

    @Select("""
            <script>
            WITH ledger AS (
                SELECT material_id,
                       warehouse_id,
                       batch_id,
                       SUM(direction * qty) AS ledger_qty
                FROM inv_ledger
                GROUP BY material_id, warehouse_id, batch_id
            ),
            keys AS (
                SELECT material_id, warehouse_id, batch_id FROM inv_balance
                UNION
                SELECT material_id, warehouse_id, batch_id FROM ledger
            )
            SELECT k.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   k.warehouse_id,
                   w.warehouse_name,
                   k.batch_id,
                   bt.batch_no,
                   COALESCE(b.qty, 0) AS balance_qty,
                   COALESCE(l.ledger_qty, 0) AS ledger_qty,
                   COALESCE(b.qty, 0) - COALESCE(l.ledger_qty, 0) AS diff_qty,
                   CASE WHEN COALESCE(b.qty, 0) = COALESCE(l.ledger_qty, 0)
                        THEN 'MATCHED' ELSE 'DIFF' END AS status
            FROM keys k
            JOIN md_material m ON m.id = k.material_id
            JOIN inv_warehouse w ON w.id = k.warehouse_id
            LEFT JOIN inv_batch bt ON bt.id = k.batch_id
            LEFT JOIN inv_balance b ON b.material_id = k.material_id
                                    AND b.warehouse_id = k.warehouse_id
                                    AND COALESCE(b.batch_id, 0) = COALESCE(k.batch_id, 0)
            LEFT JOIN ledger l ON l.material_id = k.material_id
                              AND l.warehouse_id = k.warehouse_id
                              AND COALESCE(l.batch_id, 0) = COALESCE(k.batch_id, 0)
            WHERE 1 = 1
            <if test="warehouseId != null">AND k.warehouse_id = #{warehouseId}</if>
            <if test="onlyDiff">AND COALESCE(b.qty, 0) &lt;&gt; COALESCE(l.ledger_qty, 0)</if>
            ORDER BY status DESC, m.code, bt.expire_date NULLS LAST
            </script>
            """)
    List<ReconcileRowView> reconcile(@Param("warehouseId") Long warehouseId,
                                     @Param("onlyDiff") boolean onlyDiff);
}
