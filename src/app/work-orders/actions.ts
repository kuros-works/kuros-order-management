"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateWorkOrderNotes(
  workOrderId: number,
  notes: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("work_orders")
    .update({ notes: notes || null })
    .eq("id", workOrderId);

  if (updateError) {
    return {
      error: `work_ordersの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/work-orders");
  return { error: null };
}
