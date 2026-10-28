CREATE TABLE so_outbound_line (
    id             BIGSERIAL PRIMARY KEY,
    outbound_id    BIGINT         NOT NULL REFERENCES so_outbound (id) ON DELETE CASCADE,
    delivery_line_id BIGINT       NOT NULL REFERENCES so_delivery_line (id),
    material_id    BIGINT         NOT NULL REFERENCES md_material (id),
    quantity       NUMERIC(17, 6) NOT NULL,
    tax_unit_price NUMERIC(17, 6) NOT NULL DEFAULT 0,
    amount         NUMERIC(17, 6) NOT NULL DEFAULT 0
);

CREATE INDEX idx_so_outbound_line_outbound ON so_outbound_line (outbound_id);

-- 历史出库单没有明细，按发货明细回填
INSERT INTO so_outbound_line (outbound_id, delivery_line_id, material_id, quantity, tax_unit_price, amount)
SELECT o.id, l.id, l.material_id, l.quantity, l.tax_unit_price, l.amount
FROM so_outbound o
         JOIN so_delivery_line l ON l.delivery_id = o.delivery_id;

COMMENT ON TABLE so_outbound_line IS '销售出库明细';
