import { createClient } from "@/lib/supabase-server";
import { getOrdersWithRemainingQuantity } from "@/lib/backlog";

export default async function Backlog() {
  const supabase = await createClient();
  const { data: backlog, error } = await getOrdersWithRemainingQuantity(supabase);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{error}</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        受注残一覧（{backlog?.length ?? 0}件）
      </h1>
      {!backlog || backlog.length === 0 ? (
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
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  領収書備考
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  製造指示書備考
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
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.notes_count > 0 ? `備考: ${order.notes_count}件` : ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.receipt_notes ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.work_order_notes ?? ""}
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
