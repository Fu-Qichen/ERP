-- V6 用订单 id 拼历史发货/出库单号，未推进序列，后续单号会重复。
-- 先统一按序列重排历史单号，再把序列推到当前最大 id。
CREATE TEMPORARY TABLE delivery_renumber AS
SELECT id,
       'DL' || to_char(delivery_date, 'YYYYMMDD') || lpad(nextval('so_delivery_no_seq')::text, 6, '0') AS new_no
FROM so_delivery
ORDER BY id;

UPDATE so_delivery d
SET delivery_no = r.new_no
FROM delivery_renumber r
WHERE d.id = r.id;

CREATE TEMPORARY TABLE outbound_renumber AS
SELECT o.id,
       'CK' || to_char(o.posted_at, 'YYYYMMDD') || lpad(nextval('so_outbound_no_seq')::text, 6, '0') AS new_no
FROM so_outbound o
ORDER BY o.id;

UPDATE so_outbound o
SET outbound_no = r.new_no
FROM outbound_renumber r
WHERE o.id = r.id;
