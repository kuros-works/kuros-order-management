import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { updateOrderNotes } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  invoice_code: "請求書番号",
  issued_date: "請求日",
  payment_status: "入金状況",
  sent_flag: "送付済み",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  unit_price: "単価",
  quantity: "数量",
  amount: "金額",
};

const OWN_TABLE_SORT_COLUMNS = ["id", "issued_date"] as const;

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

export default async function Invoices({
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
  let invoiceQuery = supabase
    .from("invoices")
    .select(
      `*, orders${hasTextFilter ? "!inner" : ""}(order_code, subject, drawing_number, unit_price, quantity, notes), companies${hasTextFilter ? "!inner" : ""}(company_name)`,
    );

  if (subject) {
    invoiceQuery = invoiceQuery.ilike("orders.subject", `%${subject}%`);
  }

  if (drawingNumber) {
    invoiceQuery = invoiceQuery.ilike(
      "orders.drawing_number",
      `%${drawingNumber}%`,
    );
  }

  if (companyName) {
    invoiceQuery = invoiceQuery.ilike("companies.company_name", `%${companyName}%`);
  }

  if (
    sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    if ((ORDERS_TABLE_SORT_COLUMNS as readonly string[]).includes(sortBy)) {
      invoiceQuery = invoiceQuery.order(sortBy, {
        referencedTable: "orders",
        ascending,
      });
    } else if (sortBy === "company_name") {
      invoiceQuery = invoiceQuery.order("company_name", {
        referencedTable: "companies",
        ascending,
      });
    } else {
      invoiceQuery = invoiceQuery.order(sortBy, { ascending });
    }
  } else {
    invoiceQuery = invoiceQuery.order("id", { ascending: true });
  }

  const { data: rawInvoices, error } = await invoiceQuery;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          invoicesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  const invoices = rawInvoices?.map((invoice) => {
    const { order_id, company_id, orders, companies, ...rest } =
      invoice as typeof invoice & {
        order_id: number;
        company_id: unknown;
        orders: {
          order_code: string;
          subject: string;
          drawing_number: string | null;
          unit_price: number | null;
          quantity: number | null;
          notes: string | null;
        } | null;
        companies: { company_name: string } | null;
      };
    const unit_price = orders?.unit_price ?? null;
    const quantity = orders?.quantity ?? null;
    return {
      ...rest,
      order_id,
      order_code: orders?.order_code ?? order_id,
      subject: orders?.subject ?? null,
      drawing_number: orders?.drawing_number ?? null,
      company_name: companies?.company_name ?? company_id,
      unit_price,
      quantity,
      amount:
        unit_price !== null && quantity !== null
          ? unit_price * quantity
          : null,
      order_notes: orders?.notes ?? null,
    };
  });

  const columns =
    invoices && invoices.length > 0
      ? Object.keys(invoices[0]).filter(
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
    return `/invoices?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        invoices 一覧（{invoices?.length ?? 0}件）
      </h1>
      <form
        action="/invoices"
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
          href="/invoices"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
        >
          検索解除
        </Link>
      </form>
      {!invoices || invoices.length === 0 ? (
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
              {invoices.map((invoice, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(invoice[col] ?? "")}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={invoice.order_id}
                      initialNotes={invoice.order_notes}
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
