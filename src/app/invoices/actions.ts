"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateOrderNotes(
  orderId: number,
  notes: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ notes: notes || null })
    .eq("id", orderId);

  if (updateError) {
    return {
      error: `ordersの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return { error: null };
}

export async function deleteInvoice(
  invoiceId: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { count: receiptCount, error: receiptCheckError } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);

  if (receiptCheckError) {
    return {
      error: `receiptsの確認に失敗しました: ${receiptCheckError.message}`,
    };
  }

  if (receiptCount && receiptCount > 0) {
    return {
      error: "関連するデータが残っているため削除できません",
    };
  }

  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId);

  if (deleteError) {
    return {
      error: `invoicesの削除に失敗しました: ${deleteError.message}`,
    };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return { error: null };
}
