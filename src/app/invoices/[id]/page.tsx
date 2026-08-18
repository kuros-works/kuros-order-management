import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { InvoiceDetailForm } from "./invoice-detail-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: invoiceRow, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_code, issued_date, payment_status, sent_flag, sent_date, order_id, orders(order_code, subject, drawing_number, unit_price, quantity, notes, companies(company_name))",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  if (!invoiceRow) {
    notFound();
  }

  type CompanyRef = { company_name: string };
  type OrderRef = {
    order_code: string;
    subject: string;
    drawing_number: string | null;
    unit_price: number;
    quantity: number;
    notes: string | null;
    companies: CompanyRef[] | CompanyRef | null;
  };

  const { orders: orderRef, ...rest } = invoiceRow as typeof invoiceRow & {
    orders: OrderRef[] | OrderRef | null;
  };

  const orderInfo = Array.isArray(orderRef) ? orderRef[0] : orderRef;
  const companyRef = orderInfo
    ? Array.isArray(orderInfo.companies)
      ? orderInfo.companies[0]
      : orderInfo.companies
    : null;

  const invoiceDetail = {
    ...rest,
    sent_status_label: rest.sent_flag ? "送付済み" : "未送付",
    order_code: orderInfo?.order_code ?? "-",
    subject: orderInfo?.subject ?? "-",
    drawing_number: orderInfo?.drawing_number ?? null,
    unit_price: orderInfo?.unit_price ?? 0,
    quantity: orderInfo?.quantity ?? 0,
    company_name: companyRef?.company_name ?? "-",
    order_notes: orderInfo?.notes ?? null,
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">請求書編集</h1>
      <InvoiceDetailForm invoice={invoiceDetail} />
    </div>
  );
}
