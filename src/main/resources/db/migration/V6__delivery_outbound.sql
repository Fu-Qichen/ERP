ALTER TABLE so_order_line
    ADD COLUMN delivered_qty NUMERIC(17, 6) NOT NULL DEFAULT 0;

CREATE TABLE so_delivery (
    id           BIGSERIAL PRIMARY KEY,
    delivery_no  VARCHAR(32)    NOT NULL,
    delivery_date DATE          NOT NULL,
    order_id     BIGINT         NOT NULL REFERENCES so_order (id),
    customer_id  BIGINT         NOT NULL REFERENCES md_customer (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    status       SMALLINT       NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_so_delivery_no UNIQUE (delivery_no)
);

CREATE TABLE so_delivery_line (
    id            BIGSERIAL PRIMARY KEY,
    delivery_id   BIGINT         NOT NULL REFERENCES so_delivery (id) ON DELETE CASCADE,
    order_line_id BIGINT         NOT NULL REFERENCES so_order_line (id),
    material_id   BIGINT         NOT NULL REFERENCES md_material (id),
    quantity      NUMERIC(17, 6) NOT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_so_delivery_line_delivery ON so_delivery_line (delivery_id);

CREATE TABLE so_outbound (
    id           BIGSERIAL PRIMARY KEY,
    outbound_no  VARCHAR(32) NOT NULL,
    delivery_id  BIGINT      NOT NULL REFERENCES so_delivery (id),
    warehouse_id BIGINT      NOT NULL REFERENCES inv_warehouse (id),
    status       SMALLINT    NOT NULL DEFAULT 0,
    posted_at    TIMESTAMP,
    created_at   TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uk_so_outbound_no UNIQUE (outbound_no),
    CONSTRAINT uk_so_outbound_delivery UNIQUE (delivery_id)
);

CREATE SEQUENCE so_delivery_no_seq START WITH 1;
CREATE SEQUENCE so_outbound_no_seq START WITH 1;

-- 历史数据：已确认订单视为已出库，补发货/出库单与已发数量，避免重复出库
INSERT INTO so_delivery (delivery_no, delivery_date, order_id, customer_id, warehouse_id, status, remark)
SELECT 'DL' || to_char(o.order_date, 'YYYYMMDD') || lpad(o.id::text, 6, '0'),
       o.order_date,
       o.id,
       o.customer_id,
       o.warehouse_id,
       1,
       '历史订单迁移'
FROM so_order o
WHERE o.status = 1;

INSERT INTO so_delivery_line (delivery_id, order_line_id, material_id, quantity)
SELECT d.id, l.id, l.material_id, l.quantity
FROM so_delivery d
         JOIN so_order_line l ON l.order_id = d.order_id;

INSERT INTO so_outbound (outbound_no, delivery_id, warehouse_id, status, posted_at)
SELECT 'CK' || to_char(d.delivery_date, 'YYYYMMDD') || lpad(d.id::text, 6, '0'),
       d.id,
       d.warehouse_id,
       1,
       d.created_at
FROM so_delivery d;

UPDATE so_order_line l
SET delivered_qty = c.total
FROM (SELECT order_line_id, SUM(quantity) AS total
      FROM so_delivery_line
      GROUP BY order_line_id) c
WHERE l.id = c.order_line_id;

UPDATE so_order
SET status = 2
WHERE status = 1;

COMMENT ON TABLE so_delivery IS '销售发货单';
COMMENT ON TABLE so_outbound IS '销售出库单，确认时扣减库存';
COMMENT ON COLUMN so_order.status IS '0 草稿，1 已审核，2 已关闭（已出库历史数据）';
COMMENT ON COLUMN so_order_line.delivered_qty IS '累计已出库数量';
