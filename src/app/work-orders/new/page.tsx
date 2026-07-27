import { createClient } from "@/lib/supabase-server";
import { WorkOrderForm } from "./work-order-form";

export default async function NewWorkOrderPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_code, subject")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">新規work_order</h1>
      <WorkOrderForm orders={orders ?? []} />
    </div>
  );
}
