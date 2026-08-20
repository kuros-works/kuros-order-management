"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function deleteCompany(
  companyId: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { count: orderCount, error: orderCheckError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (orderCheckError) {
    return {
      error: `ordersの確認に失敗しました: ${orderCheckError.message}`,
    };
  }

  if (orderCount && orderCount > 0) {
    return {
      error: "関連するデータが残っているため削除できません",
    };
  }

  const { error: deleteError } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (deleteError) {
    return {
      error: `companiesの削除に失敗しました: ${deleteError.message}`,
    };
  }

  revalidatePath("/companies");
  revalidatePath("/");
  return { error: null };
}
