-- V2 的初始库存直接写入 inv_balance，没有对应流水，导致对账差异。
-- 补一笔期初流水，使余额与流水一致。
INSERT INTO inv_ledger (material_id, warehouse_id, biz_type, direction, qty, source_type, source_id, occurred_at, remark)
SELECT b.material_id,
       b.warehouse_id,
       'OPENING',
       1,
       b.qty - COALESCE(l.ledger_qty, 0),
       'OPENING',
       0,
       TIMESTAMP '2026-10-01 00:00:00',
       '期初库存补记，修正余额与流水差异'
FROM inv_balance b
         LEFT JOIN (SELECT material_id, warehouse_id, SUM(direction * qty) AS ledger_qty
                    FROM inv_ledger
                    GROUP BY material_id, warehouse_id) l
                   ON l.material_id = b.material_id AND l.warehouse_id = b.warehouse_id
WHERE b.qty - COALESCE(l.ledger_qty, 0) <> 0;
