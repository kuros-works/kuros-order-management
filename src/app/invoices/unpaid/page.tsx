import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getUnpaidInvoices } from "@/lib/unpaid";

export default async function UnpaidInvoicesPage() {
  const supabase = await createClient();

  const { data: invoices, error } = await getUnpaidInvoices(supabase);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{error}</h1>
      </div>
    );
  }

  const totalAmount = (invoices ?? []).reduce(
    (sum, invoice) => sum + (invoice.total_amount ?? 0),
    0,
  );

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        入金残：¥{totalAmount.toLocaleString("ja-JP")}（
        {invoices?.length ?? 0}件）
      </h1>
      {!invoices || invoices.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  請求書番号
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  受注No
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  件名
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  会社名
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  金額
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="border border-zinc-300 px-3 py-2">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invoice.invoice_code}
                    </Link>
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {invoice.order_code ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {invoice.subject ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {invoice.company_name ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {invoice.total_amount ?? ""}
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
