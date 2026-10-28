CREATE TABLE org_dept (
    id         BIGSERIAL PRIMARY KEY,
    dept_code  VARCHAR(32)  NOT NULL,
    dept_name  VARCHAR(128) NOT NULL,
    parent_id  BIGINT REFERENCES org_dept (id),
    status     SMALLINT     NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_org_dept_code UNIQUE (dept_code)
);

CREATE TABLE org_staff (
    id         BIGSERIAL PRIMARY KEY,
    staff_no   VARCHAR(32)  NOT NULL,
    staff_name VARCHAR(128) NOT NULL,
    dept_id    BIGINT       NOT NULL REFERENCES org_dept (id),
    status     SMALLINT     NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_org_staff_no UNIQUE (staff_no)
);

CREATE TABLE md_customer_class (
    id         BIGSERIAL PRIMARY KEY,
    class_code VARCHAR(32)  NOT NULL,
    class_name VARCHAR(128) NOT NULL,
    parent_id  BIGINT REFERENCES md_customer_class (id),
    status     SMALLINT     NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_customer_class_code UNIQUE (class_code)
);

CREATE TABLE md_supplier_class (
    id         BIGSERIAL PRIMARY KEY,
    class_code VARCHAR(32)  NOT NULL,
    class_name VARCHAR(128) NOT NULL,
    parent_id  BIGINT REFERENCES md_supplier_class (id),
    status     SMALLINT     NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_supplier_class_code UNIQUE (class_code)
);

CREATE TABLE md_currency (
    id            BIGSERIAL PRIMARY KEY,
    currency_code VARCHAR(16)   NOT NULL,
    currency_name VARCHAR(64)   NOT NULL,
    exchange_rate NUMERIC(17, 6) NOT NULL DEFAULT 1,
    status        SMALLINT      NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT uk_md_currency_code UNIQUE (currency_code)
);

CREATE TABLE md_settle_method (
    id          BIGSERIAL PRIMARY KEY,
    method_code VARCHAR(32)  NOT NULL,
    method_name VARCHAR(64)  NOT NULL,
    status      SMALLINT     NOT NULL DEFAULT 1,
    CONSTRAINT uk_md_settle_method_code UNIQUE (method_code)
);

CREATE TABLE md_pay_condition (
    id             BIGSERIAL PRIMARY KEY,
    condition_code VARCHAR(32) NOT NULL,
    condition_name VARCHAR(64) NOT NULL,
    days           INT         NOT NULL DEFAULT 0,
    status         SMALLINT    NOT NULL DEFAULT 1,
    CONSTRAINT uk_md_pay_condition_code UNIQUE (condition_code)
);

ALTER TABLE md_customer
    ADD COLUMN class_id BIGINT REFERENCES md_customer_class (id),
    ADD COLUMN staff_id BIGINT REFERENCES org_staff (id),
    ADD COLUMN currency_id BIGINT REFERENCES md_currency (id),
    ADD COLUMN settle_method_id BIGINT REFERENCES md_settle_method (id),
    ADD COLUMN pay_condition_id BIGINT REFERENCES md_pay_condition (id);

ALTER TABLE md_supplier
    ADD COLUMN class_id BIGINT REFERENCES md_supplier_class (id),
    ADD COLUMN currency_id BIGINT REFERENCES md_currency (id),
    ADD COLUMN pay_condition_id BIGINT REFERENCES md_pay_condition (id);

INSERT INTO org_dept (dept_code, dept_name, parent_id)
VALUES ('D001', '总部', NULL)
ON CONFLICT (dept_code) DO NOTHING;

INSERT INTO org_dept (dept_code, dept_name, parent_id)
SELECT 'D002', '采购部', id FROM org_dept WHERE dept_code = 'D001'
ON CONFLICT (dept_code) DO NOTHING;

INSERT INTO org_dept (dept_code, dept_name, parent_id)
SELECT 'D003', '销售部', id FROM org_dept WHERE dept_code = 'D001'
ON CONFLICT (dept_code) DO NOTHING;

INSERT INTO org_dept (dept_code, dept_name, parent_id)
SELECT 'D004', '财务部', id FROM org_dept WHERE dept_code = 'D001'
ON CONFLICT (dept_code) DO NOTHING;

INSERT INTO org_dept (dept_code, dept_name, parent_id)
SELECT 'D005', '仓储部', id FROM org_dept WHERE dept_code = 'D001'
ON CONFLICT (dept_code) DO NOTHING;

