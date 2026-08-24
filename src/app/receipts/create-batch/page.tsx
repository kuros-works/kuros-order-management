import { createClient } from "@/lib/supabase-server";
import { createBatchReceipt } from "./actions";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function CreateBatchReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const batchInvoiceNo = getSingleParam(resolvedSearchParams, "batch_invoice_no");
  const actionError = getSingleParam(resolvedSearchParams, "action_error");
  const confirmedNo = getSingleParam(resolvedSearchParams, "confirmed_no");
  const confirmedCount = getSingleParam(resolvedSearchParams, "confirmed_count");

  const supabase = await createClient();

  const hasSearchCondition = !!batchInvoiceNo;

  let receiptItems:
    | {
        id: number;
        receipt_code: string;
        created_date: string | null;
        invoice_code: string;
        order_code: string | null;
        subject: string | null;
        quantity: number | null;
        unit_price: number | null;
        total_amount: number | null;
        company_name: string | null;
        received_date: string | null;
        received_amount: number | null;
        batch_receipt_no: string | null;
      }[]
    | null = null;
  let unpaidCount = 0;
  let confirmedExcludedCount = 0;
  let searchError: string | null = null;

  if (hasSearchCondition) {
    const { data: rawItems, error } = await supabase
      .from("receipts_with_order_info")
      .select("*")
      .eq("batch_invoice_no", batchInvoiceNo)
      .order("id", { ascending: true });

    if (error) {
      searchError = `領収データの取得に失敗しました: ${error.message}`;
    } else {
      const eligibleItems = (rawItems ?? []).filter(
        (item) => item.received_date !== null,
      );
      unpaidCount = (rawItems ?? []).length - eligibleItems.length;

      const itemIds = eligibleItems.map((item) => item.id as number);
      const batchReceiptNoById = new Map<number, string | null>();
      if (itemIds.length > 0) {
        const { data: batchRows, error: batchRowsError } = await supabase
          .from("receipts")
          .select("id, batch_receipt_no")
          .in("id", itemIds);

        if (batchRowsError) {
          searchError = `確定番号の取得に失敗しました: ${batchRowsError.message}`;
        } else {
          for (const row of batchRows ?? []) {
            batchReceiptNoById.set(row.id, row.batch_receipt_no);
          }
        }
      }

      if (!searchError) {
        const paidItems = eligibleItems.map((item) => ({
          id: item.id,
          receipt_code: item.receipt_code,
          created_date: item.created_date,
          invoice_code: item.invoice_code,
          order_code: item.order_code,
          subject: item.subject,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          company_name: item.company_name,
          received_date: item.received_date,
          received_amount: item.received_amount,
          batch_receipt_no: batchReceiptNoById.get(item.id) ?? null,
        }));
        receiptItems = paidItems.filter(
          (item) => item.batch_receipt_no === null,
        );
        confirmedExcludedCount = paidItems.length - receiptItems.length;
      }
    }
  }

  const totalQuantity =
    receiptItems?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
  const totalAmount =
    receiptItems?.reduce((sum, item) => sum + (item.total_amount ?? 0), 0) ??
    0;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">一括領収書の抽出プレビュー</h1>
      <form
        action="/receipts/create-batch"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label
            htmlFor="batch_invoice_no"
            className="mb-1 block text-sm font-bold"
          >
            一括請求書コード
          </label>
          <input
            id="batch_invoice_no"
            name="batch_invoice_no"
            type="text"
            required
            defaultValue={batchInvoiceNo}
            placeholder="例: BI-0001"
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

      {actionError && (
        <p className="mb-4 text-sm font-bold text-red-600">{actionError}</p>
      )}

      {confirmedNo && confirmedCount && (
        <p className="mb-4 text-sm font-bold text-green-700">
          {confirmedNo}として{confirmedCount}件を確定しました
        </p>
      )}

      {searchError && (
        <p className="text-sm font-bold text-red-600">{searchError}</p>
      )}

      {hasSearchCondition && !searchError && unpaidCount > 0 && (
        <p className="mb-4 text-sm font-bold text-amber-700">
          {unpaidCount}件が未入金のため対象外です
        </p>
      )}

      {hasSearchCondition && !searchError && confirmedExcludedCount > 0 && (
        <p className="mb-4 text-sm font-bold text-amber-700">
          {confirmedExcludedCount}件は既に確定済みのため対象外です
        </p>
      )}

      {hasSearchCondition &&
        !searchError &&
        (receiptItems && receiptItems.length > 0 ? (
          <>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse border border-zinc-300 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      領収書番号
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      作成日
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      請求書番号
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      受注No
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      件名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      数量
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      単価
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      金額
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      会社名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      入金日
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      入金額
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.receipt_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.created_date ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.invoice_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.order_code ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.subject ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.quantity ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.unit_price != null
                          ? item.unit_price.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.total_amount != null
                          ? item.total_amount.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.company_name ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.received_date ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.received_amount != null
                          ? item.received_amount.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm font-bold">
              合計数量: {totalQuantity.toLocaleString("ja-JP")} / 合計金額:{" "}
              {totalAmount.toLocaleString("ja-JP")}円
            </p>
            <form action={createBatchReceipt} className="mt-4">
              <input
                type="hidden"
                name="batch_invoice_no"
                value={batchInvoiceNo}
              />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                一括領収書を作成
              </button>
            </form>
          </>
        ) : (
          <p>
            {confirmedExcludedCount > 0
              ? "対象となる未確定データがありません"
              : "該当するデータがありません"}
          </p>
        ))}
    </div>
  );
}
