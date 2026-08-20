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

  revalidatePath("/work-orders");
  revalidatePath("/");
  return { error: null };
}

export async function deleteWorkOrder(
  workOrderId: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("work_orders")
    .delete()
    .eq("id", workOrderId);

  if (deleteError) {
    return {
      error: `work_ordersの削除に失敗しました: ${deleteError.message}`,
    };
  }

  revalidatePath("/work-orders");
  revalidatePath("/");
  return { error: null };
}
