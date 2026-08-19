import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { ListPageHeader } from "@/components/layout/list-page-header";
import { updateOrderNotes } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  work_order_code: "製造指示書No",
  assignee: "担当者",
  issued_date: "発行日",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  quantity: "数量",
  desired_delivery_date: "希望納期",
};

const WORK_ORDER_SORT_COLUMNS = [
  "id",
  "work_order_code",
  "issued_date",
  "desired_delivery_date",
  "subject",
  "drawing_number",
] as const;

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

export default async function WorkOrders({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const subject = getSingleParam(resolvedSearchParams, "subject");
  const drawingNumber = getSingleParam(resolvedSearchParams, "drawing_number");
  const sortBy = getSingleParam(resolvedSearchParams, "sort_by");
  const sortOrder = getSingleParam(resolvedSearchParams, "sort_order");

  const supabase = await createClient();
  let workOrdersQuery = supabase
    .from("work_orders_with_order_info")
    .select("*");

  if (subject) {
    workOrdersQuery = workOrdersQuery.ilike("subject", `%${subject}%`);
  }

  if (drawingNumber) {
    workOrdersQuery = workOrdersQuery.ilike(
      "drawing_number",
      `%${drawingNumber}%`,
    );
  }

  if (
    sortBy &&
    (WORK_ORDER_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    workOrdersQuery = workOrdersQuery.order(sortBy, { ascending });
  } else {
    workOrdersQuery = workOrdersQuery.order("id", { ascending: true });
  }

  const { data: rawWorkOrders, error } = await workOrdersQuery;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          work_ordersの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const workOrders = rawWorkOrders;

  const columns =
    workOrders && workOrders.length > 0
      ? Object.keys(workOrders[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "order_id" &&
            col !== "notes" &&
            col !== "order_notes",
        )
      : [];

  const sortableColumns = WORK_ORDER_SORT_COLUMNS as readonly string[];
  const currentSortOrder = sortOrder === "desc" ? "desc" : "asc";

  function buildSortHref(col: string): string {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (drawingNumber) params.set("drawing_number", drawingNumber);
    const nextSortOrder =
      sortBy === col && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sort_by", col);
    params.set("sort_order", nextSortOrder);
    return `/work-orders?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">
            製造指示書一覧（{workOrders?.length ?? 0}件）
          </h1>
        }
        newHref="/work-orders/new"
      />
      <form
        action="/work-orders"
        method="GET"
        className="mb-4 flex items-center gap-2"
      >
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
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-1 text-sm"
        >
          検索
        </button>
        <Link
          href="/work-orders"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
        >
          検索解除
        </Link>
      </form>
      {!workOrders || workOrders.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {workOrders.map((workOrder, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/work-orders/${workOrder.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {workOrder.id}
                        </Link>
                      ) : (
                        String(workOrder[col] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={workOrder.order_id}
                      initialNotes={workOrder.order_notes}
                      onSave={updateOrderNotes}
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
