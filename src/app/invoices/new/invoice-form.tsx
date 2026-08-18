"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createInvoice, type CreateInvoiceState } from "./actions";

type Order = {
  id: number;
  order_code: string;
  subject: string;
  company_id: number;
  company_name: string | null;
  unit_price: number;
  quantity: number;
  notes: string | null;
};

const initialState: CreateInvoiceState = { error: null };

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function InvoiceForm({ orders }: { orders: Order[] }) {
  const [state, formAction, pending] = useActionState(
    createInvoice,
    initialState,
  );
  const [selectedOrderId, setSelectedOrderId] = useState(
    orders[0] ? String(orders[0].id) : "",
  );
  const [notes, setNotes] = useState(orders[0]?.notes ?? "");

  const selectedOrder = orders.find(
    (order) => String(order.id) === selectedOrderId,
  );

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => String(o.id) === orderId);
    setNotes(order?.notes ?? "");
  };

  const amount = selectedOrder
    ? selectedOrder.unit_price * selectedOrder.quantity
    : 0;

  if (orders.length === 0) {
    return <p className="text-sm text-zinc-600">請求可能な受注がありません</p>;
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <div>
        <label htmlFor="order_id" className="mb-1 block text-sm font-bold">
          受注
        </label>
        <select
          id="order_id"
          name="order_id"
          required
          value={selectedOrderId}
          onChange={(e) => handleOrderChange(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.order_code} - {order.subject}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold">会社名</label>
        <input
          type="text"
          readOnly
          value={selectedOrder?.company_name ?? ""}
          className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold">単価</label>
        <input
          type="text"
          readOnly
          value={
            selectedOrder
              ? `${selectedOrder.unit_price.toLocaleString("ja-JP")}円`
              : ""
          }
          className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold">数量</label>
        <input
          type="text"
          readOnly
          value={selectedOrder?.quantity ?? ""}
          className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold">金額</label>
        <input
          type="text"
          readOnly
          value={`${amount.toLocaleString("ja-JP")}円`}
          className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
        />
      </div>
      <div>
        <label htmlFor="issued_date" className="mb-1 block text-sm font-bold">
          請求日
        </label>
        <input
          id="issued_date"
          name="issued_date"
          type="date"
          required
          defaultValue={todayJST()}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-bold">
          備考
        </label>
        <p className="mb-1 text-xs text-zinc-500">
          この受注の備考として保存されます（既存の備考は上書きされます）
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
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
