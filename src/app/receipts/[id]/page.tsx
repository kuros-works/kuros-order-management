import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReceiptDetailForm } from "./receipt-detail-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const receiptId = Number(id);
  if (!Number.isFinite(receiptId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: receiptRow, error } = await supabase
    .from("receipts")
    .select(
      "id, receipt_code, created_date, received_date, received_amount, sent_flag, invoices(invoice_code, issued_date, order_id, orders(order_code, subject, drawing_number, unit_price, quantity, notes, companies(company_name)))",
    )
    .eq("id", receiptId)
    .maybeSingle();

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

  if (!receiptRow) {
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
  type InvoiceRef = {
    invoice_code: string;
    issued_date: string;
    order_id: number;
    orders: OrderRef[] | OrderRef | null;
  };

  const { invoices: invoiceRef, ...rest } = receiptRow as typeof receiptRow & {
    invoices: InvoiceRef[] | InvoiceRef | null;
  };

  const invoiceInfo = Array.isArray(invoiceRef) ? invoiceRef[0] : invoiceRef;
  const orderRef = invoiceInfo?.orders ?? null;
  const orderInfo = orderRef
    ? Array.isArray(orderRef)
      ? orderRef[0]
      : orderRef
    : null;
  const companyRef = orderInfo
    ? Array.isArray(orderInfo.companies)
      ? orderInfo.companies[0]
      : orderInfo.companies
    : null;

  const receiptDetail = {
    ...rest,
    sent_status_label: rest.sent_flag ? "送信済み" : "未送信",
    invoice_code: invoiceInfo?.invoice_code ?? "-",
    issued_date: invoiceInfo?.issued_date ?? "-",
    order_id: invoiceInfo?.order_id ?? 0,
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
      <h1 className="mb-4 text-xl font-bold">領収書編集</h1>
      <ReceiptDetailForm receipt={receiptDetail} />
    </div>
  );
}
