"use client";

import { useActionState } from "react";
import { createBatchInvoice, type CreateBatchInvoiceState } from "./actions";

type Company = {
  id: number;
  company_name: string | null;
};

const initialState: CreateBatchInvoiceState = { error: null };

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function BatchInvoiceForm({ companies }: { companies: Company[] }) {
  const [state, formAction, pending] = useActionState(
    createBatchInvoice,
    initialState,
  );

  if (companies.length === 0) {
    return <p className="text-sm text-zinc-600">会社が登録されていません</p>;
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <div>
        <label htmlFor="company_id" className="mb-1 block text-sm font-bold">
          会社
        </label>
        <select
          id="company_id"
          name="company_id"
          required
          defaultValue={companies[0]?.id}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="billing_month"
          className="mb-1 block text-sm font-bold"
        >
          請求月
        </label>
        <input
          id="billing_month"
          name="billing_month"
          type="month"
          required
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="issued_date" className="mb-1 block text-sm font-bold">
          発行日
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
