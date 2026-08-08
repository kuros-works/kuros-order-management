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

  revalidatePath("/deliveries");
  revalidatePath("/");
  return { error: null };
}
