import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  ALLOWED_SORT_COLUMNS,
  getAggregatedStatus,
  getOrdersWithRemainingQuantity,
} from "@/lib/backlog";
import { ListPageHeader } from "@/components/layout/list-page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { deleteOrder } from "@/app/orders/actions";

const STATUS_COLUMNS = [
  { key: "aggregated_status", label: "進捗状況" },
  { key: "manufacturing_status", label: "製造指示状況" },
  { key: "delivery_status", label: "納品状況" },
  { key: "invoice_status", label: "請求状況" },
  { key: "payment_status_label", label: "入金状況" },
  { key: "sent_status_label", label: "請求書送信状況" },
  { key: "receipt_sent_status_label", label: "領収書送信状況" },
] as const;

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  order_code: "受注No",
  company_id: "会社ID",
  order_date: "受注日",
  desired_delivery_date: "希望納期",
  completion_date: "完了日",
  subject: "件名",
  drawing_number: "図番",
  quantity: "数量",
  unit: "単位",
  unit_price: "単価",
  total_amount: "合計金額",
  batch_invoice_id: "一括請求ID",
  company_name: "会社名",
  delivered_quantity: "納品済数量",
  remaining_quantity: "残数量",
  latest_delivery_date: "最終納品日",
  invoice_sent_date: "請求書送信日",
  payment_date: "入金日",
  receipt_sent_date: "領収書送信日",
};

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const drawingNumber = getSingleParam(resolvedSearchParams, "drawing_number");
  const subject = getSingleParam(resolvedSearchParams, "subject");
  const companyName = getSingleParam(resolvedSearchParams, "company_name");
  const orderDateFrom = getSingleParam(resolvedSearchParams, "order_date_from");
  const orderDateTo = getSingleParam(resolvedSearchParams, "order_date_to");
  const sortBy = getSingleParam(resolvedSearchParams, "sort_by");
  const sortOrder = getSingleParam(resolvedSearchParams, "sort_order");

  const filters: {
    drawingNumber?: string;
    subject?: string;
    companyName?: string;
    orderDateFrom?: string;
    orderDateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {};
  if (drawingNumber) filters.drawingNumber = drawingNumber;
  if (subject) filters.subject = subject;
  if (companyName) filters.companyName = companyName;
  if (orderDateFrom) filters.orderDateFrom = orderDateFrom;
  if (orderDateTo) filters.orderDateTo = orderDateTo;
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder === "asc" || sortOrder === "desc") filters.sortOrder = sortOrder;

  const supabase = await createClient();
  const { data: rawOrders, error } = await getOrdersWithRemainingQuantity(
    supabase,
    filters,
  );

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
      total_amount: order.unit_price * order.quantity,
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
            col !== "notes" &&
            col !== "assignee" &&
            !statusKeys.includes(col),
        )
      : [];
  const totalAmountIndex = columns.indexOf("total_amount");
  if (totalAmountIndex !== -1) {
    columns.splice(totalAmountIndex, 1);
    columns.splice(columns.indexOf("unit_price") + 1, 0, "total_amount");
  }
  const companyIdIndex = columns.indexOf("company_id");
  if (companyIdIndex !== -1) {
    columns.splice(companyIdIndex, 1);
    columns.splice(columns.indexOf("company_name") + 1, 0, "company_id");
  }

  const sortableColumns = ALLOWED_SORT_COLUMNS as readonly string[];
  const currentSortOrder = sortOrder === "desc" ? "desc" : "asc";

  function buildSortHref(col: string): string {
    const params = new URLSearchParams();
    if (drawingNumber) params.set("drawing_number", drawingNumber);
    if (subject) params.set("subject", subject);
    if (companyName) params.set("company_name", companyName);
    if (orderDateFrom) params.set("order_date_from", orderDateFrom);
    if (orderDateTo) params.set("order_date_to", orderDateTo);
    const nextSortOrder =
      sortBy === col && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sort_by", col);
    params.set("sort_order", nextSortOrder);
    return `/?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">受注一覧（{orders.length}件）</h1>
        }
        newHref="/orders/new"
      />
      <form action="/" method="GET" className="mb-4 flex items-center gap-2">
        <label htmlFor="drawing_number" className="text-sm">
          図番
        </label>
        <input
          type="text"
          id="drawing_number"
          name="drawing_number"
          defaultValue={drawingNumber}
          placeholder="図番で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="subject" className="text-sm">
          件名
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          defaultValue={subject}
          placeholder="件名で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="company_name" className="text-sm">
          会社名
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          defaultValue={companyName}
          placeholder="会社名で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="order_date_from" className="text-sm">
          受注日
        </label>
        <input
          type="date"
          id="order_date_from"
          name="order_date_from"
          defaultValue={orderDateFrom}
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <span className="text-sm">〜</span>
        <input
          type="date"
          id="order_date_to"
          name="order_date_to"
          defaultValue={orderDateTo}
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-1 text-sm"
        >
          検索
        </button>
        <Link
          href="/"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
        >
          検索解除
        </Link>
      </form>
      {orders.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                {columns.map((col) => {
                  const label = COLUMN_LABELS[col] ?? col;
                  const isSortable = sortableColumns.includes(col);
                  const isCurrentSort = isSortable && sortBy === col;

                  if (!isSortable) {
                    return (
                      <th
                        key={col}
                        className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                      >
                        {label}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={col}
                      className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                    >
                      <a href={buildSortHref(col)} className="hover:underline">
                        {label}
                        {isCurrentSort
                          ? currentSortOrder === "asc"
                            ? " ▲"
                            : " ▼"
                          : ""}
                      </a>
                    </th>
                  );
                })}
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  担当者
                </th>
                {STATUS_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.id}
                        </Link>
                      ) : (
                        String(order[col as keyof typeof order] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.notes ?? ""}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    {order.assignee ?? ""}
                  </td>
                  {STATUS_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="border border-zinc-300 px-3 py-2"
                    >
                      {order[col.key]}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <DeleteConfirmDialog
                      id={order.id}
                      description={`受注 ${order.order_code}（ID: ${order.id}）を削除します。この操作は取り消せません。`}
                      onDelete={deleteOrder}
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
