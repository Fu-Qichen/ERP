CREATE TABLE mfg_bom (
    id           BIGSERIAL PRIMARY KEY,
    bom_code     VARCHAR(32)  NOT NULL,
    product_id   BIGINT       NOT NULL REFERENCES md_material (id),
    version      VARCHAR(16)  NOT NULL DEFAULT 'V1',
    base_qty     NUMERIC(17, 6) NOT NULL DEFAULT 1,
    status       SMALLINT     NOT NULL DEFAULT 1,
    remark       VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_mfg_bom_code_version UNIQUE (bom_code, version)
);

CREATE TABLE mfg_bom_line (
    id           BIGSERIAL PRIMARY KEY,
    bom_id       BIGINT         NOT NULL REFERENCES mfg_bom (id) ON DELETE CASCADE,
    component_id BIGINT         NOT NULL REFERENCES md_material (id),
    qty          NUMERIC(17, 6) NOT NULL,
    loss_rate    NUMERIC(9, 4)  NOT NULL DEFAULT 0,
    sort_no      INT            NOT NULL DEFAULT 0,
    CONSTRAINT uk_mfg_bom_line UNIQUE (bom_id, component_id)
);

CREATE INDEX idx_mfg_bom_line_bom ON mfg_bom_line (bom_id);

CREATE TABLE mfg_work_order (
    id           BIGSERIAL PRIMARY KEY,
    work_order_no VARCHAR(32)   NOT NULL,
    order_date   DATE           NOT NULL,
    product_id   BIGINT         NOT NULL REFERENCES md_material (id),
    bom_id       BIGINT         NOT NULL REFERENCES mfg_bom (id),
    warehouse_id BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    plan_qty     NUMERIC(17, 6) NOT NULL,
    finish_qty   NUMERIC(17, 6) NOT NULL DEFAULT 0,
    status       SMALLINT       NOT NULL DEFAULT 0,
    remark       VARCHAR(255),
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_mfg_work_order_no UNIQUE (work_order_no)
);

CREATE TABLE mfg_issue (
    id            BIGSERIAL PRIMARY KEY,
    issue_no      VARCHAR(32)    NOT NULL,
    work_order_id BIGINT         NOT NULL REFERENCES mfg_work_order (id),
    warehouse_id  BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    material_id   BIGINT         NOT NULL REFERENCES md_material (id),
    qty           NUMERIC(17, 6) NOT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_mfg_issue_no UNIQUE (issue_no)
);

CREATE TABLE mfg_report (
    id            BIGSERIAL PRIMARY KEY,
    report_no     VARCHAR(32)    NOT NULL,
    work_order_id BIGINT         NOT NULL REFERENCES mfg_work_order (id),
    warehouse_id  BIGINT         NOT NULL REFERENCES inv_warehouse (id),
    product_id    BIGINT         NOT NULL REFERENCES md_material (id),
    qty           NUMERIC(17, 6) NOT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT uk_mfg_report_no UNIQUE (report_no)
);

CREATE SEQUENCE mfg_work_order_no_seq START WITH 1;
CREATE SEQUENCE mfg_issue_no_seq START WITH 1;
CREATE SEQUENCE mfg_report_no_seq START WITH 1;

COMMENT ON TABLE mfg_bom IS '物料清单';
COMMENT ON COLUMN mfg_bom.base_qty IS '基准数量（产出单位数）';
COMMENT ON COLUMN mfg_bom_line.loss_rate IS '损耗率（%）';
COMMENT ON TABLE mfg_work_order IS '生产工单';
COMMENT ON COLUMN mfg_work_order.status IS '0 草稿，1 已下达，2 已完工，3 已关闭';
COMMENT ON TABLE mfg_issue IS '生产领料，扣减库存';
COMMENT ON TABLE mfg_report IS '生产报工，增加成品库存';
