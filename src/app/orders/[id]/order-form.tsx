"use client";

import { useActionState } from "react";
import { createOrder, updateOrder, type OrderFormState } from "./actions";

type Company = {
  id: number;
  company_name: string;
};

type Order = {
  id: number;
  order_code: string;
  company_id: number;
  subject: string;
  drawing_number: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  order_date: string;
  desired_delivery_date: string | null;
  completion_date: string | null;
  notes: string | null;
  batch_invoice_id: number | null;
};

const initialState: OrderFormState = { error: null };

export function OrderForm({
  order,
  companies,
}: {
  order: Order | null;
  companies: Company[];
}) {
  const isEdit = !!order;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateOrder : createOrder,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      {isEdit && <input type="hidden" name="id" value={order.id} />}

      {isEdit && (
        <div className="space-y-1 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          <p>受注No: {order.order_code}</p>
          <p>受注日: {order.order_date}</p>
          <p>完了日: {order.completion_date ?? "-"}</p>
          <p>一括請求ID: {order.batch_invoice_id ?? "-"}</p>
        </div>
      )}

      <div>
        <label htmlFor="company_id" className="mb-1 block text-sm font-bold">
          顧客
        </label>
        <select
          id="company_id"
          name="company_id"
          required
          defaultValue={order?.company_id ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {!isEdit && (
            <option value="" disabled>
              選択してください
            </option>
          )}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-bold">
          件名
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          defaultValue={order?.subject ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="quantity" className="mb-1 block text-sm font-bold">
          数量
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          required
          defaultValue={order?.quantity ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="unit" className="mb-1 block text-sm font-bold">
          単位
        </label>
        <input
          id="unit"
          name="unit"
          type="text"
          required
          defaultValue={order?.unit ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="unit_price" className="mb-1 block text-sm font-bold">
          単価
        </label>
        <input
          id="unit_price"
          name="unit_price"
          type="number"
          required
          defaultValue={order?.unit_price ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="desired_delivery_date"
          className="mb-1 block text-sm font-bold"
        >
          希望納期
        </label>
        <input
          id="desired_delivery_date"
          name="desired_delivery_date"
          type="date"
          defaultValue={order?.desired_delivery_date ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="drawing_number"
          className="mb-1 block text-sm font-bold"
        >
          図番
        </label>
        <input
          id="drawing_number"
          name="drawing_number"
          type="text"
          defaultValue={order?.drawing_number ?? ""}
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
          defaultValue={order?.notes ?? ""}
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
