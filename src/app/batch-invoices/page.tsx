import { createClient } from "@/lib/supabase-server";
import { SentFlagToggle } from "./sent-flag-toggle";

export default async function BatchInvoices() {
  const supabase = await createClient();
  const { data: rawBatchInvoices, error } = await supabase
    .from("batch_invoices")
    .select("*, companies(company_name)");

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

  const batchInvoices = rawBatchInvoices?.map((batchInvoice) => {
    const { company_id, companies, ...rest } = batchInvoice as typeof batchInvoice & {
      company_id: unknown;
      companies: { company_name: string } | null;
    };
    return {
      ...rest,
      company_name: companies?.company_name ?? company_id,
    };
  });

  const columns =
    batchInvoices && batchInvoices.length > 0
      ? Object.keys(batchInvoices[0]).filter(
          (col) =>
            col !== "created_at" && col !== "sent_flag" && col !== "sent_date",
        )
      : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        batch_invoices 一覧（{batchInvoices?.length ?? 0}件）
      </h1>
      {!batchInvoices || batchInvoices.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                  >
                    {col}
                  </th>
                ))}
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  一括請求書送信状況
                </th>
              </tr>
            </thead>
            <tbody>
              {batchInvoices.map((batchInvoice, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(batchInvoice[col] ?? "")}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <SentFlagToggle
                      batchInvoiceId={batchInvoice.id}
                      sentFlag={Boolean(batchInvoice.sent_flag)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
