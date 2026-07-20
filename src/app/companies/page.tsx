import { supabase } from "@/lib/supabase";

export default async function Companies() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*");

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          companiesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const columns =
    companies && companies.length > 0 ? Object.keys(companies[0]) : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        companies 一覧（{companies?.length ?? 0}件）
      </h1>
      {!companies || companies.length === 0 ? (
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
              {companies.map((company, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(company[col] ?? "")}
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
