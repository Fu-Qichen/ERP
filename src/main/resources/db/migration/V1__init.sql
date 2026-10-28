CREATE TABLE md_material (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(32)  NOT NULL,
    name        VARCHAR(128) NOT NULL,
    spec        VARCHAR(128),
    unit        VARCHAR(16)  NOT NULL DEFAULT 'PCS',
    status      SMALLINT     NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_material_code UNIQUE (code)
);

COMMENT ON TABLE md_material IS '物料主数据';
COMMENT ON COLUMN md_material.code IS '物料编码';
COMMENT ON COLUMN md_material.name IS '物料名称';
COMMENT ON COLUMN md_material.spec IS '规格型号';
COMMENT ON COLUMN md_material.unit IS '计量单位';
COMMENT ON COLUMN md_material.status IS '状态：1 启用，0 停用';

INSERT INTO md_material (code, name, spec, unit)
VALUES ('M-001', '测试物料A', '10x20', 'PCS'),
       ('M-002', '测试物料B', '20x30', 'KG')
ON CONFLICT (code) DO NOTHING;
