"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateOrderNotes } from "../actions";

export type UpdateReceiptNotesState = {
  error: string | null;
};

export async function updateReceiptNotes(
  prevState: UpdateReceiptNotesState,
  formData: FormData,
): Promise<UpdateReceiptNotesState> {
  const receiptId = Number(formData.get("id"));
  if (!Number.isFinite(receiptId)) {
    return { error: "領収書IDが不正です" };
  }

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注IDが不正です" };
  }

  const notes = String(formData.get("notes") ?? "").trim();

  if (notes) {
    const { error: orderNotesError } = await updateOrderNotes(orderId, notes);

    if (orderNotesError) {
      return { error: orderNotesError };
    }
  }

  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receiptId}`);
  redirect("/receipts");
}
