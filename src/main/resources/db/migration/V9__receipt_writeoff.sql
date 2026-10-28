CREATE TABLE ar_receipt (
    id            BIGSERIAL PRIMARY KEY,
    receipt_no    VARCHAR(32)    NOT NULL,
    receipt_date  DATE           NOT NULL,
    customer_id   BIGINT         NOT NULL REFERENCES md_customer (id),
    settle_method_id BIGINT      REFERENCES md_settle_method (id),
    amount        NUMERIC(17, 6) NOT NULL,
    used_amount   NUMERIC(17, 6) NOT NULL DEFAULT 0,
    status        SMALLINT       NOT NULL DEFAULT 0,
    remark        VARCHAR(255),
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_ar_receipt_no UNIQUE (receipt_no)
);

CREATE TABLE ar_receipt_detail (
    id             BIGSERIAL PRIMARY KEY,
    receipt_id     BIGINT         NOT NULL REFERENCES ar_receipt (id) ON DELETE CASCADE,
    receivable_id  BIGINT         NOT NULL REFERENCES ar_receivable (id),
    amount         NUMERIC(17, 6) NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_ar_receipt_detail_receipt ON ar_receipt_detail (receipt_id);
CREATE INDEX idx_ar_receipt_detail_receivable ON ar_receipt_detail (receivable_id);

CREATE SEQUENCE ar_receipt_no_seq START WITH 1;

COMMENT ON TABLE ar_receipt IS '收款单';
COMMENT ON TABLE ar_receipt_detail IS '收款核销明细';
COMMENT ON COLUMN ar_receipt.status IS '0 已收款，1 已作废';
COMMENT ON COLUMN ar_receipt.used_amount IS '已核销金额';
