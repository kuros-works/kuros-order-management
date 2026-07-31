"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createBatchInvoice, type CreateBatchInvoiceState } from "./actions";

type Company = {
  id: number;
  company_name: string | null;
};

type Order = {
  id: number;
  order_code: string;
  subject: string;
  company_id: number;
  unit_price: number;
  quantity: number;
};

const initialState: CreateBatchInvoiceState = { error: null };

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function BatchInvoiceForm({
  companies,
  orders,
}: {
  companies: Company[];
  orders: Order[];
}) {
  const [state, formAction, pending] = useActionState(
    createBatchInvoice,
    initialState,
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    companies[0] ? String(companies[0].id) : "",
  );

  const ordersForCompany = useMemo(
    () =>
      orders.filter((order) => String(order.company_id) === selectedCompanyId),
    [orders, selectedCompanyId],
  );

  const [checkedOrderIds, setCheckedOrderIds] = useState<Set<number>>(
    () => new Set(ordersForCompany.map((order) => order.id)),
  );
  const [checkedForCompanyId, setCheckedForCompanyId] = useState(
    selectedCompanyId,
  );

  if (checkedForCompanyId !== selectedCompanyId) {
    setCheckedForCompanyId(selectedCompanyId);
    setCheckedOrderIds(new Set(ordersForCompany.map((order) => order.id)));
  }

  const totalAmount = ordersForCompany
    .filter((order) => checkedOrderIds.has(order.id))
    .reduce((sum, order) => sum + order.unit_price * order.quantity, 0);

  if (companies.length === 0) {
    return <p className="text-sm text-zinc-600">会社が登録されていません</p>;
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      <div className="max-w-md">
        <label htmlFor="company_id" className="mb-1 block text-sm font-bold">
          会社
        </label>
        <select
          id="company_id"
          name="company_id"
          required
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>
      <div className="max-w-md">
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
      <div className="max-w-md">
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
      <div>
        <p className="mb-1 block text-sm font-bold">対象受注</p>
        {ordersForCompany.length === 0 ? (
          <p className="text-sm text-zinc-600">
            この会社に紐づけ可能な受注（完納済み・未請求）がありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-zinc-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left" />
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    受注コード
                  </th>
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    件名
                  </th>
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    数量
                  </th>
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    単価
                  </th>
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                    金額
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordersForCompany.map((order) => (
                  <tr key={order.id}>
                    <td className="border border-zinc-300 px-3 py-2">
                      <input
                        type="checkbox"
                        name="order_ids"
                        value={order.id}
                        checked={checkedOrderIds.has(order.id)}
                        onChange={(e) => {
                          setCheckedOrderIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(order.id);
                            } else {
                              next.delete(order.id);
                            }
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {order.order_code}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {order.subject}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {order.quantity}
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {order.unit_price.toLocaleString("ja-JP")}円
                    </td>
                    <td className="border border-zinc-300 px-3 py-2">
                      {(order.unit_price * order.quantity).toLocaleString(
                        "ja-JP",
                      )}
                      円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm font-bold">
              合計: {totalAmount.toLocaleString("ja-JP")}円
            </p>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={pending || checkedOrderIds.size === 0}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        保存
      </button>
    </form>
  );
}
