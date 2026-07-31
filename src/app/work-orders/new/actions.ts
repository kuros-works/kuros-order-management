"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type CreateWorkOrderState = {
  error: string | null;
};

export async function createWorkOrder(
  prevState: CreateWorkOrderState,
  formData: FormData,
): Promise<CreateWorkOrderState> {
  const supabase = await createClient();

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注を選択してください" };
  }

  const assignee = String(formData.get("assignee") ?? "").trim();
  if (!assignee) {
    return { error: "担当者を入力してください" };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { data: lastWorkOrder, error: lastWorkOrderError } = await supabase
    .from("work_orders")
    .select("work_order_code")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastWorkOrderError) {
    return {
      error: `work_order_codeの採番に失敗しました: ${lastWorkOrderError.message}`,
    };
  }

  const lastNumber = lastWorkOrder?.work_order_code
    ? Number(String(lastWorkOrder.work_order_code).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const workOrderCode = `WO-${String(nextNumber).padStart(4, "0")}`;

  const { error } = await supabase.from("work_orders").insert({
    order_id: orderId,
    assignee,
    notes,
    work_order_code: workOrderCode,
    issued_date: new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    }),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "この受注にはすでに製造指示書が存在します" };
    }
    return { error: `work_ordersへの保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  redirect("/");
}
