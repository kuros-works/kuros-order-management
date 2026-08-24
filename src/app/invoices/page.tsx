import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { ListPageHeader } from "@/components/layout/list-page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { SentFlagToggle } from "./sent-flag-toggle";
import { updateOrderNotes, deleteInvoice } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  invoice_code: "請求書番号",
  issued_date: "請求日",
  payment_status: "入金状況",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  unit_price: "単価",
  quantity: "数量",
  amount: "金額",
  batch_invoice_no: "確定番号",
};

const OWN_TABLE_SORT_COLUMNS = ["id", "invoice_code", "issued_date"] as const;

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
  const batchInvoiceNo = getSingleParam(
    resolvedSearchParams,
    "batch_invoice_no",
  );
  const sortBy = getSingleParam(resolvedSearchParams, "sort_by");
  const sortOrder = getSingleParam(resolvedSearchParams, "sort_order");

  const supabase = await createClient();
  let invoiceQuery = supabase.from("invoices_with_order_info").select("*");

  if (subject) {
    invoiceQuery = invoiceQuery.ilike("subject", `%${subject}%`);
  }

  if (drawingNumber) {
    invoiceQuery = invoiceQuery.ilike("drawing_number", `%${drawingNumber}%`);
  }

  if (companyName) {
    invoiceQuery = invoiceQuery.ilike("company_name", `%${companyName}%`);
  }

  // invoices_with_order_info ビューは invoices.batch_invoice_no を持たないため、
  // 一括NO検索は invoices から該当IDを求めてから絞り込む。
  if (batchInvoiceNo) {
    const { data: batchMatchRows, error: batchMatchError } = await supabase
      .from("invoices")
      .select("id")
      .ilike("batch_invoice_no", `%${batchInvoiceNo}%`);

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
    invoiceQuery = invoiceQuery.in("id", batchMatchIds);
  }

  if (
    sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    invoiceQuery = invoiceQuery.order(sortBy, { ascending });
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

  // invoices_with_order_info ビューは invoices.batch_invoice_no を持たないため、
  // 確定番号表示に必要な分だけ invoices から補完取得する。
  const invoiceIds = (rawInvoices ?? []).map((invoice) => invoice.id as number);
  const batchInvoiceNoById = new Map<number, string | null>();

  if (invoiceIds.length > 0) {
    const { data: batchRows, error: batchError } = await supabase
      .from("invoices")
      .select("id, batch_invoice_no")
      .in("id", invoiceIds);

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
      batchInvoiceNoById.set(row.id, row.batch_invoice_no);
    }
  }

  const invoices = rawInvoices?.map((invoice) => {
    const { total_amount, ...rest } = invoice as typeof invoice & {
      total_amount: number | null;
    };
    return {
      ...rest,
      amount: total_amount,
      batch_invoice_no: batchInvoiceNoById.get(rest.id) ?? null,
    };
  });

  const columns =
    invoices && invoices.length > 0
      ? Object.keys(invoices[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "notes" &&
            col !== "order_id" &&
            col !== "order_notes" &&
            col !== "company_id" &&
            col !== "sent_flag" &&
            col !== "sent_date",
        )
      : [];

  const sortableColumns = ALLOWED_SORT_COLUMNS as readonly string[];
  const currentSortOrder = sortOrder === "desc" ? "desc" : "asc";

  function buildSortHref(col: string): string {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (drawingNumber) params.set("drawing_number", drawingNumber);
    if (companyName) params.set("company_name", companyName);
    if (batchInvoiceNo) params.set("batch_invoice_no", batchInvoiceNo);
    const nextSortOrder =
      sortBy === col && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sort_by", col);
    params.set("sort_order", nextSortOrder);
    return `/invoices?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">
            invoices 一覧（{invoices?.length ?? 0}件）
          </h1>
        }
        newHref="/invoices/new"
        extraHref="/invoices/create-batch"
        extraLabel="一括請求書を作成"
      />
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
        <label htmlFor="batch_invoice_no" className="text-sm">
          一括NO
        </label>
        <input
          type="text"
          id="batch_invoice_no"
          name="batch_invoice_no"
          defaultValue={batchInvoiceNo}
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
                  請求書送信状況
                </th>
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.id}
                        </Link>
                      ) : col === "batch_invoice_no" ? (
                        (invoice.batch_invoice_no ?? "-")
                      ) : (
                        String(invoice[col] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    <SentFlagToggle
                      invoiceId={invoice.id}
                      sentFlag={Boolean(invoice.sent_flag)}
                    />
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={invoice.order_id}
                      initialNotes={invoice.order_notes}
                      onSave={updateOrderNotes}
                    />
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <DeleteConfirmDialog
                      id={invoice.id}
                      description={`請求書 ${invoice.invoice_code}（ID: ${invoice.id}）を削除します。この操作は取り消せません。`}
                      onDelete={deleteInvoice}
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
