import { createClient } from "@/lib/supabase-server";
import { BatchInvoiceForm } from "./batch-invoice-form";

export default async function NewBatchInvoicePage() {
  const supabase = await createClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("id", { ascending: true });

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

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">まとめ請求書（新規作成）</h1>
      <BatchInvoiceForm companies={companies ?? []} />
    </div>
  );
}
