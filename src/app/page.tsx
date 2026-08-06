import { createClient } from "@/lib/supabase-server";
import { getAggregatedStatus, getOrdersWithRemainingQuantity } from "@/lib/backlog";

const STATUS_COLUMNS = [
  { key: "aggregated_status", label: "進捗状況" },
  { key: "manufacturing_status", label: "製造指示状況" },
  { key: "delivery_status", label: "納品状況" },
  { key: "invoice_status", label: "請求状況" },
  { key: "payment_status_label", label: "入金状況" },
  { key: "sent_status_label", label: "請求書送信状況" },
  { key: "receipt_sent_status_label", label: "領収書送信状況" },
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
    .select("order_id, payment_status, sent_flag, receipts(sent_flag)");

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

  const workOrderedOrderIds = new Set(
    (workOrders ?? []).map((workOrder) => workOrder.order_id),
  );

  type InvoiceStatusRow = {
    order_id: number;
    payment_status: string;
    sent_flag: boolean;
    receipts: { sent_flag: boolean }[] | { sent_flag: boolean } | null;
  };

  const invoiceByOrderId = new Map(
    ((invoices ?? []) as InvoiceStatusRow[]).map((invoice) => {
      const receiptRecord = Array.isArray(invoice.receipts)
        ? invoice.receipts[0]
        : invoice.receipts;
      return [
        invoice.order_id,
        {
          paymentStatus: invoice.payment_status,
          sentFlag: invoice.sent_flag,
          receiptSentFlag: receiptRecord?.sent_flag ?? null,
        },
      ];
    }),
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

    const orderInvoice = invoiceByOrderId.get(order.id);

    const invoiceStatus =
      deliveryStatus !== "完納" ? "" : orderInvoice ? "請求済み" : "未請求";

    const paymentStatusLabel = !orderInvoice
      ? "-"
      : orderInvoice.paymentStatus === "入金済み"
        ? "入金済み"
        : "未入金";

    const sentStatusLabel = !orderInvoice
      ? "-"
      : orderInvoice.sentFlag
        ? "請求書送信済み"
        : "請求書未送信";

    const receiptSentStatusLabel = !orderInvoice
      ? "-"
      : orderInvoice.receiptSentFlag
        ? "領収書送信済み"
        : "領収書未送信";

    const aggregatedStatus = getAggregatedStatus({
      manufacturingStatus,
      deliveryStatus,
      invoiceStatus,
      paymentStatusLabel,
    });

    return {
      ...order,
      aggregated_status: aggregatedStatus,
      manufacturing_status: manufacturingStatus,
      delivery_status: deliveryStatus,
      invoice_status: invoiceStatus,
      payment_status_label: paymentStatusLabel,
      sent_status_label: sentStatusLabel,
      receipt_sent_status_label: receiptSentStatusLabel,
    };
  });

  const statusKeys = STATUS_COLUMNS.map((col) => col.key as string);
  const columns =
    orders.length > 0
      ? Object.keys(orders[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "status" &&
            col !== "notes_count" &&
            col !== "receipt_notes" &&
            col !== "work_order_notes" &&
            !statusKeys.includes(col),
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
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  領収書備考
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  製造指示書備考
                </th>
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
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.notes_count > 0
                      ? `備考: ${order.notes_count}件`
                      : ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.receipt_notes ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.work_order_notes ?? ""}
                  </td>
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
