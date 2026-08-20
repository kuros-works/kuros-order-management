"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function deleteOrder(
  orderId: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const [workOrderCheck, deliveryCheck, invoiceCheck] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
    supabase
      .from("delivery_note_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
  ]);

  if (workOrderCheck.error) {
    return {
      error: `work_ordersの確認に失敗しました: ${workOrderCheck.error.message}`,
    };
  }

  if (deliveryCheck.error) {
    return {
      error: `delivery_note_itemsの確認に失敗しました: ${deliveryCheck.error.message}`,
    };
  }

  if (invoiceCheck.error) {
    return {
      error: `invoicesの確認に失敗しました: ${invoiceCheck.error.message}`,
    };
  }

  const hasChildren =
    (workOrderCheck.count ?? 0) > 0 ||
    (deliveryCheck.count ?? 0) > 0 ||
    (invoiceCheck.count ?? 0) > 0;

  if (hasChildren) {
    return {
      error: "関連するデータが残っているため削除できません",
    };
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (deleteError) {
    return {
      error: `ordersの削除に失敗しました: ${deleteError.message}`,
    };
  }

  revalidatePath("/");
  return { error: null };
}
