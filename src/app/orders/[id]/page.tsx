import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
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
      "id, order_code, company_id, subject, drawing_number, quantity, unit, unit_price, order_date, desired_delivery_date, completion_date, notes, batch_invoice_id",
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

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">受注編集</h1>
      <OrderForm order={order} companies={companies ?? []} />
    </div>
  );
}
