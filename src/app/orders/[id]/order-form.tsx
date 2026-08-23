"use client";

import { useActionState } from "react";
import { createOrder, updateOrder, type OrderFormState } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkOrderTabContent } from "./work-order-tab-content";
import { DeliveryTabContent } from "./delivery-tab-content";
import { InvoiceTabContent } from "./invoice-tab-content";
import { ReceiptTabContent } from "./receipt-tab-content";

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
  notes: string | null;
  assignee: string | null;
  total_amount: number;
  delivered_quantity: number;
  remaining_quantity: number;
  latest_delivery_date: string | null;
  aggregated_status: string;
  manufacturing_status: string;
  delivery_status: string;
  invoice_status: string;
  payment_status_label: string;
  sent_status_label: string;
  receipt_sent_status_label: string;
};

type WorkOrder = {
  id: number;
  work_order_code: string;
  assignee: string | null;
  issued_date: string;
};

type DeliveryNoteItem = {
  id: number;
  delivered_quantity: number;
  delivery_note_code: string;
  created_date: string;
};

type Invoice = {
  id: number;
  invoice_code: string;
  issued_date: string;
};

type Receipt = {
  id: number;
  receipt_code: string;
  created_date: string;
  sent_date: string | null;
  received_date: string | null;
  received_amount: number | null;
};

const initialState: OrderFormState = { error: null };

export function OrderForm({
  order,
  companies,
  workOrder = null,
  deliveryNoteItems = [],
  invoice = null,
  receipt = null,
}: {
  order: Order | null;
  companies: Company[];
  workOrder?: WorkOrder | null;
  deliveryNoteItems?: DeliveryNoteItem[];
  invoice?: Invoice | null;
  receipt?: Receipt | null;
}) {
  const isEdit = !!order;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateOrder : createOrder,
    initialState,
  );

  return (
    <>
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
              {isEdit && (
                <div>
                  <p className="mb-1 block text-sm font-bold">担当者</p>
                  <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.assignee ?? "-"}
                  </div>
                </div>
              )}
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
              {isEdit && (
                <div>
                  <p className="mb-1 block text-sm font-bold">合計金額</p>
                  <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.total_amount}
                  </div>
                </div>
              )}
              {isEdit && (
                <div>
                  <p className="mb-1 block text-sm font-bold">納品済数量</p>
                  <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.delivered_quantity}
                  </div>
                </div>
              )}
              {isEdit && (
                <div>
                  <p className="mb-1 block text-sm font-bold">残数量</p>
                  <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.remaining_quantity}
                  </div>
                </div>
              )}
              {isEdit && (
                <div>
                  <p className="mb-1 block text-sm font-bold">最終納品日</p>
                  <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.latest_delivery_date ?? "-"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>進捗</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEdit ? (
                <>
                  <div>
                    <p className="mb-1 block text-sm font-bold">進捗状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.aggregated_status}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">製造指示状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.manufacturing_status}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">納品状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.delivery_status}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">請求状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.invoice_status || "-"}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">入金状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.payment_status_label}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">請求書送信状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.sent_status_label}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 block text-sm font-bold">領収書送信状況</p>
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {order.receipt_sent_status_label}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">保存後に表示されます</p>
              )}
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

      {isEdit && (
        <div className="mt-6 max-w-4xl">
          <Tabs defaultValue="work-order">
            <TabsList>
              <TabsTrigger value="work-order">製造指示</TabsTrigger>
              <TabsTrigger value="delivery">納品</TabsTrigger>
              <TabsTrigger value="invoice">請求</TabsTrigger>
              <TabsTrigger value="receipt">領収書</TabsTrigger>
            </TabsList>
            <TabsContent value="work-order">
              <WorkOrderTabContent workOrder={workOrder} />
            </TabsContent>
            <TabsContent value="delivery">
              <DeliveryTabContent
                items={deliveryNoteItems}
                orderNotes={order?.notes ?? null}
              />
            </TabsContent>
            <TabsContent value="invoice">
              <InvoiceTabContent
                invoice={invoice}
                paymentStatusLabel={order.payment_status_label}
                sentStatusLabel={order.sent_status_label}
                orderNotes={order?.notes ?? null}
              />
            </TabsContent>
            <TabsContent value="receipt">
              <ReceiptTabContent
                receipt={receipt}
                hasInvoice={!!invoice}
                receiptSentStatusLabel={order.receipt_sent_status_label}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
