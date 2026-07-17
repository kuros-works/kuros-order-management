import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: rawOrders, error } = await supabase
    .from("orders")
    .select("*, companies(company_name)");

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

  const orders = rawOrders?.map((order) => {
    const { company_id, companies, ...rest } = order as typeof order & {
      company_id: unknown;
      companies: { company_name: string } | null;
    };
    return {
      ...rest,
      company_name: companies?.company_name ?? company_id,
    };
  });

  const columns = orders && orders.length > 0 ? Object.keys(orders[0]) : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">orders 一覧（{orders?.length ?? 0}件）</h1>
      {!orders || orders.length === 0 ? (
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
              {orders.map((order, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(order[col] ?? "")}
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
