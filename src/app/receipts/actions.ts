"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function toggleSentFlag(
  receiptId: number,
  nextSentFlag: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const today = new Date();
  const sentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error: updateError } = await supabase
    .from("receipts")
    .update({
      sent_flag: nextSentFlag,
      sent_date: nextSentFlag ? sentDate : null,
    })
    .eq("id", receiptId);

  if (updateError) {
    return {
      error: `receiptsの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/receipts");
  revalidatePath("/");
  return { error: null };
}

export async function updateReceiptNotes(
  receiptId: number,
  notes: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("receipts")
    .update({ notes: notes || null })
    .eq("id", receiptId);

  if (updateError) {
    return {
      error: `receiptsの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/receipts");
  return { error: null };
}

export async function confirmPayment(
  receiptId: number,
  receivedDate: string,
  receivedAmount: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, invoice_id")
    .eq("id", receiptId)
    .maybeSingle();

  if (receiptError) {
    return { error: `receiptsの取得に失敗しました: ${receiptError.message}` };
  }

  if (!receipt) {
    return { error: "対象の領収書が見つかりません" };
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, order_id, payment_status")
    .eq("id", receipt.invoice_id)
    .maybeSingle();

  if (invoiceError) {
    return { error: `invoicesの取得に失敗しました: ${invoiceError.message}` };
  }

  if (!invoice) {
    return { error: "対象の請求書が見つかりません" };
  }

  if (invoice.payment_status !== "未入金") {
    return { error: "この請求書はすでに入金済みです" };
  }

  const { error: receiptUpdateError } = await supabase
    .from("receipts")
    .update({ received_date: receivedDate, received_amount: receivedAmount })
    .eq("id", receiptId);

  if (receiptUpdateError) {
    return {
      error: `receiptsの更新に失敗しました: ${receiptUpdateError.message}`,
    };
  }

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({ payment_status: "入金済み" })
    .eq("id", invoice.id);

  if (invoiceUpdateError) {
    await supabase
      .from("receipts")
      .update({ received_date: null, received_amount: null })
      .eq("id", receiptId);
    return {
      error: `invoicesの更新に失敗しました: ${invoiceUpdateError.message}`,
    };
  }

  const today = new Date();
  const completionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ completion_date: completionDate })
    .eq("id", invoice.order_id);

  if (orderUpdateError) {
    await supabase
      .from("receipts")
      .update({ received_date: null, received_amount: null })
      .eq("id", receiptId);

    const { error: rollbackError } = await supabase
      .from("invoices")
      .update({ payment_status: "未入金" })
      .eq("id", invoice.id);

    if (rollbackError) {
      console.error(
        `invoices(id=${invoice.id})のpayment_statusロールバックに失敗しました: ${rollbackError.message}`,
      );
      return {
        error: `ordersのcompletion_date更新に失敗し、さらにinvoicesのpayment_statusを"未入金"に戻す処理にも失敗しました。手動でinvoice_id=${invoice.id}のpayment_statusを確認してください: ${orderUpdateError.message}`,
      };
    }

    return {
      error: `ordersのcompletion_date更新に失敗しました: ${orderUpdateError.message}`,
    };
  }

  revalidatePath("/receipts");
  revalidatePath("/invoices");
  revalidatePath("/");
  return { error: null };
}
