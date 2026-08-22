-- ============================================================
-- 第102版 入金確認フロー一本化: orders幽霊列の撤去（ドラフト）
-- 作成日: 2026-08-22
-- 注意: このSQLは設計ドラフトです。実行はしていません。
--       本番適用前にステージング環境での動作確認・レビューを行ってください。
-- ============================================================

-- --------------------------------------------------------------
-- 背景
-- --------------------------------------------------------------
-- ddl-draft-73-74-review.sql（2026-08-10）で orders に追加した
--   invoice_sent_date / payment_date / receipt_sent_date
-- の3列は、単票（order-form.tsx）に表示欄まで用意されたが、
-- コード全体のどこからもUPDATEされておらず、常に「-」表示のままだった。
--
-- 受注一覧の「入金状況」「請求書送信状況」「領収書送信状況」は、
-- 実際には invoices.payment_status / invoices.sent_flag /
-- receipts.sent_flag という別系統の既存稼働中フラグから作られており、
-- 実体が二重に存在していた。
--
-- 今回、実体を invoices.payment_status / invoices.sent_flag /
-- receipts.sent_flag 側に一本化し、orders側の3列（未使用）を撤去する。
-- 合わせて、invoices.sent_flag を書き込むトグルUIを新設した
-- （receipts.sent_flag の toggleSentFlag と同じパターン）。


-- --------------------------------------------------------------
-- 1. orders_with_company_info ビューの再作成
-- --------------------------------------------------------------
-- CREATE OR REPLACE VIEW は列の削除ができないため、
-- 先にビューをDROPしてから、列を除いた定義で作り直す。
-- （最新のビュー定義本体は sql/orders_view.sql を正とする）

DROP VIEW IF EXISTS orders_with_company_info;

CREATE VIEW orders_with_company_info AS
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
  o.status,
  o.notes,
  o.batch_invoice_id,
  o.created_at,
  (o.unit_price * o.quantity) AS total_amount,
  c.company_name
FROM orders o
LEFT JOIN companies c ON c.id = o.company_id;


-- --------------------------------------------------------------
-- 2. orders テーブルから幽霊列を削除
-- --------------------------------------------------------------
ALTER TABLE orders
  DROP COLUMN IF EXISTS invoice_sent_date,
  DROP COLUMN IF EXISTS payment_date,
  DROP COLUMN IF EXISTS receipt_sent_date;


-- ============================================================
-- ロールバック用DDL（DOWN）
-- ============================================================
-- ALTER TABLE orders
--   ADD COLUMN invoice_sent_date date,
--   ADD COLUMN payment_date       date,
--   ADD COLUMN receipt_sent_date  date;
--
-- COMMENT ON COLUMN orders.invoice_sent_date IS '一括請求書を送信した日（事務員による手入力）';
-- COMMENT ON COLUMN orders.payment_date       IS '入金を確認した日（事務員による手入力）';
-- COMMENT ON COLUMN orders.receipt_sent_date  IS '領収書を送付した日（事務員による手入力）';
--
-- DROP VIEW IF EXISTS orders_with_company_info;
--
-- CREATE VIEW orders_with_company_info AS
-- SELECT
--   o.id, o.order_code, o.company_id, o.subject, o.drawing_number,
--   o.quantity, o.unit, o.unit_price, o.order_date,
--   o.desired_delivery_date, o.completion_date,
--   o.invoice_sent_date, o.payment_date, o.receipt_sent_date,
--   o.status, o.notes, o.batch_invoice_id, o.created_at,
--   (o.unit_price * o.quantity) AS total_amount, c.company_name
-- FROM orders o
-- LEFT JOIN companies c ON c.id = o.company_id;


-- ============================================================
-- 注記・懸念点
-- ============================================================
-- 1. アプリ側のコード（src/app/orders/[id]/order-form.tsx,
--    src/app/orders/[id]/page.tsx, src/app/page.tsx,
--    sql/orders_view.sql）は本DDLに先行して幽霊列を参照しない形に
--    修正済み。本DDLの適用前にデプロイしても、既存の3列は単に
--    参照されなくなるだけで実害はない。ただし本DDL未適用の間は
--    DB上に列が残ったままになる。
--
-- 2. これに合わせて src/app/receipts/actions.ts の confirmPayment から
--    orders.completion_date への書き込みを撤去した
--    （completion_dateは「納品完了日」の意味のまま変更しない方針のため）。
--    このDDLとは無関係にコード側のみの変更で、DBスキーマ変更は不要。
--
-- 3. invoices.sent_flag を書き込むトグルUI（src/app/invoices/sent-flag-toggle.tsx,
--    src/app/invoices/actions.ts の toggleSentFlag）を新設したが、
--    invoices.sent_flag / invoices.sent_date 列自体は既存のため、
--    DBスキーマ変更は不要（アプリ側の変更のみ）。
--
-- 4. batch_invoices.sent_flag の扱いは今回のスコープ外
--    （第3段階・一括請求NO発番/抽出ビュー化のタイミングで別途整理）。
-- ============================================================
