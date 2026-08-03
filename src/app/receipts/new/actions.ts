"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type CreateReceiptState = {
  error: string | null;
};

export async function createReceipt(
  prevState: CreateReceiptState,
  formData: FormData,
): Promise<CreateReceiptState> {
  const supabase = await createClient();

  const batchInvoiceId = Number(formData.get("batch_invoice_id"));
  if (!Number.isFinite(batchInvoiceId)) {
    return { error: "一括請求書を選択してください" };
  }

  const receivedDate = String(formData.get("received_date") ?? "").trim();
  if (!receivedDate) {
    return { error: "入金日を入力してください" };
  }

  const receivedAmount = Number(formData.get("received_amount"));
  if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
    return { error: "入金額を入力してください" };
  }

  const { data: batchInvoice, error: batchInvoiceError } = await supabase
    .from("batch_invoices")
    .select("id, company_id, payment_status")
    .eq("id", batchInvoiceId)
    .maybeSingle();

  if (batchInvoiceError) {
    return {
      error: `batch_invoicesの取得に失敗しました: ${batchInvoiceError.message}`,
    };
  }

  if (!batchInvoice) {
    return { error: "選択された一括請求書が見つかりません" };
  }

  if (batchInvoice.payment_status !== "未入金") {
    return { error: "この一括請求書はすでに入金済みです" };
  }

  const { data: receipt, error: insertError } = await supabase
    .from("receipts")
    .insert({
      batch_invoice_id: batchInvoiceId,
      company_id: batchInvoice.company_id,
      received_date: receivedDate,
      received_amount: receivedAmount,
    })
    .select("id")
    .single();

  if (insertError || !receipt) {
    return {
      error: `receiptsへの保存に失敗しました: ${insertError?.message}`,
    };
  }

  const { error: updateError } = await supabase
    .from("batch_invoices")
    .update({ payment_status: "入金済み" })
    .eq("id", batchInvoiceId);

  if (updateError) {
    await supabase.from("receipts").delete().eq("id", receipt.id);
    return {
      error: `batch_invoicesの更新に失敗しました: ${updateError.message}`,
    };
  }

  const today = new Date();
  const completionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error: ordersUpdateError } = await supabase
    .from("orders")
    .update({ completion_date: completionDate })
    .eq("batch_invoice_id", batchInvoiceId);

  if (ordersUpdateError) {
    await supabase.from("receipts").delete().eq("id", receipt.id);

    const { error: rollbackError } = await supabase
      .from("batch_invoices")
      .update({ payment_status: "未入金" })
      .eq("id", batchInvoiceId);

    if (rollbackError) {
      console.error(
        `batch_invoices(id=${batchInvoiceId})のpayment_statusロールバックに失敗しました: ${rollbackError.message}`,
      );
      return {
        error: `ordersのcompletion_date更新に失敗し、さらにbatch_invoicesのpayment_statusを"未入金"に戻す処理にも失敗しました。手動でbatch_invoice_id=${batchInvoiceId}のpayment_statusを確認してください: ${ordersUpdateError.message}`,
      };
    }

    return {
      error: `ordersのcompletion_date更新に失敗しました: ${ordersUpdateError.message}`,
    };
  }

  revalidatePath("/receipts");
  revalidatePath("/batch-invoices");
  redirect("/receipts");
}
