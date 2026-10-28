package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.StockLedger;
import com.jxbs.erp.demo.domain.view.LedgerView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface StockLedgerMapper extends BaseMapper<StockLedger> {

    @Select("""
            <script>
            SELECT l.id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.warehouse_id,
                   w.warehouse_name,
                   l.biz_type,
                   l.direction,
                   l.qty,
                   l.source_type,
                   l.source_id,
                   CASE l.source_type
                       WHEN 'SO' THEN (SELECT order_no FROM so_order WHERE id = l.source_id)
                       WHEN 'DL' THEN (SELECT delivery_no FROM so_delivery WHERE id = l.source_id)
                       WHEN 'PO' THEN (SELECT order_no FROM po_order WHERE id = l.source_id)
                       WHEN 'GR' THEN (SELECT receipt_no FROM po_receipt WHERE id = l.source_id)
                       ELSE NULL
                   END AS source_no,
                   l.occurred_at,
                   l.remark
            FROM inv_ledger l
            JOIN md_material m ON m.id = l.material_id
            JOIN inv_warehouse w ON w.id = l.warehouse_id
            WHERE 1 = 1
            <if test="materialId != null">AND l.material_id = #{materialId}</if>
            <if test="warehouseId != null">AND l.warehouse_id = #{warehouseId}</if>
            <if test="bizType != null and bizType != ''">AND l.biz_type = #{bizType}</if>
            <if test="keyword != null and keyword != ''">
                AND (m.code ILIKE CONCAT('%', #{keyword}, '%')
                     OR m.name ILIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY l.id DESC
            </script>
            """)
    IPage<LedgerView> selectPageViews(IPage<LedgerView> page,
                                      @Param("materialId") Long materialId,
                                      @Param("warehouseId") Long warehouseId,
                                      @Param("bizType") String bizType,
                                      @Param("keyword") String keyword);
}
