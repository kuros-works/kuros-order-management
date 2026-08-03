"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function toggleSentFlag(
  receiptId: number,
  nextSentFlag: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const today = new Date();
  const sentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error: updateError } = await supabase
    .from("receipts")
    .update({
      sent_flag: nextSentFlag,
      sent_date: nextSentFlag ? sentDate : null,
    })
    .eq("id", receiptId);

  if (updateError) {
    return {
      error: `receiptsの更新に失敗しました: ${updateError.message}`,
    };
  }

  revalidatePath("/receipts");
  revalidatePath("/");
  return { error: null };
}
