import { SupabaseClient } from "@supabase/supabase-js";

export type MonthlySalesInvoice = {
  id: number;
  invoice_code: string;
  issued_date: string;
  payment_status: string | null;
  order_code: string | null;
  subject: string | null;
  drawing_number: string | null;
  unit_price: number | null;
  quantity: number | null;
  company_name: string | null;
  total_amount: number | null;
};

// batch_invoice_created_at は JST基準のトリガー等を持たない生の
// timestamptz（new Date().toISOString()）のため、期間指定は
// JSTの日付境界を明示したISO文字列で絞り込む。
function nextDateJst(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function getMonthlySales(
  supabase: SupabaseClient,
  filters: { startDate: string; endDate: string },
): Promise<{ data: MonthlySalesInvoice[] | null; error: string | null }> {
  const rangeStart = `${filters.startDate}T00:00:00+09:00`;
  const rangeEnd = `${nextDateJst(filters.endDate)}T00:00:00+09:00`;

  // invoices_with_order_info ビューは invoices.batch_invoice_no /
  // batch_invoice_created_at を持たないため（src/app/invoices/page.tsx と
  // 同じ理由）、まず invoices 側で「一括請求として確定済み」かつ
  // 確定日が期間内のIDを求めてから、表示用の情報をビューから取得する。
  const { data: confirmedRows, error: confirmedError } = await supabase
    .from("invoices")
    .select("id")
    .not("batch_invoice_no", "is", null)
    .gte("batch_invoice_created_at", rangeStart)
    .lt("batch_invoice_created_at", rangeEnd);

  if (confirmedError) {
    return {
      data: null,
      error: `invoicesの取得に失敗しました: ${confirmedError.message}`,
    };
  }

  const confirmedIds = (confirmedRows ?? []).map((row) => row.id as number);

  if (confirmedIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: rawInvoices, error: invoicesError } = await supabase
    .from("invoices_with_order_info")
    .select(
      "id, invoice_code, issued_date, payment_status, order_code, subject, drawing_number, unit_price, quantity, company_name, total_amount",
    )
    .in("id", confirmedIds)
    .order("issued_date", { ascending: true })
    .order("id", { ascending: true });

  if (invoicesError) {
    return {
      data: null,
      error: `invoices_with_order_infoの取得に失敗しました: ${invoicesError.message}`,
    };
  }

  return { data: (rawInvoices as MonthlySalesInvoice[]) ?? [], error: null };
}
