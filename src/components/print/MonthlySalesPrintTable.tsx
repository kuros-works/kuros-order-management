import type { MonthlySalesInvoice } from "@/lib/monthly-sales";

export type MonthlySalesPrintTableProps = {
  startDate: string;
  endDate: string;
  invoices: MonthlySalesInvoice[];
  totalAmount: number;
};

function formatYen(value: number | null): string {
  return `¥${(value ?? 0).toLocaleString("ja-JP")}`;
}

export function MonthlySalesPrintTable({
  startDate,
  endDate,
  invoices,
  totalAmount,
}: MonthlySalesPrintTableProps) {
  return (
    <div className="mx-auto max-w-[420mm] bg-white p-10 text-xs text-zinc-900 print:max-w-none print:p-0">
      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 10mm; }
          .print-no-break { break-inside: avoid; }
        }
      `}</style>

      <h1 className="mb-2 text-center text-xl font-bold">月次売上台帳</h1>
      <p className="mb-6 text-center text-sm">
        対象期間（一括請求確定日）: {startDate} 〜 {endDate}
      </p>

      <table className="print-no-break w-full border-collapse border border-zinc-400">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border border-zinc-400 px-2 py-1 text-left">ID</th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              請求書番号
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              請求日
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              入金状況
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              受注No
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              件名
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              図番
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-right">
              単価
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-right">
              数量
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-left">
              会社名
            </th>
            <th className="border border-zinc-400 px-2 py-1 text-right">
              金額
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.id}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.invoice_code}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.issued_date}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.payment_status ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.order_code ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.subject ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.drawing_number ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {invoice.unit_price?.toLocaleString("ja-JP") ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {invoice.quantity?.toLocaleString("ja-JP") ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1">
                {invoice.company_name ?? ""}
              </td>
              <td className="border border-zinc-400 px-2 py-1 text-right">
                {formatYen(invoice.total_amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td
              className="border border-zinc-400 px-2 py-1 text-right"
              colSpan={10}
            >
              合計金額
            </td>
            <td className="border border-zinc-400 px-2 py-1 text-right">
              {formatYen(totalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
