import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  getInvoicedOrderIds,
  getOrdersWithRemainingQuantity,
} from "@/lib/backlog";

export default async function OrdersBacklogPage() {
  const supabase = await createClient();

  const { data: orders, error: ordersError } =
    await getOrdersWithRemainingQuantity(supabase);

  if (ordersError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{ordersError}</h1>
      </div>
    );
  }

  const { data: invoicedOrderIds, error: invoicedOrderIdsError } =
    await getInvoicedOrderIds(supabase);

  if (invoicedOrderIdsError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          {invoicedOrderIdsError}
        </h1>
      </div>
    );
  }

  const uninvoicedOrders = (orders ?? [])
    .filter((order) => !invoicedOrderIds?.has(order.id))
    .map((order) => ({
      id: order.id,
      order_code: order.order_code,
      subject: order.subject,
      company_name: order.company_name,
      total_amount: order.unit_price * order.quantity,
    }));

  const totalAmount = uninvoicedOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0,
  );

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        受注残：¥{totalAmount.toLocaleString("ja-JP")}（
        {uninvoicedOrders.length}件）
      </h1>
      {uninvoicedOrders.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
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
                  合計金額
                </th>
              </tr>
            </thead>
            <tbody>
              {uninvoicedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="border border-zinc-300 px-3 py-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.order_code}
                    </Link>
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.subject}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.company_name ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.total_amount}
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
