import { createClient } from "@/lib/supabase-server";

export default async function Deliveries() {
  const supabase = await createClient();
  const { data: rawDeliveryNoteItems, error } = await supabase
    .from("delivery_note_items")
    .select("*, orders(order_code, subject, companies(company_name))");

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          delivery_note_itemsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const deliveryNoteItems = rawDeliveryNoteItems?.map((item) => {
    const { order_id, orders, ...rest } = item as typeof item & {
      order_id: unknown;
      orders: {
        order_code: string;
        subject: string;
        companies: { company_name: string } | null;
      } | null;
    };
    return {
      ...rest,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      company_name: orders?.companies?.company_name ?? null,
    };
  });

  const columns =
    deliveryNoteItems && deliveryNoteItems.length > 0
      ? Object.keys(deliveryNoteItems[0]).filter((col) => col !== "created_at")
      : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        delivery_note_items 一覧（{deliveryNoteItems?.length ?? 0}件）
      </h1>
      {!deliveryNoteItems || deliveryNoteItems.length === 0 ? (
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
              {deliveryNoteItems.map((item, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(item[col] ?? "")}
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
