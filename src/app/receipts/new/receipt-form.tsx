"use client";

import { useActionState, useState } from "react";
import { createReceipt, type CreateReceiptState } from "./actions";

type BatchInvoice = {
  id: number;
  batch_invoice_code: string;
  company_name: string | null;
};

type Order = {
  id: number;
  batch_invoice_id: number | null;
  quantity: number;
  unit_price: number;
};

const initialState: CreateReceiptState = { error: null };

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function ReceiptForm({
  batchInvoices,
  orders,
}: {
  batchInvoices: BatchInvoice[];
  orders: Order[];
}) {
  const [state, formAction, pending] = useActionState(
    createReceipt,
    initialState,
  );

  const calcTotalAmount = (batchInvoiceId: string) =>
    orders
      .filter((order) => String(order.batch_invoice_id) === batchInvoiceId)
      .reduce((sum, order) => sum + order.unit_price * order.quantity, 0);

  const [selectedBatchInvoiceId, setSelectedBatchInvoiceId] = useState(
    batchInvoices[0] ? String(batchInvoices[0].id) : "",
  );
  const [receivedAmount, setReceivedAmount] = useState(() =>
    String(calcTotalAmount(selectedBatchInvoiceId)),
  );

  if (batchInvoices.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        未入金の一括請求書がありません
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <div>
        <label
          htmlFor="batch_invoice_id"
          className="mb-1 block text-sm font-bold"
        >
          一括請求書
        </label>
        <select
          id="batch_invoice_id"
          name="batch_invoice_id"
          required
          value={selectedBatchInvoiceId}
          onChange={(e) => {
            setSelectedBatchInvoiceId(e.target.value);
            setReceivedAmount(String(calcTotalAmount(e.target.value)));
          }}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {batchInvoices.map((batchInvoice) => (
            <option key={batchInvoice.id} value={batchInvoice.id}>
              {batchInvoice.company_name} - {batchInvoice.batch_invoice_code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="received_date"
          className="mb-1 block text-sm font-bold"
        >
          入金日
        </label>
        <input
          id="received_date"
          name="received_date"
          type="date"
          required
          defaultValue={todayJST()}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="received_amount"
          className="mb-1 block text-sm font-bold"
        >
          入金額
        </label>
        <input
          id="received_amount"
          name="received_amount"
          type="number"
          min="1"
          step="1"
          required
          value={receivedAmount}
          onChange={(e) => setReceivedAmount(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        保存
      </button>
    </form>
  );
}
