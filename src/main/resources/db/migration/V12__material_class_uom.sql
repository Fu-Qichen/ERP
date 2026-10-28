CREATE TABLE md_material_class (
    id         BIGSERIAL PRIMARY KEY,
    class_code VARCHAR(32)  NOT NULL,
    class_name VARCHAR(128) NOT NULL,
    parent_id  BIGINT REFERENCES md_material_class (id),
    status     SMALLINT     NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_material_class_code UNIQUE (class_code)
);

CREATE TABLE md_uom (
    id             BIGSERIAL PRIMARY KEY,
    unit_code      VARCHAR(16) NOT NULL,
    unit_name      VARCHAR(32) NOT NULL,
    decimal_digits SMALLINT    NOT NULL DEFAULT 0,
    status         SMALLINT    NOT NULL DEFAULT 1,
    created_at     TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_uom_code UNIQUE (unit_code)
);

INSERT INTO md_material_class (class_code, class_name)
VALUES ('MC01', '原材料'),
       ('MC02', '成品')
ON CONFLICT (class_code) DO NOTHING;

-- 物料原来以文本单位存储，这里按现有值建立计量单位并回填关联
INSERT INTO md_uom (unit_code, unit_name, decimal_digits)
SELECT DISTINCT unit,
                CASE unit
                    WHEN 'PCS' THEN '件'
                    WHEN 'KG' THEN '千克'
                    ELSE unit
                END,
                CASE unit
                    WHEN 'KG' THEN 3
                    ELSE 0
                END
FROM md_material
ON CONFLICT (unit_code) DO NOTHING;

ALTER TABLE md_material
    ADD COLUMN class_id BIGINT REFERENCES md_material_class (id),
    ADD COLUMN uom_id BIGINT REFERENCES md_uom (id);

UPDATE md_material
SET class_id = (SELECT id FROM md_material_class WHERE class_code = 'MC01'),
    uom_id   = (SELECT id FROM md_uom WHERE unit_code = md_material.unit);

ALTER TABLE md_material ALTER COLUMN class_id SET NOT NULL;
ALTER TABLE md_material ALTER COLUMN uom_id SET NOT NULL;

COMMENT ON TABLE md_material_class IS '物料分类';
COMMENT ON TABLE md_uom IS '计量单位';
COMMENT ON COLUMN md_uom.decimal_digits IS '小数位数';
