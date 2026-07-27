import { createClient } from "@/lib/supabase-server";

export default async function Backlog() {
  const supabase = await createClient();

  const { data: rawOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_code, subject, unit_price, quantity, companies(company_name)")
    .order("id", { ascending: true });

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

  const { data: deliveryNoteItems, error: deliveryNoteItemsError } =
    await supabase
      .from("delivery_note_items")
      .select("order_id, delivered_quantity, delivery_notes(created_date)");

  if (deliveryNoteItemsError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          delivery_note_itemsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {deliveryNoteItemsError.message}
        </pre>
      </div>
    );
  }

  const deliveredByOrderId = new Map<number, number>();
  const latestDeliveryDateByOrderId = new Map<number, string>();
  for (const item of deliveryNoteItems ?? []) {
    const { delivery_notes } = item as typeof item & {
      delivery_notes: { created_date: string } | null;
    };

    const current = deliveredByOrderId.get(item.order_id) ?? 0;
    deliveredByOrderId.set(item.order_id, current + item.delivered_quantity);

    const createdDate = delivery_notes?.created_date;
    if (createdDate) {
      const latest = latestDeliveryDateByOrderId.get(item.order_id);
      if (!latest || createdDate > latest) {
        latestDeliveryDateByOrderId.set(item.order_id, createdDate);
      }
    }
  }

  const backlog = (rawOrders ?? []).map((order) => {
    const { companies, ...rest } = order as typeof order & {
      companies: { company_name: string } | null;
    };
    const deliveredQuantity = deliveredByOrderId.get(order.id) ?? 0;
    return {
      ...rest,
      company_name: companies?.company_name ?? null,
      delivered_quantity: deliveredQuantity,
      remaining_quantity: order.quantity - deliveredQuantity,
      latest_delivery_date: latestDeliveryDateByOrderId.get(order.id) ?? null,
    };
  });

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        受注残一覧（{backlog.length}件）
      </h1>
      {backlog.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  受注コード
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  件名
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  会社名
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  単価
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  受注数量
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  納品済み累計
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  残り
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  納品日
                </th>
              </tr>
            </thead>
            <tbody>
              {backlog.map((order) => (
                <tr key={order.id}>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.order_code}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.subject}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.company_name ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.unit_price.toLocaleString("ja-JP")}円
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.quantity}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.delivered_quantity}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.remaining_quantity}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.latest_delivery_date ?? "-"}
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
