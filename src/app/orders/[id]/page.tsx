import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getAggregatedStatus } from "@/lib/backlog";
import { OrderForm } from "./order-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  const supabase = await createClient();

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("id", { ascending: true });

  if (companiesError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          companiesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {companiesError.message}
        </pre>
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-xl font-bold">新規受注</h1>
        <OrderForm order={null} companies={companies ?? []} />
      </div>
    );
  }

  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    notFound();
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_code, company_id, subject, drawing_number, quantity, unit, unit_price, order_date, desired_delivery_date, completion_date, notes, batch_invoice_id, invoice_sent_date, payment_date, receipt_sent_date",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {orderError.message}
        </pre>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const { data: workOrders, error: workOrdersError } = await supabase
    .from("work_orders")
    .select("assignee")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

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

  const assignee = workOrders && workOrders.length > 0 ? workOrders[0].assignee : null;
  const manufacturingStatus =
    workOrders && workOrders.length > 0 ? "製造指示済み" : "未製造指示";

  const { data: deliveryNoteItems, error: deliveryNoteItemsError } =
    await supabase
      .from("delivery_note_items")
      .select("delivered_quantity, delivery_notes(created_date)")
      .eq("order_id", orderId);

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

  let deliveredQuantity = 0;
  let latestDeliveryDate: string | null = null;
  for (const item of deliveryNoteItems ?? []) {
    const { delivery_notes } = item as typeof item & {
      delivery_notes: { created_date: string } | null;
    };
    deliveredQuantity += item.delivered_quantity;
    const createdDate = delivery_notes?.created_date;
    if (createdDate && (!latestDeliveryDate || createdDate > latestDeliveryDate)) {
      latestDeliveryDate = createdDate;
    }
  }
  const remainingQuantity = order.quantity - deliveredQuantity;

  const deliveryStatus =
    deliveredQuantity === 0
      ? "未納品"
      : remainingQuantity === 0
        ? "完納"
        : "分納";

  const { data: invoiceRows, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, payment_status, sent_flag, receipts(sent_flag)")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

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

  type InvoiceRow = {
    payment_status: string;
    sent_flag: boolean;
    receipts: { sent_flag: boolean }[] | { sent_flag: boolean } | null;
  };

  const invoiceRow =
    invoiceRows && invoiceRows.length > 0
      ? (invoiceRows[invoiceRows.length - 1] as InvoiceRow)
      : null;
  const receiptSentFlag = invoiceRow
    ? Array.isArray(invoiceRow.receipts)
      ? (invoiceRow.receipts[0]?.sent_flag ?? null)
      : (invoiceRow.receipts?.sent_flag ?? null)
    : null;

  const invoiceStatus =
    deliveryStatus !== "完納" ? "" : invoiceRow ? "請求済み" : "未請求";

  const paymentStatusLabel = !invoiceRow
    ? "-"
    : invoiceRow.payment_status === "入金済み"
      ? "入金済み"
      : "未入金";

  const sentStatusLabel = !invoiceRow
    ? "-"
    : invoiceRow.sent_flag
      ? "請求書送信済み"
      : "請求書未送信";

  const receiptSentStatusLabel = !invoiceRow
    ? "-"
    : receiptSentFlag
      ? "領収書送信済み"
      : "領収書未送信";

  const aggregatedStatus = getAggregatedStatus({
    manufacturingStatus,
    deliveryStatus,
    invoiceStatus,
    paymentStatusLabel,
  });

  const orderWithDetail = {
    ...order,
    assignee,
    total_amount: order.unit_price * order.quantity,
    delivered_quantity: deliveredQuantity,
    remaining_quantity: remainingQuantity,
    latest_delivery_date: latestDeliveryDate,
    aggregated_status: aggregatedStatus,
    manufacturing_status: manufacturingStatus,
    delivery_status: deliveryStatus,
    invoice_status: invoiceStatus,
    payment_status_label: paymentStatusLabel,
    sent_status_label: sentStatusLabel,
    receipt_sent_status_label: receiptSentStatusLabel,
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">受注編集</h1>
      <OrderForm order={orderWithDetail} companies={companies ?? []} />
    </div>
  );
}
