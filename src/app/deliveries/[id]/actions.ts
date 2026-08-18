"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { updateOrderNotes } from "../actions";

export type UpdateDeliveryDetailState = {
  error: string | null;
};

export async function updateDeliveryDetail(
  prevState: UpdateDeliveryDetailState,
  formData: FormData,
): Promise<UpdateDeliveryDetailState> {
  const deliveryItemId = Number(formData.get("id"));
  if (!Number.isFinite(deliveryItemId)) {
    return { error: "納品明細IDが不正です" };
  }

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注IDが不正です" };
  }

  const deliveredQuantity = Number(formData.get("delivered_quantity"));
  if (!Number.isFinite(deliveredQuantity) || deliveredQuantity <= 0) {
    return { error: "納品数量を正しく入力してください" };
  }

  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();

  const { error: deliveryItemError } = await supabase
    .from("delivery_note_items")
    .update({ delivered_quantity: deliveredQuantity })
    .eq("id", deliveryItemId);

  if (deliveryItemError) {
    return {
      error: `delivery_note_itemsの更新に失敗しました: ${deliveryItemError.message}`,
    };
  }

  const { error: orderNotesError } = await updateOrderNotes(orderId, notes);

  if (orderNotesError) {
    return { error: orderNotesError };
  }

  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${deliveryItemId}`);
  redirect("/deliveries");
}
