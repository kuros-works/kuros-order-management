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

export async function deleteDeliveryNoteItem(
  deliveryNoteItemId: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("delivery_note_items")
    .delete()
    .eq("id", deliveryNoteItemId);

  if (deleteError) {
    return {
      error: `delivery_note_itemsの削除に失敗しました: ${deleteError.message}`,
    };
  }

  revalidatePath("/deliveries");
  revalidatePath("/");
  return { error: null };
}
