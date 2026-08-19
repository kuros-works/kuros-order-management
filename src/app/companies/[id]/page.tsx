import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CompanyDetailForm } from "./company-detail-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  const supabase = await createClient();

  if (isNew) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-xl font-bold">新規顧客</h1>
        <CompanyDetailForm company={null} />
      </div>
    );
  }

  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    notFound();
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select(
      "id, company_code, postal_code, address, phone, contact_name, email, payment_terms_days, invoice_registration_number, registered_date, company_name, notes",
    )
    .eq("id", companyId)
    .maybeSingle();

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

  if (!company) {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">顧客編集</h1>
      <CompanyDetailForm company={company} />
    </div>
  );
}
