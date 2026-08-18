import Link from "next/link";

type Invoice = {
  id: number;
  invoice_code: string;
  issued_date: string;
  notes: string | null;
};

export function InvoiceTabContent({
  invoice,
  paymentStatusLabel,
  sentStatusLabel,
}: {
  invoice: Invoice | null;
  paymentStatusLabel: string;
  sentStatusLabel: string;
}) {
  if (!invoice) {
    return (
      <div className="space-y-2">
        <p className="text-zinc-500">請求書未作成</p>
        <Link href="/invoices/new" className="text-blue-600 hover:underline">
          請求書を新規作成
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 block text-sm font-bold">請求書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.invoice_code}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">請求日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.issued_date}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">入金状況</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {paymentStatusLabel}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">請求書送信状況</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {sentStatusLabel}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">備考</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.notes ?? "-"}
        </div>
      </div>
    </div>
  );
}
