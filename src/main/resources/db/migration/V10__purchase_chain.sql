ALTER TABLE po_order_line
    ADD COLUMN received_qty NUMERIC(17, 6) NOT NULL DEFAULT 0;

CREATE TABLE po_receipt (
    id           BIGSERIAL PRIMARY KEY,
    receipt_no   VARCHAR(32)    NOT NULL,
    receipt_date DATE           NOT NULL,
    order_id     BIGINT         NOT NULL REFERENCES po_order (id),
    supplier_id  BIGINT         NOT NULL REFERENCES md_supplier (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    status       SMALLINT       NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_po_receipt_no UNIQUE (receipt_no)
);

CREATE TABLE po_receipt_line (
    id             BIGSERIAL PRIMARY KEY,
    receipt_id     BIGINT         NOT NULL REFERENCES po_receipt (id) ON DELETE CASCADE,
    order_line_id  BIGINT         NOT NULL REFERENCES po_order_line (id),
    material_id    BIGINT         NOT NULL REFERENCES md_material (id),
    quantity       NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL DEFAULT 0,
    tax_rate       NUMERIC(9, 4)  NOT NULL DEFAULT 0,
    amount         NUMERIC(17, 6) NOT NULL DEFAULT 0
);

CREATE INDEX idx_po_receipt_line_receipt ON po_receipt_line (receipt_id);

CREATE TABLE po_inbound (
    id          BIGSERIAL PRIMARY KEY,
    inbound_no  VARCHAR(32) NOT NULL,
    receipt_id  BIGINT      NOT NULL REFERENCES po_receipt (id),
    warehouse_id BIGINT     NOT NULL REFERENCES inv_warehouse (id),
    status      SMALLINT    NOT NULL DEFAULT 0,
    posted_at   TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uk_po_inbound_no UNIQUE (inbound_no),
    CONSTRAINT uk_po_inbound_receipt UNIQUE (receipt_id)
);

CREATE TABLE po_inbound_line (
    id            BIGSERIAL PRIMARY KEY,
    inbound_id    BIGINT         NOT NULL REFERENCES po_inbound (id) ON DELETE CASCADE,
    material_id   BIGINT         NOT NULL REFERENCES md_material (id),
    quantity      NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL DEFAULT 0
);

CREATE TABLE po_invoice (
    id           BIGSERIAL PRIMARY KEY,
    invoice_no   VARCHAR(32)    NOT NULL,
    invoice_date DATE           NOT NULL,
    receipt_id   BIGINT         NOT NULL REFERENCES po_receipt (id),
    order_id     BIGINT         NOT NULL REFERENCES po_order (id),
    supplier_id  BIGINT         NOT NULL REFERENCES md_supplier (id),
    amount       NUMERIC(17, 6) NOT NULL DEFAULT 0,
    tax_amount   NUMERIC(17, 6) NOT NULL DEFAULT 0,
    total_amount NUMERIC(17, 6) NOT NULL DEFAULT 0,
    status       SMALLINT       NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_po_invoice_no UNIQUE (invoice_no),
    CONSTRAINT uk_po_invoice_receipt UNIQUE (receipt_id)
);

CREATE TABLE po_invoice_line (
    id              BIGSERIAL PRIMARY KEY,
    invoice_id      BIGINT         NOT NULL REFERENCES po_invoice (id) ON DELETE CASCADE,
    receipt_line_id BIGINT         NOT NULL REFERENCES po_receipt_line (id),
    material_id     BIGINT         NOT NULL REFERENCES md_material (id),
    quantity        NUMERIC(17, 6) NOT NULL,
    tax_unit_price  NUMERIC(17, 6) NOT NULL,
    tax_rate        NUMERIC(9, 4)  NOT NULL,
    amount          NUMERIC(17, 6) NOT NULL,
    tax_amount      NUMERIC(17, 6) NOT NULL
);

CREATE INDEX idx_po_invoice_line_invoice ON po_invoice_line (invoice_id);

CREATE TABLE ap_payable (
    id           BIGSERIAL PRIMARY KEY,
    payable_no   VARCHAR(32)    NOT NULL,
    invoice_id   BIGINT         NOT NULL REFERENCES po_invoice (id),
    supplier_id  BIGINT         NOT NULL REFERENCES md_supplier (id),
    invoice_date DATE           NOT NULL,
    total_amount NUMERIC(17, 6) NOT NULL,
    paid_amount  NUMERIC(17, 6) NOT NULL DEFAULT 0,
    balance      NUMERIC(17, 6) NOT NULL,
    status       SMALLINT       NOT NULL DEFAULT 0,
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_ap_payable_no UNIQUE (payable_no),
    CONSTRAINT uk_ap_payable_invoice UNIQUE (invoice_id)
);

CREATE TABLE ap_payment (
    id               BIGSERIAL PRIMARY KEY,
    payment_no       VARCHAR(32)    NOT NULL,
    payment_date     DATE           NOT NULL,
    supplier_id      BIGINT         NOT NULL REFERENCES md_supplier (id),
    settle_method_id BIGINT         REFERENCES md_settle_method (id),
    amount           NUMERIC(17, 6) NOT NULL,
    used_amount      NUMERIC(17, 6) NOT NULL DEFAULT 0,
    status           SMALLINT       NOT NULL DEFAULT 0,
    remark           VARCHAR(255),
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_ap_payment_no UNIQUE (payment_no)
);

CREATE TABLE ap_payment_detail (
    id          BIGSERIAL PRIMARY KEY,
    payment_id  BIGINT         NOT NULL REFERENCES ap_payment (id) ON DELETE CASCADE,
    payable_id  BIGINT         NOT NULL REFERENCES ap_payable (id),
    amount      NUMERIC(17, 6) NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_ap_payment_detail_payment ON ap_payment_detail (payment_id);

CREATE SEQUENCE po_receipt_no_seq START WITH 1;
CREATE SEQUENCE po_inbound_no_seq START WITH 1;
CREATE SEQUENCE po_invoice_no_seq START WITH 1;
CREATE SEQUENCE ap_payable_no_seq START WITH 1;
CREATE SEQUENCE ap_payment_no_seq START WITH 1;

-- 历史数据：已入库采购订单迁移为收货单 + 入库单，避免重复入库
INSERT INTO po_receipt (receipt_no, receipt_date, order_id, supplier_id, warehouse_id, status, remark)
SELECT 'GR' || to_char(o.order_date, 'YYYYMMDD') || lpad(o.id::text, 6, '0'),
       o.order_date,
       o.id,
       o.supplier_id,
       o.warehouse_id,
       1,
       '历史订单迁移'
FROM po_order o
WHERE o.status = 1;

INSERT INTO po_receipt_line (receipt_id, order_line_id, material_id, quantity, tax_unit_price, tax_rate, amount)
SELECT r.id, l.id, l.material_id, l.quantity, l.tax_unit_price, l.tax_rate, l.amount
FROM po_receipt r
         JOIN po_order_line l ON l.order_id = r.order_id;

INSERT INTO po_inbound (inbound_no, receipt_id, warehouse_id, status, posted_at)
SELECT 'RK' || to_char(r.receipt_date, 'YYYYMMDD') || lpad(r.id::text, 6, '0'),
       r.id,
       r.warehouse_id,
       1,
       r.created_at
FROM po_receipt r;

INSERT INTO po_inbound_line (inbound_id, material_id, quantity, tax_unit_price)
SELECT i.id, l.material_id, l.quantity, l.tax_unit_price
FROM po_inbound i
         JOIN po_receipt_line l ON l.receipt_id = i.receipt_id;

UPDATE po_order_line l
SET received_qty = c.total
FROM (SELECT order_line_id, SUM(quantity) AS total
      FROM po_receipt_line
      GROUP BY order_line_id) c
WHERE l.id = c.order_line_id;

UPDATE po_order
SET status = 2
WHERE status = 1;

SELECT setval('po_receipt_no_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM po_receipt), 1));
SELECT setval('po_inbound_no_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM po_inbound), 1));

COMMENT ON TABLE po_receipt IS '采购收货单，确认后入库增加库存';
COMMENT ON TABLE po_inbound IS '采购入库单，确认时过账并写库存流水';
COMMENT ON TABLE po_invoice IS '采购发票，按收货单开票';
COMMENT ON TABLE ap_payable IS '应付单，采购发票挂账生成';
COMMENT ON TABLE ap_payment IS '付款单';
COMMENT ON COLUMN po_order.status IS '0 草稿，1 已审核，2 已关闭';
