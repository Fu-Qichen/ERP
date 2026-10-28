CREATE TABLE md_customer (
    id            BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(32)  NOT NULL,
    customer_name VARCHAR(128) NOT NULL,
    status        SMALLINT     NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_customer_code UNIQUE (customer_code)
);

CREATE TABLE inv_warehouse (
    id             BIGSERIAL PRIMARY KEY,
    warehouse_code VARCHAR(32)  NOT NULL,
    warehouse_name VARCHAR(128) NOT NULL,
    status         SMALLINT     NOT NULL DEFAULT 1,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_inv_warehouse_code UNIQUE (warehouse_code)
);

CREATE TABLE inv_balance (
    id           BIGSERIAL PRIMARY KEY,
    material_id  BIGINT        NOT NULL REFERENCES md_material (id),
    warehouse_id BIGINT        NOT NULL REFERENCES inv_warehouse (id),
    qty          NUMERIC(17, 6) NOT NULL DEFAULT 0,
    locked_qty   NUMERIC(17, 6) NOT NULL DEFAULT 0,
    updated_at   TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT uk_inv_balance_material_warehouse UNIQUE (material_id, warehouse_id)
);

CREATE TABLE inv_ledger (
    id           BIGSERIAL PRIMARY KEY,
    material_id  BIGINT         NOT NULL REFERENCES md_material (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    biz_type     VARCHAR(32)    NOT NULL,
    direction    SMALLINT       NOT NULL,
    qty          NUMERIC(17, 6) NOT NULL,
    source_type  VARCHAR(32)    NOT NULL,
    source_id    BIGINT         NOT NULL,
    occurred_at  TIMESTAMP      NOT NULL DEFAULT now(),
    remark       VARCHAR(255)
);

CREATE INDEX idx_inv_ledger_material_time ON inv_ledger (material_id, occurred_at);

CREATE TABLE so_order (
    id           BIGSERIAL PRIMARY KEY,
    order_no     VARCHAR(32)    NOT NULL,
    order_date   DATE           NOT NULL,
    customer_id  BIGINT         NOT NULL REFERENCES md_customer (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    status       SMALLINT       NOT NULL DEFAULT 0,
    total_amount NUMERIC(17, 6) NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_so_order_no UNIQUE (order_no)
);

CREATE TABLE so_order_line (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT         NOT NULL REFERENCES so_order (id) ON DELETE CASCADE,
    material_id    BIGINT         NOT NULL REFERENCES md_material (id),
    quantity       NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL,
    tax_rate       NUMERIC(9, 4)  NOT NULL DEFAULT 0,
    amount         NUMERIC(17, 6) NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_so_order_line_order ON so_order_line (order_id);

CREATE SEQUENCE so_order_no_seq START WITH 1;

INSERT INTO md_customer (customer_code, customer_name)
VALUES ('C-001', '华东制造'),
       ('C-002', '南方贸易')
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO inv_warehouse (warehouse_code, warehouse_name)
VALUES ('WH-001', '主仓')
ON CONFLICT (warehouse_code) DO NOTHING;

INSERT INTO inv_balance (material_id, warehouse_id, qty)
SELECT m.id, w.id, v.qty
FROM (VALUES ('M-001', 100.000000),
             ('M-002', 50.000000),
             ('M-004', 0.000000)) AS v(code, qty)
         JOIN md_material m ON m.code = v.code
         CROSS JOIN inv_warehouse w
WHERE w.warehouse_code = 'WH-001'
ON CONFLICT (material_id, warehouse_id) DO NOTHING;

COMMENT ON TABLE so_order IS '销售订单';
COMMENT ON TABLE so_order_line IS '销售订单明细';
COMMENT ON TABLE inv_balance IS '库存余额快照';
COMMENT ON TABLE inv_ledger IS '库存流水，库存数量的最终依据';
COMMENT ON COLUMN so_order.status IS '0 草稿，1 已确认，2 关闭';
COMMENT ON COLUMN inv_ledger.direction IS '1 入库，-1 出库';
