-- ============================================================
-- work_orders_with_order_info ビュー作成SQL
-- 作成日: 2026-08-16
-- 目的: work-orders/page.tsx のネスト構文（orders(...companies(...))）を
--       解消するため、他の一覧（receipts / invoices / deliveries）と
--       同じ要領で work_orders / orders / companies をフラットに
--       結合したビューを用意する。
--
-- 補足:
--   work_orders 自体は notes カラムを持たない
--   （備考はordersテーブルのnotesを参照・編集する運用のため、
--    order_notes は orders.notes のみをエイリアスしている）。
--   company_name は work_orders/page.tsx では現状ソート対象になって
--   いないが、表示列としては使われているため含めている。
-- ============================================================

CREATE OR REPLACE VIEW work_orders_with_order_info AS
SELECT
  w.id,
  w.work_order_code,
  w.assignee,
  w.issued_date,
  w.created_at,
  w.order_id,
  o.order_code,
  o.subject,
  o.drawing_number,
  o.quantity,
  o.desired_delivery_date,
  o.notes AS order_notes,
  c.company_name
FROM work_orders w
LEFT JOIN orders o ON o.id = w.order_id
LEFT JOIN companies c ON c.id = o.company_id;
