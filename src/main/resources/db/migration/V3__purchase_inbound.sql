CREATE TABLE md_supplier (
    id            BIGSERIAL PRIMARY KEY,
    supplier_code VARCHAR(32)  NOT NULL,
    supplier_name VARCHAR(128) NOT NULL,
    status        SMALLINT     NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_supplier_code UNIQUE (supplier_code)
);

CREATE TABLE po_order (
    id           BIGSERIAL PRIMARY KEY,
    order_no     VARCHAR(32)    NOT NULL,
    order_date   DATE           NOT NULL,
    supplier_id  BIGINT         NOT NULL REFERENCES md_supplier (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    status       SMALLINT       NOT NULL DEFAULT 0,
    total_amount NUMERIC(17, 6) NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_po_order_no UNIQUE (order_no)
);

CREATE TABLE po_order_line (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT         NOT NULL REFERENCES po_order (id) ON DELETE CASCADE,
    material_id    BIGINT         NOT NULL REFERENCES md_material (id),
    quantity       NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL,
    tax_rate       NUMERIC(9, 4)  NOT NULL DEFAULT 0,
    amount         NUMERIC(17, 6) NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_order_line_order ON po_order_line (order_id);

CREATE SEQUENCE po_order_no_seq START WITH 1;

INSERT INTO md_supplier (supplier_code, supplier_name)
VALUES ('S-001', '华东原料'),
       ('S-002', '南方五金')
ON CONFLICT (supplier_code) DO NOTHING;

COMMENT ON TABLE po_order IS '采购订单，确认后执行采购入库';
COMMENT ON TABLE po_order_line IS '采购订单明细';
COMMENT ON COLUMN po_order.status IS '0 草稿，1 已入库，2 关闭';
