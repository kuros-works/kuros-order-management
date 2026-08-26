import { createClient } from "@/lib/supabase-server";
import {
  WorkOrderPrintCard,
  type WorkOrderPrintCardData,
} from "@/components/print/WorkOrderPrintCard";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function WorkOrdersPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const issuedDate = getSingleParam(resolvedSearchParams, "issued_date");
  const printMode = getSingleParam(resolvedSearchParams, "print") === "1";

  const supabase = await createClient();

  let workOrders: WorkOrderPrintCardData[] | null = null;
  let searchError: string | null = null;

  if (issuedDate) {
    const { data, error } = await supabase
      .from("work_orders_with_order_info")
      .select(
        "id, work_order_code, assignee, issued_date, order_code, subject, drawing_number, quantity, desired_delivery_date, company_name, order_notes",
      )
      .eq("issued_date", issuedDate)
      .order("work_order_code", { ascending: true });

    if (error) {
      searchError = `製造指示書の取得に失敗しました: ${error.message}`;
    } else {
      workOrders = data as WorkOrderPrintCardData[];
    }
  }

  const listHref = `/work-orders/print?${new URLSearchParams({
    issued_date: issuedDate,
  }).toString()}`;

  if (printMode && issuedDate && !searchError && workOrders) {
    return (
      <div>
        <style>{`
          @media print {
            @page { size: A4; margin: 15mm; }
            .work-order-print-page:not(:last-child) { break-after: page; }
          }
        `}</style>
        <div className="mb-4 flex items-center justify-between p-8 pb-0 print:hidden">
          <p className="text-sm font-bold text-zinc-700">
            発行日 {issuedDate} の製造指示書 {workOrders.length}件 印刷プレビュー
          </p>
          <a
            href={listHref}
            className="rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
          >
            閉じる
          </a>
        </div>
        {workOrders.map((workOrder) => (
          <WorkOrderPrintCard key={workOrder.id} workOrder={workOrder} />
        ))}
      </div>
    );
  }

  const printHref = `/work-orders/print?${new URLSearchParams({
    issued_date: issuedDate,
    print: "1",
  }).toString()}`;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">製造指示書 一括印刷</h1>
      <form
        action="/work-orders/print"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label htmlFor="issued_date" className="mb-1 block text-sm font-bold">
            発行日
          </label>
          <input
            id="issued_date"
            name="issued_date"
            type="date"
            required
            defaultValue={issuedDate}
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

      {searchError && (
        <p className="text-sm font-bold text-red-600">{searchError}</p>
      )}

      {issuedDate &&
        !searchError &&
        (workOrders && workOrders.length > 0 ? (
          <>
            <p className="mb-2 text-sm font-bold">
              発行日 {issuedDate} 合計{workOrders.length}件
            </p>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse border border-zinc-300 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      製造指示書No
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      件名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      会社名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      数量
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((workOrder) => (
                    <tr key={workOrder.id}>
                      <td className="border border-zinc-300 px-3 py-2">
                        {workOrder.work_order_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {workOrder.subject ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {workOrder.company_name ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {workOrder.quantity ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              href={printHref}
              className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
            >
              印刷
            </a>
          </>
        ) : (
          <p>該当する製造指示書がありません</p>
        ))}
    </div>
  );
}
