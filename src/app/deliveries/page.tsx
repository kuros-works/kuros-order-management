import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { updateOrderNotes } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  delivery_note_id: "納品書ID",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  delivered_quantity: "納品数量",
  unit_price: "単価",
  amount: "金額",
};

const OWN_TABLE_SORT_COLUMNS = ["id", "delivered_quantity"] as const;

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
  const subject = getSingleParam(resolvedSearchParams, "subject");
  const drawingNumber = getSingleParam(resolvedSearchParams, "drawing_number");
  const companyName = getSingleParam(resolvedSearchParams, "company_name");
  const sortBy = getSingleParam(resolvedSearchParams, "sort_by");
  const sortOrder = getSingleParam(resolvedSearchParams, "sort_order");

  const hasTextFilter = Boolean(subject || drawingNumber || companyName);

  const supabase = await createClient();
  let deliveryQuery = supabase
    .from("delivery_note_items")
    .select(
      `*, orders${hasTextFilter ? "!inner" : ""}(order_code, subject, drawing_number, unit_price, notes, companies${hasTextFilter ? "!inner" : ""}(company_name))`,
    );

  if (subject) {
    deliveryQuery = deliveryQuery.ilike("orders.subject", `%${subject}%`);
  }

  if (drawingNumber) {
    deliveryQuery = deliveryQuery.ilike(
      "orders.drawing_number",
      `%${drawingNumber}%`,
    );
  }

  if (companyName) {
    deliveryQuery = deliveryQuery.ilike(
      "orders.companies.company_name",
      `%${companyName}%`,
    );
  }

  if (
    sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    if ((ORDERS_TABLE_SORT_COLUMNS as readonly string[]).includes(sortBy)) {
      deliveryQuery = deliveryQuery.order(sortBy, {
        referencedTable: "orders",
        ascending,
      });
    } else if (sortBy === "company_name") {
      deliveryQuery = deliveryQuery.order("company_name", {
        referencedTable: "orders.companies",
        ascending,
      });
    } else {
      deliveryQuery = deliveryQuery.order(sortBy, { ascending });
    }
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

  const deliveryNoteItems = rawDeliveryNoteItems?.map((item) => {
    const { order_id, orders, ...rest } = item as typeof item & {
      order_id: number;
      orders: {
        order_code: string;
        subject: string;
        drawing_number: string | null;
        unit_price: number | null;
        notes: string | null;
        companies: { company_name: string } | null;
      } | null;
    };
    const unit_price = orders?.unit_price ?? null;
    const delivered_quantity = rest.delivered_quantity ?? null;
    return {
      ...rest,
      order_id,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      drawing_number: orders?.drawing_number ?? null,
      company_name: orders?.companies?.company_name ?? null,
      unit_price,
      amount:
        unit_price !== null && delivered_quantity !== null
          ? unit_price * delivered_quantity
          : null,
      order_notes: orders?.notes ?? null,
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
    if (subject) params.set("subject", subject);
    if (drawingNumber) params.set("drawing_number", drawingNumber);
    if (companyName) params.set("company_name", companyName);
    const nextSortOrder =
      sortBy === col && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sort_by", col);
    params.set("sort_order", nextSortOrder);
    return `/deliveries?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        delivery_note_items 一覧（{deliveryNoteItems?.length ?? 0}件）
      </h1>
      <form
        action="/deliveries"
        method="GET"
        className="mb-4 flex items-center gap-2"
      >
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
              </tr>
            </thead>
            <tbody>
              {deliveryNoteItems.map((item, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(item[col] ?? "")}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={item.order_id}
                      initialNotes={item.order_notes}
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
