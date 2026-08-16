-- ============================================================
-- invoices_with_order_info ビュー作成SQL
-- 作成日: 2026-08-16
-- 目的: invoices/page.tsx で company_name 等でのソートを
--       正しく動かすため、receipts_with_order_info と同じ要領で
--       invoices / orders / companies をフラットに結合したビューを用意する。
-- ============================================================

CREATE OR REPLACE VIEW invoices_with_order_info AS
SELECT
  i.id,
  i.invoice_code,
  i.issued_date,
  i.payment_status,
  i.sent_flag,
  i.sent_date,
  i.created_at,
  i.notes,
  i.order_id,
  i.company_id,
  o.order_code,
  o.subject,
  o.drawing_number,
  o.unit_price,
  o.quantity,
  o.notes AS order_notes,
  (o.unit_price * o.quantity) AS total_amount,
  c.company_name
FROM invoices i
LEFT JOIN orders o ON o.id = i.order_id
LEFT JOIN companies c ON c.id = i.company_id;
