-- ============================================================
-- 第102版 入金確認フロー一本化: orders.completion_date（完了日）の削除（ドラフト）
-- 作成日: 2026-08-22
-- 注意: このSQLは設計ドラフトです。実行はしていません。
--       本番適用前にステージング環境での動作確認・レビューを行ってください。
-- ============================================================

-- --------------------------------------------------------------
-- 背景
-- --------------------------------------------------------------
-- 今回の入金確認フロー一本化にあたり、「業務完了」の判定は
-- receipts.sent_flag（領収書送信済み）で行う方針に決定した。
-- orders.completion_date は最終納品日（latest_delivery_date、
-- delivery_note_items/delivery_notesから都度集計するアプリ側の派生値）
-- と実質的に同じ情報を重複して持っていた列であり、受注残高・資金繰り
-- 予測ロジックにも使われていないことを確認済みのため削除する。
--
-- 本DDLは ddl-draft-102-orders-column-removal.sql（invoice_sent_date/
-- payment_date/receipt_sent_date の削除）とは独立して適用可能。
-- どちらを先に実行しても構わない（両方ともorders_with_company_info
-- ビューをDROP→再作成するため、実行順に関わらず最終形は
-- sql/orders_view.sql の内容に収束する）。


-- --------------------------------------------------------------
-- 1〜2をまとめて1トランザクションで実行
-- --------------------------------------------------------------
BEGIN;

-- 1. orders_with_company_info ビューの再作成
--    CREATE OR REPLACE VIEW は列の削除ができないため、
--    先にビューをDROPしてから、列を除いた定義で作り直す。
--    （最新のビュー定義本体は sql/orders_view.sql を正とする）
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
  o.status,
  o.notes,
  o.batch_invoice_id,
  o.created_at,
  (o.unit_price * o.quantity) AS total_amount,
  c.company_name
FROM orders o
LEFT JOIN companies c ON c.id = o.company_id;

-- 2. orders テーブルから completion_date を削除
ALTER TABLE orders
  DROP COLUMN IF EXISTS completion_date;

COMMIT;


-- ============================================================
-- ロールバック用DDL（DOWN）
-- ============================================================
-- BEGIN;
--
-- ALTER TABLE orders
--   ADD COLUMN completion_date date;
--
-- DROP VIEW IF EXISTS orders_with_company_info;
--
-- CREATE VIEW orders_with_company_info AS
-- SELECT
--   o.id, o.order_code, o.company_id, o.subject, o.drawing_number,
--   o.quantity, o.unit, o.unit_price, o.order_date,
--   o.desired_delivery_date, o.completion_date,
--   o.status, o.notes, o.batch_invoice_id, o.created_at,
--   (o.unit_price * o.quantity) AS total_amount, c.company_name
-- FROM orders o
-- LEFT JOIN companies c ON c.id = o.company_id;
--
-- COMMIT;
--
-- 注: ロールバックしても completion_date の値そのものは復元されない
--     （列削除で失われたデータは戻らない）。列を復元しても中身は
--     全行NULLになる。


-- ============================================================
-- 注記・懸念点
-- ============================================================
-- 1. アプリ側のコード（src/app/orders/[id]/order-form.tsx,
--    src/app/orders/[id]/page.tsx, src/app/page.tsx,
--    src/lib/backlog.ts, sql/orders_view.sql）は本DDLに先行して
--    completion_date を参照しない形に修正済み。本DDL未適用の間は
--    DB上に列が残ったままになるが、参照されなくなるだけで実害はない。
--
-- 2. ddl-draft-102-orders-column-removal.sql（invoice_sent_date/
--    payment_date/receipt_sent_date の削除）をまだ適用していない場合、
--    本DDL適用後にそちらを実行しても問題ない
--    （orders_with_company_infoビューを再度DROP→作り直すだけ）。
--    どちらを先に実行しても、両方適用し終えた時点の最終形は同じになる。
--
-- 3. completion_date のデータ自体は今回バックフィル等の移行処理を
--    行っていない。削除前の値を残しておきたい場合は、本DDL実行前に
--    別途エクスポートしておくこと（列削除後は復元不可）。
-- ============================================================
