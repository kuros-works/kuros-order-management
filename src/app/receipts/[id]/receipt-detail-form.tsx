"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  updateReceiptNotes,
  type UpdateReceiptNotesState,
} from "./actions";

type ReceiptDetail = {
  id: number;
  order_id: number;
  receipt_code: string;
  created_date: string;
  received_date: string | null;
  received_amount: number | null;
  sent_status_label: string;
  invoice_code: string;
  issued_date: string;
  order_code: string;
  subject: string;
  drawing_number: string | null;
  unit_price: number;
  quantity: number;
  company_name: string;
  order_notes: string | null;
};

const initialState: UpdateReceiptNotesState = { error: null };

export function ReceiptDetailForm({ receipt }: { receipt: ReceiptDetail }) {
  const [state, formAction, pending] = useActionState(
    updateReceiptNotes,
    initialState,
  );
  const [notes, setNotes] = useState(receipt.order_notes ?? "");

  const amount = receipt.unit_price * receipt.quantity;

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <input type="hidden" name="id" value={receipt.id} />
      <input type="hidden" name="order_id" value={receipt.order_id} />

      <div>
        <p className="mb-1 block text-sm font-bold">領収書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.receipt_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">作成日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.created_date}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">請求書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.invoice_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">請求日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.issued_date}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">受注No</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.order_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">件名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.subject}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">図番</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.drawing_number ?? "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">数量</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.quantity}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">単価</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.unit_price.toLocaleString("ja-JP")}円
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">会社名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.company_name}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">金額</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {amount.toLocaleString("ja-JP")}円
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">入金日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.received_date ?? "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">入金額</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.received_amount != null
            ? `${receipt.received_amount.toLocaleString("ja-JP")}円`
            : "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">領収書送信状況</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.sent_status_label}
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
