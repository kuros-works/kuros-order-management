import { supabase } from "@/lib/supabase";

export default async function Receipts() {
  const { data: rawReceipts, error } = await supabase
    .from("receipts")
    .select("*, companies(company_name)");

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          receiptsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const receipts = rawReceipts?.map((receipt) => {
    const { company_id, companies, ...rest } = receipt as typeof receipt & {
      company_id: unknown;
      companies: { company_name: string } | null;
    };
    return {
      ...rest,
      company_name: companies?.company_name ?? company_id,
    };
  });

  const columns =
    receipts && receipts.length > 0 ? Object.keys(receipts[0]) : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        receipts 一覧（{receipts?.length ?? 0}件）
      </h1>
      {!receipts || receipts.length === 0 ? (
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
              {receipts.map((receipt, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(receipt[col] ?? "")}
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
