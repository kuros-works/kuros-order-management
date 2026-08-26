import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getMonthlySales } from "@/lib/monthly-sales";
import { MonthlySalesPrintTable } from "@/components/print/MonthlySalesPrintTable";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

function getCurrentJstDateParts(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month) };
}

function getDefaultMonthRange(): { start: string; end: string } {
  const { year, month } = getCurrentJstDateParts();
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export default async function MonthlySalesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const defaultRange = getDefaultMonthRange();
  const startDate =
    getSingleParam(resolvedSearchParams, "start_date") || defaultRange.start;
  const endDate =
    getSingleParam(resolvedSearchParams, "end_date") || defaultRange.end;
  const printMode = getSingleParam(resolvedSearchParams, "print") === "1";

  const supabase = await createClient();
  const { data: invoices, error } = await getMonthlySales(supabase, {
    startDate,
    endDate,
  });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">{error}</h1>
      </div>
    );
  }

  const totalAmount = (invoices ?? []).reduce(
    (sum, invoice) => sum + (invoice.total_amount ?? 0),
    0,
  );

  if (printMode) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between p-8 pb-0 print:hidden">
          <p className="text-sm font-bold text-zinc-700">
            {startDate} 〜 {endDate} 印刷プレビュー
          </p>
          <Link
            href={`/invoices/monthly-sales?${new URLSearchParams({
              start_date: startDate,
              end_date: endDate,
            }).toString()}`}
            className="rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
          >
            閉じる
          </Link>
        </div>
        <MonthlySalesPrintTable
          startDate={startDate}
          endDate={endDate}
          invoices={invoices ?? []}
          totalAmount={totalAmount}
        />
      </div>
    );
  }

  const printHref = `/invoices/monthly-sales?${new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    print: "1",
  }).toString()}`;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">月次売上台帳</h1>
      <form
        action="/invoices/monthly-sales"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label htmlFor="start_date" className="mb-1 block text-sm font-bold">
            開始日
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={startDate}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="mb-1 block text-sm font-bold">
            終了日
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={endDate}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
        >
          検索
        </button>
      </form>

      <p className="mb-2 text-sm font-bold">
        {startDate} 〜 {endDate}（一括請求確定日基準） 合計¥
        {totalAmount.toLocaleString("ja-JP")}（{invoices?.length ?? 0}件）
      </p>

      {!invoices || invoices.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <>
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full border-collapse border border-zinc-300 text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    ID
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    請求書番号
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    請求日
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    入金状況
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    受注No
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    件名
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    図番
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    単価
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    数量
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    会社名
                  </th>
                  <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    金額
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="border border-zinc-300 px-3 py-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {invoice.id}
                      </Link>
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.invoice_code}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.issued_date}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.payment_status ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.order_code ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.subject ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.drawing_number ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.unit_price?.toLocaleString("ja-JP") ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.quantity?.toLocaleString("ja-JP") ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {invoice.company_name ?? ""}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      ¥{(invoice.total_amount ?? 0).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td
                    className="border border-zinc-300 px-3 py-2 text-right"
                    colSpan={10}
                  >
                    合計金額
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    ¥{totalAmount.toLocaleString("ja-JP")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Link
            href={printHref}
            className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
          >
            印刷
          </Link>
        </>
      )}
    </div>
  );
}
