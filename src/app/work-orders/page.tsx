import { supabase } from "@/lib/supabase";

export default async function WorkOrders() {
  const { data: rawWorkOrders, error } = await supabase
    .from("work_orders")
    .select("*, orders(order_code, subject)");

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
      order_id: unknown;
      orders: { order_code: string; subject: string } | null;
    };
    return {
      ...rest,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
    };
  });

  const columns =
    workOrders && workOrders.length > 0 ? Object.keys(workOrders[0]) : [];

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
