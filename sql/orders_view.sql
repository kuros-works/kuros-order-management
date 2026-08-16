-- ============================================================
-- orders_with_company_info ビュー作成SQL
-- 作成日: 2026-08-16
-- 目的: 受注一覧（src/app/page.tsx、実体は src/lib/backlog.ts の
--       getOrdersWithRemainingQuantity）で company_name のソートが
--       正しく動いていなかったため、他の一覧と同じ要領で
--       orders / companies をフラットに結合したビューを用意する。
--
-- 補足:
--   backlog.ts では orders に加えて work_orders（担当者）・
--   delivery_note_items（納品済数量・最終納品日の集計）も
--   合わせて取得しているが、これらはJOINすると行が増殖する
--   （1対多）ため、このビューには含めず引き続きアプリ側で
--   個別に取得・集計する想定。今回のスコープは
--   「ordersとcompaniesのフラット結合」のみ。
-- ============================================================

CREATE OR REPLACE VIEW orders_with_company_info AS
SELECT
  o.id,
  o.order_code,
  o.company_id,
  o.subject,
  o.drawing_number,
  o.quantity,
  o.unit,
  o.unit_price,
  o.order_date,
  o.desired_delivery_date,
  o.completion_date,
  o.invoice_sent_date,
  o.payment_date,
  o.receipt_sent_date,
  o.status,
  o.notes,
  o.batch_invoice_id,
  o.created_at,
  (o.unit_price * o.quantity) AS total_amount,
  c.company_name
FROM orders o
LEFT JOIN companies c ON c.id = o.company_id;
