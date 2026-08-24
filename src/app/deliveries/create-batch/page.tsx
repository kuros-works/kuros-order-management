import { createClient } from "@/lib/supabase-server";
import { createBatchDelivery } from "./actions";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function CreateBatchDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const companyId = getSingleParam(resolvedSearchParams, "company_id");
  const startDate = getSingleParam(resolvedSearchParams, "start_date");
  const endDate = getSingleParam(resolvedSearchParams, "end_date");
  const actionError = getSingleParam(resolvedSearchParams, "action_error");
  const confirmedNo = getSingleParam(resolvedSearchParams, "confirmed_no");
  const confirmedCount = getSingleParam(resolvedSearchParams, "confirmed_count");

  const supabase = await createClient();

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("id", { ascending: true });

  if (companiesError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          companiesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {companiesError.message}
        </pre>
      </div>
    );
  }

  const hasSearchCondition = !!companyId && !!startDate && !!endDate;
  const selectedCompany = companies?.find(
    (company) => String(company.id) === companyId,
  );

  let deliveryItems:
    | {
        id: number;
        delivery_date: string | null;
        delivery_note_code: string;
        order_code: string | null;
        subject: string | null;
        delivered_quantity: number;
        unit_price: number | null;
        total_amount: number | null;
        batch_delivery_no: string | null;
      }[]
    | null = null;
  let confirmedExcludedCount = 0;
  let searchError: string | null = null;

  if (hasSearchCondition) {
    if (!selectedCompany || !selectedCompany.company_name) {
      searchError = "選択された会社が見つかりません";
    } else {
      const { data: rawItems, error } = await supabase
        .from("deliveries_with_order_info")
        .select("*")
        .eq("company_name", selectedCompany.company_name)
        .gte("delivery_date", startDate)
        .lte("delivery_date", endDate)
        .order("delivery_date", { ascending: true });

      if (error) {
        searchError = `納品データの取得に失敗しました: ${error.message}`;
      } else {
        const deliveryNoteIds = Array.from(
          new Set(
            (rawItems ?? [])
              .map((item) => item.delivery_note_id)
              .filter((id): id is number => id !== null && id !== undefined),
          ),
        );

        const deliveryNoteCodeById = new Map<number, string>();
        if (deliveryNoteIds.length > 0) {
          const { data: deliveryNotes, error: notesError } = await supabase
            .from("delivery_notes")
            .select("id, delivery_note_code")
            .in("id", deliveryNoteIds);

          if (notesError) {
            searchError = `納品書番号の取得に失敗しました: ${notesError.message}`;
          } else {
            for (const note of deliveryNotes ?? []) {
              deliveryNoteCodeById.set(note.id, note.delivery_note_code);
            }
          }
        }

        const itemIds = (rawItems ?? []).map((item) => item.id as number);
        const batchDeliveryNoById = new Map<number, string | null>();
        if (!searchError && itemIds.length > 0) {
          const { data: batchRows, error: batchRowsError } = await supabase
            .from("delivery_note_items")
            .select("id, batch_delivery_no")
            .in("id", itemIds);

          if (batchRowsError) {
            searchError = `確定番号の取得に失敗しました: ${batchRowsError.message}`;
          } else {
            for (const row of batchRows ?? []) {
              batchDeliveryNoById.set(row.id, row.batch_delivery_no);
            }
          }
        }

        if (!searchError) {
          const allItems = (rawItems ?? []).map((item) => ({
            id: item.id,
            delivery_date: item.delivery_date,
            delivery_note_code:
              item.delivery_note_id !== null &&
              item.delivery_note_id !== undefined
                ? (deliveryNoteCodeById.get(item.delivery_note_id) ?? "-")
                : "-",
            order_code: item.order_code,
            subject: item.subject,
            delivered_quantity: item.delivered_quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            batch_delivery_no: batchDeliveryNoById.get(item.id) ?? null,
          }));
          deliveryItems = allItems.filter(
            (item) => item.batch_delivery_no === null,
          );
          confirmedExcludedCount = allItems.length - deliveryItems.length;
        }
      }
    }
  }

  const totalQuantity =
    deliveryItems?.reduce(
      (sum, item) => sum + (item.delivered_quantity ?? 0),
      0,
    ) ?? 0;
  const totalAmount =
    deliveryItems?.reduce((sum, item) => sum + (item.total_amount ?? 0), 0) ??
    0;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">納品書の抽出プレビュー</h1>
      <form
        action="/deliveries/create-batch"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label
            htmlFor="company_id"
            className="mb-1 block text-sm font-bold"
          >
            会社
          </label>
          <select
            id="company_id"
            name="company_id"
            required
            defaultValue={companyId}
            className="w-56 rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              選択してください
            </option>
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="start_date"
            className="mb-1 block text-sm font-bold"
          >
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

      {hasSearchCondition &&
        !searchError &&
        confirmedExcludedCount > 0 &&
        deliveryItems &&
        deliveryItems.length > 0 && (
          <p className="mb-4 text-sm font-bold text-amber-700">
            {confirmedExcludedCount}件は既に確定済みのため対象外です
          </p>
        )}

      {hasSearchCondition &&
        !searchError &&
        (deliveryItems && deliveryItems.length > 0 ? (
          <>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse border border-zinc-300 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      納品日
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      納品書番号
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      受注No
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      件名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      納品数量
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      単価
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      金額
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.delivery_date ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.delivery_note_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.order_code ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.subject ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.delivered_quantity}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm font-bold">
              合計数量: {totalQuantity.toLocaleString("ja-JP")} / 合計金額:{" "}
              {totalAmount.toLocaleString("ja-JP")}円
            </p>
            <form action={createBatchDelivery} className="mt-4">
              <input type="hidden" name="company_id" value={companyId} />
              <input type="hidden" name="start_date" value={startDate} />
              <input type="hidden" name="end_date" value={endDate} />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                納品書を作成
              </button>
            </form>
          </>
        ) : (
          <p>
            {confirmedExcludedCount > 0
              ? `対象となる未確定データがありません（${confirmedExcludedCount}件は既に確定済みのため除外されました）`
              : "該当するデータがありません"}
          </p>
        ))}
    </div>
  );
}
