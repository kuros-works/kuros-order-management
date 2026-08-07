import { createClient } from "@/lib/supabase-server";
import { NotesInlineEditor } from "@/components/NotesInlineEditor";
import { SentFlagToggle } from "./sent-flag-toggle";
import { PaymentConfirmForm } from "./payment-confirm-form";
import { updateReceiptNotes } from "./actions";

export default async function Receipts() {
  const supabase = await createClient();
  const { data: rawReceipts, error } = await supabase
    .from("receipts")
    .select(
      "*, invoices(invoice_code, issued_date, orders(order_code, subject, unit_price, quantity, companies(company_name)))",
    );

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

  const receipts = rawReceipts?.map((receipt) => {
    const { invoice_id, invoices, received_date, received_amount, ...rest } =
      receipt as typeof receipt & {
        invoice_id: unknown;
        invoices: {
          invoice_code: string;
          issued_date: string;
          orders: {
            order_code: string;
            subject: string;
            unit_price: number | null;
            quantity: number | null;
            companies: { company_name: string } | null;
          } | null;
        } | null;
      };
    const orderInfo = invoices?.orders ?? null;
    const suggestedAmount =
      orderInfo?.unit_price !== null &&
      orderInfo?.unit_price !== undefined &&
      orderInfo?.quantity !== null &&
      orderInfo?.quantity !== undefined
        ? orderInfo.unit_price * orderInfo.quantity
        : null;
    return {
      ...rest,
      received_date,
      received_amount,
      invoice_code: invoices?.invoice_code ?? invoice_id,
      order_code: orderInfo?.order_code ?? null,
      subject: orderInfo?.subject ?? null,
      company_name: orderInfo?.companies?.company_name ?? null,
      unit_price: orderInfo?.unit_price ?? null,
      quantity: orderInfo?.quantity ?? null,
      amount: suggestedAmount,
      suggested_amount: suggestedAmount,
    };
  });

  const columns =
    receipts && receipts.length > 0
      ? Object.keys(receipts[0]).filter(
          (col) =>
            col !== "created_at" &&
            col !== "sent_flag" &&
            col !== "sent_date" &&
            col !== "received_date" &&
            col !== "received_amount" &&
            col !== "suggested_amount" &&
            col !== "notes",
        )
      : [];

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">
        receipts 一覧（{receipts?.length ?? 0}件）
      </h1>
      {!receipts || receipts.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left"
                  >
                    {col}
                  </th>
                ))}
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  入金
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  領収書送信状況
                </th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                  備考
                </th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-zinc-300 px-3 py-2">
                      {String(receipt[col] ?? "")}
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
                      id={receipt.id}
                      initialNotes={receipt.notes ?? null}
                      onSave={updateReceiptNotes}
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
