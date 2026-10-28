-- 批次方案回滚：撤销 V16 引入的批次维度，恢复「物料 + 仓库」单一库存维度
-- 步骤：先把批次余额聚合成物料 + 仓库一行，再改唯一键、删批次列与批次表

-- 1. 批次余额聚合到 (material_id, warehouse_id)
CREATE TEMP TABLE tmp_batch_merge ON COMMIT DROP AS
SELECT material_id,
       warehouse_id,
       SUM(qty)        AS qty,
       SUM(locked_qty) AS locked_qty,
       MIN(id)         AS keep_id
FROM inv_balance
GROUP BY material_id, warehouse_id;

-- 先删除被合并掉的重复行，只留每个组合里 id 最小的那一行
DELETE FROM inv_balance b
WHERE NOT EXISTS (SELECT 1 FROM tmp_batch_merge m WHERE m.keep_id = b.id);

-- 再把汇总数量写回保留行
UPDATE inv_balance b
SET qty = m.qty,
    locked_qty = m.locked_qty,
    updated_at = now()
FROM tmp_batch_merge m
WHERE b.id = m.keep_id;

-- 2. 唯一键恢复为 (material_id, warehouse_id)
DROP INDEX IF EXISTS uk_inv_balance_material_warehouse_batch;

ALTER TABLE inv_balance
    ADD CONSTRAINT uk_inv_balance_material_warehouse UNIQUE (material_id, warehouse_id);

-- 3. 删除批次列（先删索引，再删列）
DROP INDEX IF EXISTS idx_inv_ledger_batch;

ALTER TABLE inv_balance DROP COLUMN IF EXISTS batch_id;
ALTER TABLE inv_ledger DROP COLUMN IF EXISTS batch_id;

ALTER TABLE po_receipt_line DROP COLUMN IF EXISTS batch_id;
ALTER TABLE po_inbound_line DROP COLUMN IF EXISTS batch_id;
ALTER TABLE so_delivery_line DROP COLUMN IF EXISTS batch_id;
ALTER TABLE so_outbound_line DROP COLUMN IF EXISTS batch_id;
ALTER TABLE mfg_issue DROP COLUMN IF EXISTS batch_id;
ALTER TABLE mfg_report DROP COLUMN IF EXISTS batch_id;

-- 4. 删除批次档案表与物料批次开关
DROP TABLE IF EXISTS inv_batch;

ALTER TABLE md_material DROP COLUMN IF EXISTS batch_mode;
