"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateOrderNotes } from "../actions";

export type UpdateInvoiceNotesState = {
  error: string | null;
};

export async function updateInvoiceNotes(
  prevState: UpdateInvoiceNotesState,
  formData: FormData,
): Promise<UpdateInvoiceNotesState> {
  const invoiceId = Number(formData.get("id"));
  if (!Number.isFinite(invoiceId)) {
    return { error: "請求書IDが不正です" };
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

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  redirect("/invoices");
}
