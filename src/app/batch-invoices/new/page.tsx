import { createClient } from "@/lib/supabase-server";
import {
  getInvoicedOrderIds,
  getOrdersWithRemainingQuantity,
} from "@/lib/backlog";
import { BatchInvoiceForm } from "./batch-invoice-form";

export default async function NewBatchInvoicePage() {
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

  const { data: backlog, error: backlogError } =
    await getOrdersWithRemainingQuantity(supabase);

  if (backlogError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{backlogError}</h1>
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

  const eligibleOrders = (backlog ?? [])
    .filter(
      (order) =>
        order.remaining_quantity === 0 &&
        order.batch_invoice_id === null &&
        !invoicedOrderIds?.has(order.id),
    )
    .map((order) => ({
      id: order.id,
      order_code: order.order_code,
      subject: order.subject,
      company_id: order.company_id,
      unit_price: order.unit_price,
      quantity: order.quantity,
    }));

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">一括請求書（新規作成）</h1>
      <BatchInvoiceForm companies={companies ?? []} orders={eligibleOrders} />
    </div>
  );
}
