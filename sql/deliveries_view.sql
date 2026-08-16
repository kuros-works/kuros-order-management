-- ============================================================
-- deliveries_with_order_info ビュー作成SQL
-- 作成日: 2026-08-16
-- 目的: deliveries/page.tsx で company_name 等でのソートを
--       正しく動かすため、receipts_with_order_info / invoices_with_order_info
--       と同じ要領で delivery_note_items / orders / companies を
--       フラットに結合したビューを用意する。
--
-- 補足:
--   delivery_note_items は companies への直接の外部キーを持たず、
--   orders.company_id 経由で companies に辿り着く
--   （delivery_note_items -> orders -> companies の2階層）。
-- ============================================================

CREATE OR REPLACE VIEW deliveries_with_order_info AS
SELECT
  d.id,
  d.delivery_note_id,
  d.order_id,
  d.delivered_quantity,
  d.notes,
  d.created_at,
  o.order_code,
  o.subject,
  o.drawing_number,
  o.unit_price,
  o.notes AS order_notes,
  (o.unit_price * d.delivered_quantity) AS total_amount,
  c.company_name
FROM delivery_note_items d
LEFT JOIN orders o ON o.id = d.order_id
LEFT JOIN companies c ON c.id = o.company_id;
