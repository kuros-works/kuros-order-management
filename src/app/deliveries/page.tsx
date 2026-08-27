import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { ListPageHeader } from "@/components/layout/list-page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { updateOrderNotes, deleteDeliveryNoteItem } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  delivery_note_id: "納品書ID",
  delivery_date: "納品日",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  delivered_quantity: "納品数量",
  unit_price: "単価",
  amount: "金額",
  batch_delivery_no: "確定番号",
};

const OWN_TABLE_SORT_COLUMNS = [
  "id",
  "delivery_note_id",
  "delivered_quantity",
] as const;

const ORDERS_TABLE_SORT_COLUMNS = [
  "order_code",
  "subject",
  "drawing_number",
] as const;

const ALLOWED_SORT_COLUMNS = [
  ...OWN_TABLE_SORT_COLUMNS,
  ...ORDERS_TABLE_SORT_COLUMNS,
  "company_name",
] as const;

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function Deliveries({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const orderCode = getSingleParam(resolvedSearchParams, "order_code");
  const subject = getSingleParam(resolvedSearchParams, "subject");
  const drawingNumber = getSingleParam(resolvedSearchParams, "drawing_number");
  const companyName = getSingleParam(resolvedSearchParams, "company_name");
  const batchDeliveryNo = getSingleParam(
    resolvedSearchParams,
    "batch_delivery_no",
  );
  const sortBy = getSingleParam(resolvedSearchParams, "sort_by");
  const sortOrder = getSingleParam(resolvedSearchParams, "sort_order");

  const supabase = await createClient();
  let deliveryQuery = supabase
    .from("deliveries_with_order_info")
    .select("*");

  if (orderCode) {
    deliveryQuery = deliveryQuery.ilike("order_code", `%${orderCode}%`);
  }

  if (subject) {
    deliveryQuery = deliveryQuery.ilike("subject", `%${subject}%`);
  }

  if (drawingNumber) {
    deliveryQuery = deliveryQuery.ilike("drawing_number", `%${drawingNumber}%`);
  }

  if (companyName) {
    deliveryQuery = deliveryQuery.ilike("company_name", `%${companyName}%`);
  }

  // deliveries_with_order_info ビューは delivery_note_items.batch_delivery_no を
  // 持たないため、一括NO検索は delivery_note_items から該当IDを求めてから絞り込む。
  if (batchDeliveryNo) {
    const { data: batchMatchRows, error: batchMatchError } = await supabase
      .from("delivery_note_items")
      .select("id")
      .ilike("batch_delivery_no", `%${batchDeliveryNo}%`);

    if (batchMatchError) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">
            確定番号の検索に失敗しました
          </h1>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
            {batchMatchError.message}
          </pre>
        </div>
      );
    }

    const batchMatchIds = (batchMatchRows ?? []).map(
      (row) => row.id as number,
    );
    deliveryQuery = deliveryQuery.in("id", batchMatchIds);
  }

  if (
    sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    deliveryQuery = deliveryQuery.order(sortBy, { ascending });
  } else {
    deliveryQuery = deliveryQuery.order("id", { ascending: true });
  }

  const { data: rawDeliveryNoteItems, error } = await deliveryQuery;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          delivery_note_itemsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  // deliveries_with_order_info ビューは delivery_note_items.batch_delivery_no を
  // 持たないため、確定番号表示に必要な分だけ delivery_note_items から補完取得する。
  const deliveryItemIds = (rawDeliveryNoteItems ?? []).map(
    (item) => item.id as number,
  );
  const batchDeliveryNoById = new Map<number, string | null>();

  if (deliveryItemIds.length > 0) {
    const { data: batchRows, error: batchError } = await supabase
      .from("delivery_note_items")
      .select("id, batch_delivery_no")
      .in("id", deliveryItemIds);

    if (batchError) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">
            確定番号の取得に失敗しました
          </h1>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
            {batchError.message}
          </pre>
        </div>
      );
    }

    for (const row of batchRows ?? []) {
      batchDeliveryNoById.set(row.id, row.batch_delivery_no);
    }
  }

  const deliveryNoteItems = rawDeliveryNoteItems?.map((item) => {
    const { total_amount, ...rest } = item as typeof item & {
      total_amount: number | null;
    };
    return {
      ...rest,
      amount: total_amount,
      batch_delivery_no: batchDeliveryNoById.get(rest.id as number) ?? null,
    };
  });

  const columns =
    deliveryNoteItems && deliveryNoteItems.length > 0
      ? Object.keys(deliveryNoteItems[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "notes" &&
            col !== "order_id" &&
            col !== "order_notes",
        )
      : [];

  const sortableColumns = ALLOWED_SORT_COLUMNS as readonly string[];
  const currentSortOrder = sortOrder === "desc" ? "desc" : "asc";

  function buildSortHref(col: string): string {
    const params = new URLSearchParams();
    if (orderCode) params.set("order_code", orderCode);
    if (subject) params.set("subject", subject);
    if (drawingNumber) params.set("drawing_number", drawingNumber);
    if (companyName) params.set("company_name", companyName);
    if (batchDeliveryNo) params.set("batch_delivery_no", batchDeliveryNo);
    const nextSortOrder =
      sortBy === col && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sort_by", col);
    params.set("sort_order", nextSortOrder);
    return `/deliveries?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">
            納品明細一覧（{deliveryNoteItems?.length ?? 0}件）
          </h1>
        }
        newHref="/deliveries/new"
        extraHref="/deliveries/create-batch"
        extraLabel="納品書を作成"
      />
      <form
        action="/deliveries"
        method="GET"
        className="mb-4 flex items-center gap-2"
      >
        <label htmlFor="order_code" className="text-sm">
          受注No
        </label>
        <input
          type="text"
          id="order_code"
          name="order_code"
          defaultValue={orderCode}
          placeholder="受注Noで検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="subject" className="text-sm">
          件名
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          defaultValue={subject}
          placeholder="件名で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="drawing_number" className="text-sm">
          図番
        </label>
        <input
          type="text"
          id="drawing_number"
          name="drawing_number"
          defaultValue={drawingNumber}
          placeholder="図番で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="company_name" className="text-sm">
          会社名
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          defaultValue={companyName}
          placeholder="会社名で検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <label htmlFor="batch_delivery_no" className="text-sm">
          一括NO
        </label>
        <input
          type="text"
          id="batch_delivery_no"
          name="batch_delivery_no"
          defaultValue={batchDeliveryNo}
          placeholder="一括NOで検索（部分一致）"
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-1 text-sm"
        >
          検索
        </button>
        <Link
          href="/deliveries"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
        >
          検索解除
        </Link>
      </form>
      {!deliveryNoteItems || deliveryNoteItems.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                {columns.map((col) => {
                  const label = COLUMN_LABELS[col] ?? col;
                  const isSortable = sortableColumns.includes(col);
                  const isCurrentSort = isSortable && sortBy === col;

                  if (!isSortable) {
                    return (
                      <th
                        key={col}
                        className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                      >
                        {label}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={col}
                      className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                    >
                      <a href={buildSortHref(col)} className="hover:underline">
                        {label}
                        {isCurrentSort
                          ? currentSortOrder === "asc"
                            ? " ▲"
                            : " ▼"
                          : ""}
                      </a>
                    </th>
                  );
                })}
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {deliveryNoteItems.map((item, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/deliveries/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.id}
                        </Link>
                      ) : col === "batch_delivery_no" ? (
                        (item.batch_delivery_no ?? "-")
                      ) : (
                        String(item[col] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={item.order_id}
                      initialNotes={item.order_notes}
                      onSave={updateOrderNotes}
                    />
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <DeleteConfirmDialog
                      id={item.id}
                      description={`納品明細（ID: ${item.id} / 受注No: ${item.order_code}）を削除します。この操作は取り消せません。`}
                      onDelete={deleteDeliveryNoteItem}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
