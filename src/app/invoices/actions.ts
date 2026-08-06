"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateInvoiceNotes(
  invoiceId: number,
  notes: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ notes: notes || null })
    .eq("id", invoiceId);

  if (updateError) {
    return {
      error: `invoicesの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/invoices");
  return { error: null };
}
