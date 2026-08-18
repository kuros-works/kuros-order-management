"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  updateDeliveryDetail,
  type UpdateDeliveryDetailState,
} from "./actions";

type DeliveryDetail = {
  id: number;
  order_id: number;
  delivered_quantity: number;
  delivery_note_code: string;
  delivery_date: string;
  order_code: string;
  subject: string;
  drawing_number: string | null;
  unit_price: number;
  company_name: string;
  order_notes: string | null;
};

const initialState: UpdateDeliveryDetailState = { error: null };

export function DeliveryDetailForm({
  deliveryItem,
}: {
  deliveryItem: DeliveryDetail;
}) {
  const [state, formAction, pending] = useActionState(
    updateDeliveryDetail,
    initialState,
  );
  const [deliveredQuantity, setDeliveredQuantity] = useState(
    String(deliveryItem.delivered_quantity),
  );
  const [notes, setNotes] = useState(deliveryItem.order_notes ?? "");

  const amount =
    deliveredQuantity && Number.isFinite(Number(deliveredQuantity))
      ? deliveryItem.unit_price * Number(deliveredQuantity)
      : 0;

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <input type="hidden" name="id" value={deliveryItem.id} />
      <input type="hidden" name="order_id" value={deliveryItem.order_id} />

      <div>
        <p className="mb-1 block text-sm font-bold">納品書ID</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.delivery_note_code}
        </div>
      </div>

      <div>
        <label
          htmlFor="delivered_quantity"
          className="mb-1 block text-sm font-bold"
        >
          納品数量
        </label>
        <input
          id="delivered_quantity"
          name="delivered_quantity"
          type="number"
          min="1"
          step="1"
          required
          value={deliveredQuantity}
          onChange={(e) => setDeliveredQuantity(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">受注No</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.order_code}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">件名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.subject}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">図番</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.drawing_number ?? "-"}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">単価</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.unit_price.toLocaleString("ja-JP")}円
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">会社名</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.company_name}
        </div>
      </div>

      <div>
        <p className="mb-1 block text-sm font-bold">納品日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {deliveryItem.delivery_date}
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
          この受注の備考として保存されます（orders.notesを更新します）
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
