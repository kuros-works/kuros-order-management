-- ============================================================
-- receipts.created_date 自動セット用トリガー（JST基準）
-- 作成日: 2026-08-10
-- 状態: Supabase上で確認済み・本番稼働中
-- ============================================================

-- トリガー関数
--   INSERT時点のJST（Asia/Tokyo）日付を強制セットする（送信ペイロードの値は無視）。
--   Postgresセッション/DBのタイムゾーン設定に依存しないよう、
--   CURRENT_DATEではなく now() を明示的にAsia/Tokyoへ変換して使用する。
CREATE OR REPLACE FUNCTION set_receipt_created_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_date := (now() AT TIME ZONE 'Asia/Tokyo')::date;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_receipt_created_date() IS
  'receipts.created_dateをINSERT時点のJST（Asia/Tokyo）日付で自動セットするトリガー関数';

-- トリガー本体（作成日は事後変更しない想定なのでBEFORE INSERTのみ）
DROP TRIGGER IF EXISTS trg_receipts_set_created_date ON receipts;

CREATE TRIGGER trg_receipts_set_created_date
  BEFORE INSERT ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION set_receipt_created_date();
