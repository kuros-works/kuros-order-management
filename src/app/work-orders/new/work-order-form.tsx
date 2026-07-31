"use client";

import { useActionState } from "react";
import { createWorkOrder, type CreateWorkOrderState } from "./actions";

type Order = {
  id: number;
  order_code: string;
  subject: string;
};

const initialState: CreateWorkOrderState = { error: null };

export function WorkOrderForm({ orders }: { orders: Order[] }) {
  const [state, formAction, pending] = useActionState(
    createWorkOrder,
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
        <label htmlFor="assignee" className="mb-1 block text-sm font-bold">
          担当者
        </label>
        <input
          id="assignee"
          name="assignee"
          type="text"
          required
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-bold">
          備考
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
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
