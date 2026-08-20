import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { ListPageHeader } from "@/components/layout/list-page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { SentFlagToggle } from "./sent-flag-toggle";
import { PaymentConfirmForm } from "./payment-confirm-form";
import { updateOrderNotes, deleteReceipt } from "./actions";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  receipt_code: "領収書番号",
  created_date: "作成日",
  invoice_code: "請求書番号",
  issued_date: "請求日",
  order_code: "受注No",
  subject: "件名",
  drawing_number: "図番",
  company_name: "会社名",
  unit_price: "単価",
  quantity: "数量",
  amount: "金額",
};

const OWN_TABLE_SORT_COLUMNS = ["id", "receipt_code"] as const;

const INVOICES_TABLE_SORT_COLUMNS = ["invoice_code", "issued_date"] as const;

const ORDERS_TABLE_SORT_COLUMNS = [
  "order_code",
  "subject",
  "drawing_number",
] as const;

const ALLOWED_SORT_COLUMNS = [
  ...OWN_TABLE_SORT_COLUMNS,
  ...INVOICES_TABLE_SORT_COLUMNS,
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

export default async function Receipts({
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

  const supabase = await createClient();
  let receiptQuery = supabase.from("receipts_with_order_info").select("*");

  if (subject) {
    receiptQuery = receiptQuery.ilike("subject", `%${subject}%`);
  }

  if (drawingNumber) {
    receiptQuery = receiptQuery.ilike("drawing_number", `%${drawingNumber}%`);
  }

  if (companyName) {
    receiptQuery = receiptQuery.ilike("company_name", `%${companyName}%`);
  }

  if (
    sortBy &&
    (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy)
  ) {
    const ascending = sortOrder !== "desc";
    receiptQuery = receiptQuery.order(sortBy, { ascending });
  } else {
    receiptQuery = receiptQuery.order("id", { ascending: true });
  }

  const { data: rawReceipts, error } = await receiptQuery;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          receiptsの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {error.message}
        </pre>
      </div>
    );
  }

  // receipts_with_order_info ビューは orders.id / orders.notes を持たないため、
  // 備考インライン編集（orders.notes書き込み）に必要な分だけ orders から補完取得する。
  const orderCodes = Array.from(
    new Set(
      (rawReceipts ?? [])
        .map((receipt) => receipt.order_code)
        .filter((code): code is string => Boolean(code)),
    ),
  );

  const orderNotesByCode = new Map<
    string,
    { id: number; notes: string | null }
  >();

  if (orderCodes.length > 0) {
    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("id, order_code, notes")
      .in("order_code", orderCodes);

    if (orderError) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">
            ordersの取得に失敗しました
          </h1>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
            {orderError.message}
          </pre>
        </div>
      );
    }

    for (const order of orderRows ?? []) {
      orderNotesByCode.set(order.order_code, {
        id: order.id,
        notes: order.notes,
      });
    }
  }

  const receipts = rawReceipts?.map((receipt) => {
    const { total_amount, ...rest } = receipt as typeof receipt & {
      total_amount: number | null;
    };
    const orderInfo = rest.order_code
      ? orderNotesByCode.get(rest.order_code)
      : undefined;
    return {
      ...rest,
      amount: total_amount,
      suggested_amount: total_amount,
      order_id: orderInfo?.id ?? null,
      order_notes: orderInfo?.notes ?? null,
    };
  });

  const columns =
    receipts && receipts.length > 0
      ? Object.keys(receipts[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "invoice_id" &&
            col !== "sent_flag" &&
            col !== "sent_date" &&
            col !== "received_date" &&
            col !== "received_amount" &&
            col !== "suggested_amount" &&
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
    return `/receipts?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <ListPageHeader
        heading={
          <h1 className="text-xl font-bold">
            receipts 一覧（{receipts?.length ?? 0}件）
          </h1>
        }
      />
      <form
        action="/receipts"
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
          href="/receipts"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
        >
          検索解除
        </Link>
      </form>
      {!receipts || receipts.length === 0 ? (
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
                  入金
                </th>
                <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  領収書送信状況
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
              {receipts.map((receipt, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {col === "id" ? (
                        <Link
                          href={`/receipts/${receipt.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {receipt.id}
                        </Link>
                      ) : (
                        String(receipt[col] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="border border-zinc-300 px-3 py-2">
                    {receipt.received_date ? (
                      <span>
                        {receipt.received_date} /{" "}
                        {receipt.received_amount?.toLocaleString("ja-JP")}円
                      </span>
                    ) : (
                      <PaymentConfirmForm
                        receiptId={receipt.id}
                        defaultAmount={receipt.suggested_amount}
                      />
                    )}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <SentFlagToggle
                      receiptId={receipt.id}
                      sentFlag={Boolean(receipt.sent_flag)}
                    />
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <NotesInlineEditor
                      id={receipt.order_id}
                      initialNotes={receipt.order_notes}
                      onSave={updateOrderNotes}
                    />
                  </td>
                  <td className="border border-zinc-300 px-3 py-2">
                    <DeleteConfirmDialog
                      id={receipt.id}
                      description={`領収書 ${receipt.receipt_code}（ID: ${receipt.id}）を削除します。この操作は取り消せません。`}
                      onDelete={deleteReceipt}
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
