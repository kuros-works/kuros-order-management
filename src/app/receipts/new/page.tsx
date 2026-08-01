import { createClient } from "@/lib/supabase-server";
import { ReceiptForm } from "./receipt-form";

export default async function NewReceiptPage() {
  const supabase = await createClient();
  const { data: rawBatchInvoices, error } = await supabase
    .from("batch_invoices")
    .select("id, batch_invoice_code, company_id, companies(company_name)")
    .eq("payment_status", "未入金")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          batch_invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const batchInvoices = (rawBatchInvoices ?? []).map((batchInvoice) => {
    const { companies, ...rest } = batchInvoice as typeof batchInvoice & {
      companies: { company_name: string | null } | null;
    };
    return {
      ...rest,
      company_name: companies?.company_name ?? null,
    };
  });

  const batchInvoiceIds = batchInvoices.map((batchInvoice) => batchInvoice.id);

  const { data: orders, error: ordersError } =
    batchInvoiceIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("orders")
          .select("id, batch_invoice_id, quantity, unit_price")
          .in("batch_invoice_id", batchInvoiceIds);

  if (ordersError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {ordersError.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">入金記録（新規作成）</h1>
      <ReceiptForm batchInvoices={batchInvoices} orders={orders ?? []} />
    </div>
  );
}
