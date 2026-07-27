"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type CreateDeliveryState = {
  error: string | null;
};

export async function createDelivery(
  prevState: CreateDeliveryState,
  formData: FormData,
): Promise<CreateDeliveryState> {
  const supabase = await createClient();

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注を選択してください" };
  }

  const deliveredQuantity = Number(formData.get("delivered_quantity"));
  if (!Number.isFinite(deliveredQuantity) || deliveredQuantity <= 0) {
    return { error: "納品数量を正しく入力してください" };
  }

  const deliveryDate = String(formData.get("delivery_date") ?? "").trim();
  if (!deliveryDate) {
    return { error: "納品日を入力してください" };
  }

  const { data: lastDeliveryNote, error: lastDeliveryNoteError } =
    await supabase
      .from("delivery_notes")
      .select("delivery_note_code")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (lastDeliveryNoteError) {
    return {
      error: `delivery_note_codeの採番に失敗しました: ${lastDeliveryNoteError.message}`,
    };
  }

  const lastNumber = lastDeliveryNote?.delivery_note_code
    ? Number(String(lastDeliveryNote.delivery_note_code).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const deliveryNoteCode = `DN-${String(nextNumber).padStart(4, "0")}`;

  const { data: deliveryNote, error: deliveryNoteError } = await supabase
    .from("delivery_notes")
    .insert({
      delivery_note_code: deliveryNoteCode,
      created_date: deliveryDate,
    })
    .select("id")
    .single();

  if (deliveryNoteError || !deliveryNote) {
    return {
      error: `delivery_notesへの保存に失敗しました: ${deliveryNoteError?.message}`,
    };
  }

  const { error: deliveryNoteItemError } = await supabase
    .from("delivery_note_items")
    .insert({
      delivery_note_id: deliveryNote.id,
      order_id: orderId,
      delivered_quantity: deliveredQuantity,
    });

  if (deliveryNoteItemError) {
    const { error: rollbackError } = await supabase
      .from("delivery_notes")
      .delete()
      .eq("id", deliveryNote.id);

    if (rollbackError) {
      return {
        error: `delivery_note_itemsへの保存に失敗し、delivery_notesのロールバックにも失敗しました: ${deliveryNoteItemError.message} / ${rollbackError.message}`,
      };
    }

    return {
      error: `delivery_note_itemsへの保存に失敗しました: ${deliveryNoteItemError.message}`,
    };
  }

  revalidatePath("/deliveries");
  redirect("/deliveries");
}
