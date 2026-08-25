type PrintDocumentType = "delivery" | "invoice" | "receipt";

type PrintDocumentIssuer = {
  companyName: string;
  contactPerson: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  invoiceRegistrationNumber: string | null;
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
};

type PrintDocumentLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type PrintDocumentProps = {
  documentType: PrintDocumentType;
  documentNumber: string;
  documentDate: string;
  companyName: string;
  contactName: string | null;
  companyAddress: string | null;
  issuer: PrintDocumentIssuer;
  lineItems: PrintDocumentLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  showPaymentInfo: boolean;
  notes: string | null;
};

const DOCUMENT_TITLE: Record<PrintDocumentType, string> = {
  delivery: "納品書",
  invoice: "請求書",
  receipt: "領収書",
};

const DOCUMENT_NUMBER_LABEL: Record<PrintDocumentType, string> = {
  delivery: "納品書番号",
  invoice: "請求書番号",
  receipt: "領収書番号",
};

function formatYen(value: number): string {
  return `${value.toLocaleString("ja-JP")}円`;
}

export function PrintDocument({
  documentType,
  documentNumber,
  documentDate,
  companyName,
  contactName,
  companyAddress,
  issuer,
  lineItems,
  subtotal,
  tax,
  total,
  showPaymentInfo,
  notes,
}: PrintDocumentProps) {
  const receiptCauseText =
    documentType === "receipt"
      ? Array.from(
          new Set(lineItems.map((item) => item.description).filter(Boolean)),
        ).join("、")
      : "";

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-10 text-sm text-zinc-900 print:max-w-none print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          .print-no-break { break-inside: avoid; }
        }
      `}</style>

      <h1 className="mb-8 text-center text-2xl font-bold">
        {DOCUMENT_TITLE[documentType]}
      </h1>

      <div className="mb-8 flex justify-between">
        <div>
          <p className="text-lg font-bold">{companyName} 御中</p>
          {contactName && <p>{contactName} 様</p>}
          {companyAddress && (
            <p className="mt-1 text-zinc-600">{companyAddress}</p>
          )}
        </div>
        <div className="text-right">
          <p>
            {DOCUMENT_NUMBER_LABEL[documentType]}: {documentNumber}
          </p>
          <p>発行日: {documentDate}</p>
          {issuer.invoiceRegistrationNumber && (
            <p>登録番号: {issuer.invoiceRegistrationNumber}</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <p className="font-bold">{issuer.companyName}</p>
        <p>{issuer.postalCode}</p>
        <p>{issuer.address}</p>
        <p>TEL: {issuer.phone}</p>
        <p>{issuer.email}</p>
        <p>{issuer.contactPerson}</p>
      </div>

      <table className="print-no-break mb-6 w-full border-collapse border border-zinc-400">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border border-zinc-400 px-2 py-1 text-left">品名</th>
            <th className="border border-zinc-400 px-2 py-1 text-right">数量</th>
            <th className="border border-zinc-400 px-2 py-1 text-left">単位</th>
            <th className="border border-zinc-400 px-2 py-1 text-right">単価</th>
            <th className="border border-zinc-400 px-2 py-1 text-right">金額</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr key={index}>
              <td className="border border-zinc-400 px-2 py-1">
                {item.description}
              </td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {item.quantity.toLocaleString("ja-JP")}
              </td>
              <td className="border border-zinc-400 px-2 py-1">{item.unit}</td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {item.unitPrice.toLocaleString("ja-JP")}
              </td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {item.amount.toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-no-break mb-8 flex justify-end">
        <table className="w-64 border-collapse">
          <tbody>
            <tr>
              <td className="py-1">小計</td>
              <td className="py-1 text-right">{formatYen(subtotal)}</td>
            </tr>
            <tr>
              <td className="py-1">消費税</td>
              <td className="py-1 text-right">{formatYen(tax)}</td>
            </tr>
            <tr className="font-bold">
              <td className="border-t border-zinc-400 py-1">合計金額</td>
              <td className="border-t border-zinc-400 py-1 text-right">
                {formatYen(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {documentType === "receipt" && (
        <div className="print-no-break mb-8">
          <div className="mb-6 flex items-end justify-between">
            <p>但し　{receiptCauseText || "商品代金"}として</p>
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center border border-zinc-400 text-xs text-zinc-500">
              収入印紙
            </div>
          </div>
          <p className="text-center text-base font-bold">
            上記正に領収いたしました
          </p>
        </div>
      )}

      {showPaymentInfo && (
        <div className="print-no-break mb-8">
          <p className="mb-1 font-bold">お振込先</p>
          <p>
            {issuer.bankName} {issuer.branchName}
          </p>
          <p>
            {issuer.accountType} {issuer.accountNumber}
          </p>
          <p>{issuer.accountHolder}</p>
        </div>
      )}

      {notes && (
        <div className="print-no-break">
          <p className="mb-1 font-bold">備考</p>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
