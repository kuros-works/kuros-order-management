"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createDelivery, type CreateDeliveryState } from "./actions";

type Order = {
  id: number;
  order_code: string;
  subject: string;
  unit_price: number;
  company_name: string | null;
};

const initialState: CreateDeliveryState = { error: null };

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function DeliveryForm({ orders }: { orders: Order[] }) {
  const [state, formAction, pending] = useActionState(
    createDelivery,
    initialState,
  );
  const [selectedOrderId, setSelectedOrderId] = useState(
    orders[0] ? String(orders[0].id) : "",
  );
  const [deliveredQuantity, setDeliveredQuantity] = useState("");

  const selectedOrder = orders.find(
    (order) => String(order.id) === selectedOrderId,
  );

  const amount =
    selectedOrder && deliveredQuantity
      ? selectedOrder.unit_price * Number(deliveredQuantity)
      : 0;

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
          onChange={(e) => setSelectedOrderId(e.target.value)}
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
        <label
          htmlFor="delivery_date"
          className="mb-1 block text-sm font-bold"
        >
          納品日
        </label>
        <input
          id="delivery_date"
          name="delivery_date"
          type="date"
          required
          defaultValue={todayJST()}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
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
        <p className="mt-1 text-sm text-zinc-600">
          今回の金額: {amount.toLocaleString("ja-JP")}円
        </p>
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
