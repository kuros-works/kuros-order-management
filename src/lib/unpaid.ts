import { SupabaseClient } from "@supabase/supabase-js";

export type UnpaidInvoice = {
  id: number;
  invoice_code: string;
  order_code: string | null;
  subject: string | null;
  company_name: string | null;
  total_amount: number | null;
};

export async function getUnpaidInvoices(
  supabase: SupabaseClient,
): Promise<{ data: UnpaidInvoice[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("invoices_with_order_info")
    .select("id, invoice_code, order_code, subject, company_name, total_amount")
    .eq("sent_flag", true)
    .eq("payment_status", "未入金")
    .order("id", { ascending: true });

  if (error) {
    return {
      data: null,
      error: `invoices_with_order_infoの取得に失敗しました: ${error.message}`,
    };
  }

  return { data: data ?? [], error: null };
}
