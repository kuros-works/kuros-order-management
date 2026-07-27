"use client";

import { useActionState } from "react";
import { createDelivery, type CreateDeliveryState } from "./actions";

type Order = {
  id: number;
  order_code: string;
  subject: string;
};

const initialState: CreateDeliveryState = { error: null };

export function DeliveryForm({ orders }: { orders: Order[] }) {
  const [state, formAction, pending] = useActionState(
    createDelivery,
    initialState,
  );

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
