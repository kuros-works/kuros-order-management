"use client";

import { useActionState } from "react";
import {
  createWorkOrder,
  updateWorkOrder,
  type WorkOrderFormState,
} from "./actions";

type Order = {
  id: number;
  order_code: string;
  subject: string;
};

type WorkOrder = {
  id: number;
  work_order_code: string;
  assignee: string | null;
  issued_date: string;
  order_code: string;
  subject: string;
  drawing_number: string | null;
  quantity: number | null;
  desired_delivery_date: string | null;
  company_name: string;
  order_notes: string | null;
};

const initialState: WorkOrderFormState = { error: null };

export function WorkOrderForm({
  workOrder,
  orders,
}: {
  workOrder: WorkOrder | null;
  orders: Order[];
}) {
  const isEdit = !!workOrder;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateWorkOrder : createWorkOrder,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      {isEdit && <input type="hidden" name="id" value={workOrder.id} />}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">製造指示書No</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.work_order_code}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="assignee" className="mb-1 block text-sm font-bold">
          担当者
        </label>
        <input
          id="assignee"
          name="assignee"
          type="text"
          required
          defaultValue={workOrder?.assignee ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">発行日</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.issued_date}
          </div>
        </div>
      )}

      {isEdit ? (
        <div>
          <p className="mb-1 block text-sm font-bold">受注No</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.order_code}
          </div>
        </div>
      ) : (
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
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">件名</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.subject}
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">図番</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.drawing_number ?? "-"}
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">数量</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.quantity}
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">希望納期</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.desired_delivery_date ?? "-"}
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">会社名</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.company_name}
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <p className="mb-1 block text-sm font-bold">備考</p>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            {workOrder.order_notes ?? "-"}
          </div>
        </div>
      )}

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
