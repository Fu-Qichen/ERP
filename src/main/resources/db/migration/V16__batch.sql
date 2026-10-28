-- 批次与序列号档案
CREATE TABLE inv_batch (
    id           BIGSERIAL PRIMARY KEY,
    material_id  BIGINT       NOT NULL REFERENCES md_material (id),
    batch_no     VARCHAR(64)  NOT NULL,
    produce_date DATE,
    expire_date  DATE,
    source_type  VARCHAR(32),
    source_id    BIGINT,
    status       SMALLINT     NOT NULL DEFAULT 1,
    remark       VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_inv_batch_material_no UNIQUE (material_id, batch_no),
    CONSTRAINT ck_inv_batch_date CHECK (expire_date IS NULL OR produce_date IS NULL OR expire_date >= produce_date)
);

CREATE INDEX idx_inv_batch_material ON inv_batch (material_id, expire_date);

COMMENT ON TABLE inv_batch IS '批次档案';
COMMENT ON COLUMN inv_batch.batch_no IS '批次号，同一物料内唯一';
COMMENT ON COLUMN inv_batch.source_type IS '来源单据类型：GR 采购收货 / WO 生产报工 / MANUAL 手工新建';
COMMENT ON COLUMN inv_batch.expire_date IS '到期日，用于出库批次按先到期先出排序';

-- 物料批次开关：0 不管批次，1 批次管理，2 序列号管理
ALTER TABLE md_material
    ADD COLUMN batch_mode SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN md_material.batch_mode IS '0 不管批次 1 批次管理 2 序列号管理';

-- 库存余额与流水增加批次维度
ALTER TABLE inv_balance
    ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);

ALTER TABLE inv_ledger
    ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);

-- 唯一键改为带上批次；非批次物料 batch_id 为空，用 0 参与比较保持单行
ALTER TABLE inv_balance
    DROP CONSTRAINT uk_inv_balance_material_warehouse;

CREATE UNIQUE INDEX uk_inv_balance_material_warehouse_batch
    ON inv_balance (material_id, warehouse_id, COALESCE(batch_id, 0));

CREATE INDEX idx_inv_ledger_batch ON inv_ledger (batch_id);

COMMENT ON COLUMN inv_balance.batch_id IS '批次，空表示该物料未启用批次管理';
COMMENT ON COLUMN inv_ledger.batch_id IS '批次，空表示该物料未启用批次管理';

-- 单据明细记录使用的批次
ALTER TABLE po_receipt_line ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);
ALTER TABLE po_inbound_line ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);
ALTER TABLE so_delivery_line ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);
ALTER TABLE so_outbound_line ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);
ALTER TABLE mfg_issue ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);
ALTER TABLE mfg_report ADD COLUMN batch_id BIGINT REFERENCES inv_batch (id);

COMMENT ON COLUMN po_receipt_line.batch_id IS '收货批次';
COMMENT ON COLUMN so_delivery_line.batch_id IS '发货批次';
COMMENT ON COLUMN mfg_issue.batch_id IS '领料批次';
COMMENT ON COLUMN mfg_report.batch_id IS '产成品批次';

-- 演示数据：给已有物料开启批次并补一批批次档案，方便验证
UPDATE md_material SET batch_mode = 1 WHERE code IN ('M-001', 'M-002');

INSERT INTO inv_batch (material_id, batch_no, produce_date, expire_date, source_type, remark)
SELECT m.id, b.batch_no, b.produce_date, b.expire_date, 'MANUAL', '期初演示批次'
FROM (VALUES ('M-001', 'B20261001', DATE '2026-10-01', DATE '2027-10-01'),
             ('M-001', 'B20261015', DATE '2026-10-15', DATE '2027-04-15'),
             ('M-002', 'B20261010', DATE '2026-10-10', DATE '2027-10-10')) AS b(code, batch_no, produce_date, expire_date)
         JOIN md_material m ON m.code = b.code;

-- 把现有余额与期初流水挂到最早到期的批次上，保证对账仍然一致
UPDATE inv_balance b
SET batch_id = (SELECT i.id
                FROM inv_batch i
                WHERE i.material_id = b.material_id
                ORDER BY i.expire_date NULLS LAST, i.id
                LIMIT 1)
WHERE b.batch_id IS NULL
  AND EXISTS (SELECT 1 FROM inv_batch i WHERE i.material_id = b.material_id);

UPDATE inv_ledger l
SET batch_id = (SELECT b.batch_id FROM inv_balance b WHERE b.material_id = l.material_id LIMIT 1)
WHERE l.batch_id IS NULL
  AND EXISTS (SELECT 1 FROM inv_batch i WHERE i.material_id = l.material_id);
