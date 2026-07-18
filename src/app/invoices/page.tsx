import { supabase } from "@/lib/supabase";

export default async function Invoices() {
  const { data: rawInvoices, error } = await supabase
    .from("invoices")
    .select("*, orders(order_code, subject), companies(company_name)");

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const invoices = rawInvoices?.map((invoice) => {
    const { order_id, company_id, orders, companies, ...rest } =
      invoice as typeof invoice & {
        order_id: unknown;
        company_id: unknown;
        orders: { order_code: string; subject: string } | null;
        companies: { company_name: string } | null;
      };
    return {
      ...rest,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      company_name: companies?.company_name ?? company_id,
    };
  });

  const columns =
    invoices && invoices.length > 0 ? Object.keys(invoices[0]) : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        invoices 一覧（{invoices?.length ?? 0}件）
      </h1>
      {!invoices || invoices.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(invoice[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
