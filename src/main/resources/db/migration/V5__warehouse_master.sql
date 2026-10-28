ALTER TABLE inv_warehouse
    ADD COLUMN dept_id BIGINT REFERENCES org_dept (id);

UPDATE inv_warehouse
SET dept_id = (SELECT id FROM org_dept WHERE dept_code = 'D005')
WHERE warehouse_code = 'WH-001';

ALTER TABLE inv_warehouse ALTER COLUMN dept_id SET NOT NULL;

COMMENT ON COLUMN inv_warehouse.dept_id IS '所属部门';