INSERT INTO org_staff (staff_no, staff_name, dept_id)
SELECT 'ST001', '张伟', id FROM org_dept WHERE dept_code = 'D002'
ON CONFLICT (staff_no) DO NOTHING;

INSERT INTO org_staff (staff_no, staff_name, dept_id)
SELECT 'ST002', '李娜', id FROM org_dept WHERE dept_code = 'D003'
ON CONFLICT (staff_no) DO NOTHING;

INSERT INTO org_staff (staff_no, staff_name, dept_id)
SELECT 'ST003', '王强', id FROM org_dept WHERE dept_code = 'D004'
ON CONFLICT (staff_no) DO NOTHING;

INSERT INTO md_customer_class (class_code, class_name)
VALUES ('CC01', '制造业')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO md_customer_class (class_code, class_name)
VALUES ('CC02', '贸易商')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO md_supplier_class (class_code, class_name)
VALUES ('SC01', '原材料')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO md_supplier_class (class_code, class_name)
VALUES ('SC02', '五金件')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO md_currency (currency_code, currency_name, exchange_rate)
VALUES ('CNY', '人民币', 1),
       ('USD', '美元', 7.2)
ON CONFLICT (currency_code) DO NOTHING;

INSERT INTO md_settle_method (method_code, method_name)
VALUES ('SM01', '电汇'),
       ('SM02', '银行承兑'),
       ('SM03', '现金')
ON CONFLICT (method_code) DO NOTHING;

INSERT INTO md_pay_condition (condition_code, condition_name, days)
VALUES ('PC01', '现结', 0),
       ('PC02', '月结30天', 30),
       ('PC03', '月结60天', 60)
ON CONFLICT (condition_code) DO NOTHING;

UPDATE md_customer
SET class_id         = (SELECT id FROM md_customer_class WHERE class_code = 'CC01'),
    staff_id         = (SELECT id FROM org_staff WHERE staff_no = 'ST002'),
    currency_id      = (SELECT id FROM md_currency WHERE currency_code = 'CNY'),
    settle_method_id = (SELECT id FROM md_settle_method WHERE method_code = 'SM01'),
    pay_condition_id = (SELECT id FROM md_pay_condition WHERE condition_code = 'PC02')
WHERE customer_code = 'C-001';

UPDATE md_customer
SET class_id         = (SELECT id FROM md_customer_class WHERE class_code = 'CC02'),
    staff_id         = (SELECT id FROM org_staff WHERE staff_no = 'ST002'),
    currency_id      = (SELECT id FROM md_currency WHERE currency_code = 'CNY'),
    settle_method_id = (SELECT id FROM md_settle_method WHERE method_code = 'SM02'),
    pay_condition_id = (SELECT id FROM md_pay_condition WHERE condition_code = 'PC03')
WHERE customer_code = 'C-002';

UPDATE md_supplier
SET class_id         = (SELECT id FROM md_supplier_class WHERE class_code = 'SC01'),
    currency_id      = (SELECT id FROM md_currency WHERE currency_code = 'CNY'),
    pay_condition_id = (SELECT id FROM md_pay_condition WHERE condition_code = 'PC02')
WHERE supplier_code = 'S-001';

UPDATE md_supplier
SET class_id         = (SELECT id FROM md_supplier_class WHERE class_code = 'SC02'),
    currency_id      = (SELECT id FROM md_currency WHERE currency_code = 'CNY'),
    pay_condition_id = (SELECT id FROM md_pay_condition WHERE condition_code = 'PC01')
WHERE supplier_code = 'S-002';

ALTER TABLE md_customer ALTER COLUMN class_id SET NOT NULL;
ALTER TABLE md_customer ALTER COLUMN currency_id SET NOT NULL;
ALTER TABLE md_supplier ALTER COLUMN class_id SET NOT NULL;
ALTER TABLE md_supplier ALTER COLUMN currency_id SET NOT NULL;

COMMENT ON TABLE org_dept IS '组织部门';
COMMENT ON TABLE org_staff IS '员工/业务员';
COMMENT ON TABLE md_customer_class IS '客户分类';
COMMENT ON TABLE md_supplier_class IS '供应商分类';
COMMENT ON TABLE md_currency IS '币种';
COMMENT ON TABLE md_settle_method IS '结算方式';
COMMENT ON TABLE md_pay_condition IS '付款条件';
