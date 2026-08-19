"use client";

import { useActionState } from "react";
import { createCompany, updateCompany, type CompanyFormState } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Company = {
  id: number;
  company_code: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  contact_name: string | null;
  email: string | null;
  payment_terms_days: string | null;
  invoice_registration_number: string | null;
  registered_date: string | null;
  company_name: string;
  notes: string | null;
};

const initialState: CompanyFormState = { error: null };

function todayInJst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function CompanyDetailForm({ company }: { company: Company | null }) {
  const isEdit = !!company;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateCompany : createCompany,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-4xl space-y-4">
      {state.error && (
        <p className="text-sm font-bold text-red-600">{state.error}</p>
      )}
      {isEdit && <input type="hidden" name="id" value={company.id} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="company_name"
                className="mb-1 block text-sm font-bold"
              >
                会社名
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                defaultValue={company?.company_name ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="company_code"
                className="mb-1 block text-sm font-bold"
              >
                会社コード
              </label>
              <input
                id="company_code"
                name="company_code"
                type="text"
                defaultValue={company?.company_code ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="registered_date"
                className="mb-1 block text-sm font-bold"
              >
                登録日
              </label>
              <input
                id="registered_date"
                name="registered_date"
                type="date"
                defaultValue={company?.registered_date ?? todayInJst()}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="postal_code"
                className="mb-1 block text-sm font-bold"
              >
                郵便番号
              </label>
              <input
                id="postal_code"
                name="postal_code"
                type="text"
                defaultValue={company?.postal_code ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-bold">
                住所
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue={company?.address ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-bold">
                電話番号
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                defaultValue={company?.phone ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="contact_name"
                className="mb-1 block text-sm font-bold"
              >
                担当者名
              </label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
                defaultValue={company?.contact_name ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={company?.email ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>取引条件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="payment_terms_days"
                className="mb-1 block text-sm font-bold"
              >
                支払いサイト
              </label>
              <input
                id="payment_terms_days"
                name="payment_terms_days"
                type="text"
                defaultValue={company?.payment_terms_days ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="invoice_registration_number"
                className="mb-1 block text-sm font-bold"
              >
                インボイス登録番号
              </label>
              <input
                id="invoice_registration_number"
                name="invoice_registration_number"
                type="text"
                defaultValue={company?.invoice_registration_number ?? ""}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
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
                defaultValue={company?.notes ?? ""}
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
  );
}
