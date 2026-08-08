import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { updateOrderNotes } from "./actions";

export default async function Invoices() {
  const supabase = await createClient();
  const { data: rawInvoices, error } = await supabase
    .from("invoices")
    .select(
      "*, orders(order_code, subject, unit_price, quantity, notes), companies(company_name)",
    );

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
        order_id: number;
        company_id: unknown;
        orders: {
          order_code: string;
          subject: string;
          unit_price: number | null;
          quantity: number | null;
          notes: string | null;
        } | null;
        companies: { company_name: string } | null;
      };
    const unit_price = orders?.unit_price ?? null;
    const quantity = orders?.quantity ?? null;
    return {
      ...rest,
      order_id,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      company_name: companies?.company_name ?? company_id,
      unit_price,
      quantity,
      amount:
        unit_price !== null && quantity !== null
          ? unit_price * quantity
          : null,
      order_notes: orders?.notes ?? null,
    };
  });

  const columns =
    invoices && invoices.length > 0
      ? Object.keys(invoices[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "notes" &&
            col !== "order_id" &&
            col !== "order_notes",
        )
      : [];

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
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
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
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={invoice.order_id}
                      initialNotes={invoice.order_notes}
                      onSave={updateOrderNotes}
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
