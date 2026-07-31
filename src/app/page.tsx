import { createClient } from "@/lib/supabase-server";
import { getOrdersWithRemainingQuantity } from "@/lib/backlog";

const STATUS_COLUMNS = [
  { key: "manufacturing_status", label: "製造指示状況" },
  { key: "delivery_status", label: "納品状況" },
  { key: "invoice_status", label: "請求状況" },
  { key: "payment_status_label", label: "入金状況" },
] as const;

export default async function Home() {
  const supabase = await createClient();
  const { data: rawOrders, error } =
    await getOrdersWithRemainingQuantity(supabase);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error}
        </pre>
      </div>
    );
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("order_id");

  if (invoicesError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {invoicesError.message}
        </pre>
      </div>
    );
  }

  const { data: batchInvoices, error: batchInvoicesError } = await supabase
    .from("batch_invoices")
    .select("id, payment_status");

  if (batchInvoicesError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          batch_invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {batchInvoicesError.message}
        </pre>
      </div>
    );
  }

  const { data: workOrders, error: workOrdersError } = await supabase
    .from("work_orders")
    .select("order_id");

  if (workOrdersError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          work_ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {workOrdersError.message}
        </pre>
      </div>
    );
  }

  const invoicedOrderIds = new Set(
    (invoices ?? []).map((invoice) => invoice.order_id),
  );
  const workOrderedOrderIds = new Set(
    (workOrders ?? []).map((workOrder) => workOrder.order_id),
  );
  const paymentStatusByBatchInvoiceId = new Map(
    (batchInvoices ?? []).map((batchInvoice) => [
      batchInvoice.id,
      batchInvoice.payment_status,
    ]),
  );

  const orders = (rawOrders ?? []).map((order) => {
    const manufacturingStatus = workOrderedOrderIds.has(order.id)
      ? "製造指示済み"
      : "未製造指示";

    const deliveryStatus =
      order.delivered_quantity === 0
        ? "未納品"
        : order.remaining_quantity === 0
          ? "完納"
          : "分納";

    const invoiceStatus =
      deliveryStatus !== "完納"
        ? ""
        : order.batch_invoice_id !== null
          ? "一括請求済み"
          : invoicedOrderIds.has(order.id)
            ? "個別請求済み"
            : "未請求";

    const paymentStatusLabel =
      order.batch_invoice_id === null
        ? "-"
        : paymentStatusByBatchInvoiceId.get(order.batch_invoice_id) ===
            "入金済み"
          ? "入金済み"
          : "未入金";

    return {
      ...order,
      manufacturing_status: manufacturingStatus,
      delivery_status: deliveryStatus,
      invoice_status: invoiceStatus,
      payment_status_label: paymentStatusLabel,
    };
  });

  const statusKeys = STATUS_COLUMNS.map((col) => col.key as string);
  const columns =
    orders.length > 0
      ? Object.keys(orders[0]).filter(
          (col) => col !== "created_at" && !statusKeys.includes(col),
        )
      : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">orders 一覧（{orders.length}件）</h1>
      {orders.length === 0 ? (
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
                {STATUS_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(order[col as keyof typeof order] ?? "")}
                    </td>
                  ))}
                  {STATUS_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="border border-zinc-300 px-3 py-2"
                    >
                      {order[col.key]}
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
