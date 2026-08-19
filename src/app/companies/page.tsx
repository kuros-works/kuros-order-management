import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { ListPageHeader } from "@/components/layout/list-page-header";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  company_code: "会社コード",
  postal_code: "郵便番号",
  address: "住所",
  phone: "電話番号",
  contact_name: "担当者名",
  email: "メールアドレス",
  payment_terms_days: "支払いサイト",
  invoice_registration_number: "インボイス登録番号",
  registered_date: "登録日",
  company_name: "会社名",
  notes: "備考",
};

export default async function Companies() {
  const supabase = await createClient();
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
    companies && companies.length > 0
      ? Object.keys(companies[0]).filter((col) => col !== "created_at")
      : [];

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">
            companies 一覧（{companies?.length ?? 0}件）
          </h1>
        }
        newHref="/companies/new"
      />
      {!companies || companies.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                  >
                    {COLUMN_LABELS[col] ?? col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/companies/${company.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.id}
                        </Link>
                      ) : (
                        String(company[col] ?? "")
                      )}
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
