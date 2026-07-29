"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type CreateBatchInvoiceState = {
  error: string | null;
};

export async function createBatchInvoice(
  prevState: CreateBatchInvoiceState,
  formData: FormData,
): Promise<CreateBatchInvoiceState> {
  const supabase = await createClient();

  const companyId = Number(formData.get("company_id"));
  if (!Number.isFinite(companyId)) {
    return { error: "会社を選択してください" };
  }

  const billingMonthInput = String(formData.get("billing_month") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(billingMonthInput)) {
    return { error: "請求月を入力してください" };
  }
  const billingMonth = `${billingMonthInput}-01`;

  const issuedDate = String(formData.get("issued_date") ?? "").trim();
  if (!issuedDate) {
    return { error: "発行日を入力してください" };
  }

  const { error: insertError } = await supabase.from("batch_invoices").insert({
    company_id: companyId,
    billing_month: billingMonth,
    issued_date: issuedDate,
  });

  if (insertError) {
    return {
      error: `batch_invoicesへの保存に失敗しました: ${insertError.message}`,
    };
  }

  revalidatePath("/batch-invoices");
  redirect("/batch-invoices");
}
