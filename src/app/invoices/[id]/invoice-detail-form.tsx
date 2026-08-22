"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  updateInvoiceNotes,
  type UpdateInvoiceNotesState,
} from "./actions";

type InvoiceDetail = {
  id: number;
  order_id: number;
  invoice_code: string;
  issued_date: string;
  payment_status: string;
  sent_status_label: string;
  sent_date: string | null;
  order_code: string;
  subject: string;
  drawing_number: string | null;
  unit_price: number;
  quantity: number;
  company_name: string;
  order_notes: string | null;
};

const initialState: UpdateInvoiceNotesState = { error: null };

export function InvoiceDetailForm({ invoice }: { invoice: InvoiceDetail }) {
  const [state, formAction, pending] = useActionState(
    updateInvoiceNotes,
    initialState,
  );
  const [notes, setNotes] = useState(invoice.order_notes ?? "");

  const amount = invoice.unit_price * invoice.quantity;

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <input type="hidden" name="id" value={invoice.id} />
      <input type="hidden" name="order_id" value={invoice.order_id} />

      <div>
        <p className="mb-1 block text-sm font-bold">請求書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.invoice_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">請求日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.issued_date}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">入金状況</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.payment_status}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">送付済み</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.sent_status_label}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">請求書送信日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.sent_date ?? "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">受注No</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.order_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">件名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.subject}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">図番</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.drawing_number ?? "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">単価</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.unit_price.toLocaleString("ja-JP")}円
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">数量</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.quantity}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">会社名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {invoice.company_name}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">金額</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {amount.toLocaleString("ja-JP")}円
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-bold">
          備考
        </label>
        <p className="mb-1 text-xs text-zinc-500">
          この受注の備考として保存されます（空欄のまま保存すると既存の備考は変更されません）
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
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
