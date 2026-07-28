import { createClient } from "@/lib/supabase-server";
import { getOrdersWithRemainingQuantity } from "@/lib/backlog";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: backlog, error: backlogError } =
    await getOrdersWithRemainingQuantity(supabase);

  if (backlogError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{backlogError}</h1>
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

  const invoicedOrderIds = new Set(
    (invoices ?? []).map((invoice) => invoice.order_id),
  );

  const eligibleOrders = (backlog ?? [])
    .filter(
      (order) =>
        order.remaining_quantity === 0 && !invoicedOrderIds.has(order.id),
    )
    .map((order) => ({
      id: order.id,
      order_code: order.order_code,
      subject: order.subject,
      company_id: order.company_id,
      company_name: order.company_name,
      unit_price: order.unit_price,
      quantity: order.quantity,
    }));

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">請求書（新規作成）</h1>
      <InvoiceForm orders={eligibleOrders} />
    </div>
  );
}
