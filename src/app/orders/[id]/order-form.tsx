"use client";

import { useActionState } from "react";
import { createOrder, updateOrder, type OrderFormState } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <form action={formAction} className="max-w-4xl space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      {isEdit && <input type="hidden" name="id" value={order.id} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEdit && (
              <div>
                <p className="mb-1 block text-sm font-bold">受注No</p>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  {order.order_code}
                </div>
              </div>
            )}
            <div>
              <label
                htmlFor="company_id"
                className="mb-1 block text-sm font-bold"
              >
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
            {isEdit && (
              <div>
                <p className="mb-1 block text-sm font-bold">受注日</p>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  {order.order_date}
                </div>
              </div>
            )}
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
            {isEdit && (
              <div>
                <p className="mb-1 block text-sm font-bold">完了日</p>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  {order.completion_date ?? "-"}
                </div>
              </div>
            )}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数量・金額</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <label
                htmlFor="unit_price"
                className="mb-1 block text-sm font-bold"
              >
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">準備中（次回対応）</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            {isEdit && (
              <div>
                <p className="mb-1 block text-sm font-bold">一括請求ID</p>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  {order.batch_invoice_id ?? "-"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
