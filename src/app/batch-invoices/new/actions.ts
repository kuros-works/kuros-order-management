"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getOrdersWithRemainingQuantity } from "@/lib/backlog";

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

  const orderIds = formData
    .getAll("order_ids")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (orderIds.length === 0) {
    return { error: "対象受注を1件以上選択してください" };
  }

  const { data: backlog, error: backlogError } =
    await getOrdersWithRemainingQuantity(supabase);

  if (backlogError) {
    return { error: backlogError };
  }

  const orderIdSet = new Set(orderIds);
  const eligibleOrderIds = (backlog ?? [])
    .filter(
      (order) =>
        orderIdSet.has(order.id) &&
        order.company_id === companyId &&
        order.remaining_quantity === 0 &&
        order.batch_invoice_id === null,
    )
    .map((order) => order.id);

  if (eligibleOrderIds.length !== orderIds.length) {
    return {
      error:
        "選択された受注の中に、対象外（未完納・他の一括請求書に紐づけ済みなど）のものが含まれています",
    };
  }

  const { data: batchInvoice, error: insertError } = await supabase
    .from("batch_invoices")
    .insert({
      company_id: companyId,
      billing_month: billingMonth,
      issued_date: issuedDate,
    })
    .select("id")
    .single();

  if (insertError || !batchInvoice) {
    return {
      error: `batch_invoicesへの保存に失敗しました: ${insertError?.message}`,
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ batch_invoice_id: batchInvoice.id })
    .in("id", eligibleOrderIds);

  if (updateError) {
    await supabase.from("batch_invoices").delete().eq("id", batchInvoice.id);
    return {
      error: `ordersの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/batch-invoices");
  redirect("/batch-invoices");
}
