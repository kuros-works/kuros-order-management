import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { updateOrderNotes } from "./actions";

export default async function WorkOrders() {
  const supabase = await createClient();
  const { data: rawWorkOrders, error } = await supabase
    .from("work_orders")
    .select(
      "*, orders(order_code, subject, drawing_number, quantity, desired_delivery_date, notes, companies(company_name))",
    );

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          work_ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const workOrders = rawWorkOrders?.map((workOrder) => {
    const { order_id, orders, ...rest } = workOrder as typeof workOrder & {
      order_id: number;
      orders: {
        order_code: string;
        subject: string;
        drawing_number: string;
        quantity: number;
        desired_delivery_date: string;
        notes: string | null;
        companies: { company_name: string } | null;
      } | null;
    };
    return {
      ...rest,
      order_id,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      drawing_number: orders?.drawing_number ?? null,
      company_name: orders?.companies?.company_name ?? null,
      quantity: orders?.quantity ?? null,
      desired_delivery_date: orders?.desired_delivery_date ?? null,
      order_notes: orders?.notes ?? null,
    };
  });

  const columns =
    workOrders && workOrders.length > 0
      ? Object.keys(workOrders[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "order_id" &&
            col !== "notes" &&
            col !== "order_notes",
        )
      : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        work_orders 一覧（{workOrders?.length ?? 0}件）
      </h1>
      {!workOrders || workOrders.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {workOrders.map((workOrder, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(workOrder[col] ?? "")}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={workOrder.order_id}
                      initialNotes={workOrder.order_notes}
                      onSave={updateOrderNotes}
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
