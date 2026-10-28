CREATE TABLE sys_approval (
    id            BIGSERIAL PRIMARY KEY,
    biz_type      VARCHAR(32)  NOT NULL,
    biz_id        BIGINT       NOT NULL,
    biz_no        VARCHAR(64)  NOT NULL,
    status        SMALLINT     NOT NULL DEFAULT 0,
    current_step  INT          NOT NULL DEFAULT 1,
    total_steps   INT          NOT NULL DEFAULT 1,
    amount        NUMERIC(17, 6),
    submit_remark VARCHAR(255),
    submitted_at  TIMESTAMP    NOT NULL DEFAULT now(),
    finished_at   TIMESTAMP
);

CREATE INDEX idx_sys_approval_biz ON sys_approval (biz_type, biz_id);
CREATE INDEX idx_sys_approval_status ON sys_approval (status);

CREATE TABLE sys_approval_log (
    id           BIGSERIAL PRIMARY KEY,
    approval_id  BIGINT       NOT NULL REFERENCES sys_approval (id) ON DELETE CASCADE,
    step         INT          NOT NULL,
    action       VARCHAR(16)  NOT NULL,
    approver     VARCHAR(64)  NOT NULL,
    remark       VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_sys_approval_log_approval ON sys_approval_log (approval_id);

COMMENT ON TABLE sys_approval IS '审批单：业务单据提交后生成';
COMMENT ON TABLE sys_approval_log IS '审批流水：提交/通过/驳回';
COMMENT ON COLUMN sys_approval.status IS '0 待审批，1 已通过，2 已驳回';
COMMENT ON COLUMN sys_approval.biz_type IS '业务类型：SALES_ORDER、PURCHASE_ORDER';

-- 历史已审核单据补一条已通过的审批单，保证单据与审批记录一致
INSERT INTO sys_approval (biz_type, biz_id, biz_no, status, current_step, total_steps, amount, submit_remark, submitted_at, finished_at)
SELECT 'SALES_ORDER', o.id, o.order_no, 1, 1, 1, o.total_amount, '历史数据补录', o.created_at, o.updated_at
FROM so_order o
WHERE o.status IN (1, 2)
  AND NOT EXISTS (SELECT 1 FROM sys_approval a WHERE a.biz_type = 'SALES_ORDER' AND a.biz_id = o.id);

INSERT INTO sys_approval_log (approval_id, step, action, approver, remark, created_at)
SELECT a.id, 1, 'APPROVE', 'system', '历史数据补录', a.finished_at
FROM sys_approval a
WHERE a.submit_remark = '历史数据补录';

INSERT INTO sys_approval (biz_type, biz_id, biz_no, status, current_step, total_steps, amount, submit_remark, submitted_at, finished_at)
SELECT 'PURCHASE_ORDER', o.id, o.order_no, 1, 1, 1, o.total_amount, '历史数据补录', o.created_at, o.updated_at
FROM po_order o
WHERE o.status IN (1, 2)
  AND NOT EXISTS (SELECT 1 FROM sys_approval a WHERE a.biz_type = 'PURCHASE_ORDER' AND a.biz_id = o.id);

INSERT INTO sys_approval_log (approval_id, step, action, approver, remark, created_at)
SELECT a.id, 1, 'APPROVE', 'system', '历史数据补录', a.finished_at
FROM sys_approval a
WHERE a.submit_remark = '历史数据补录' AND a.biz_type = 'PURCHASE_ORDER';
