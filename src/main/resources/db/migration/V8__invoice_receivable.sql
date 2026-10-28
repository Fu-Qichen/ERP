ALTER TABLE so_delivery_line
    ADD COLUMN tax_unit_price NUMERIC(17, 6) NOT NULL DEFAULT 0,
    ADD COLUMN tax_rate NUMERIC(9, 4) NOT NULL DEFAULT 0,
    ADD COLUMN amount NUMERIC(17, 6) NOT NULL DEFAULT 0;

-- 历史发货明细按订单明细回填价格，保证开票金额可追溯
UPDATE so_delivery_line dl
SET tax_unit_price = ol.tax_unit_price,
    tax_rate       = ol.tax_rate,
    amount         = round(dl.quantity * ol.tax_unit_price, 6)
FROM so_order_line ol
WHERE ol.id = dl.order_line_id;

CREATE TABLE so_invoice (
    id            BIGSERIAL PRIMARY KEY,
    invoice_no    VARCHAR(32)    NOT NULL,
    invoice_date  DATE           NOT NULL,
    delivery_id   BIGINT         NOT NULL REFERENCES so_delivery (id),
    order_id      BIGINT         NOT NULL REFERENCES so_order (id),
    customer_id   BIGINT         NOT NULL REFERENCES md_customer (id),
    amount        NUMERIC(17, 6) NOT NULL DEFAULT 0,
    tax_amount    NUMERIC(17, 6) NOT NULL DEFAULT 0,
    total_amount  NUMERIC(17, 6) NOT NULL DEFAULT 0,
    status        SMALLINT       NOT NULL DEFAULT 0,
    remark        VARCHAR(255),
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_so_invoice_no UNIQUE (invoice_no),
    CONSTRAINT uk_so_invoice_delivery UNIQUE (delivery_id)
);

CREATE TABLE so_invoice_line (
    id             BIGSERIAL PRIMARY KEY,
    invoice_id     BIGINT         NOT NULL REFERENCES so_invoice (id) ON DELETE CASCADE,
    delivery_line_id BIGINT       NOT NULL REFERENCES so_delivery_line (id),
    material_id    BIGINT         NOT NULL REFERENCES md_material (id),
    quantity       NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL,
    tax_rate       NUMERIC(9, 4)  NOT NULL,
    amount         NUMERIC(17, 6) NOT NULL,
    tax_amount     NUMERIC(17, 6) NOT NULL
);

CREATE INDEX idx_so_invoice_line_invoice ON so_invoice_line (invoice_id);

CREATE TABLE ar_receivable (
    id            BIGSERIAL PRIMARY KEY,
    receivable_no VARCHAR(32)    NOT NULL,
    invoice_id    BIGINT         NOT NULL REFERENCES so_invoice (id),
    customer_id   BIGINT         NOT NULL REFERENCES md_customer (id),
    invoice_date  DATE           NOT NULL,
    total_amount  NUMERIC(17, 6) NOT NULL,
    paid_amount   NUMERIC(17, 6) NOT NULL DEFAULT 0,
    balance       NUMERIC(17, 6) NOT NULL,
    status        SMALLINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_ar_receivable_no UNIQUE (receivable_no),
    CONSTRAINT uk_ar_receivable_invoice UNIQUE (invoice_id)
);

CREATE SEQUENCE so_invoice_no_seq START WITH 1;
CREATE SEQUENCE ar_receivable_no_seq START WITH 1;

COMMENT ON TABLE so_invoice IS '销售发票，按发货单开票';
COMMENT ON TABLE ar_receivable IS '应收单，发票挂账生成';
COMMENT ON COLUMN so_invoice.status IS '0 已开票，1 已作废';
COMMENT ON COLUMN ar_receivable.status IS '0 未收，1 部分收款，2 已结清';
