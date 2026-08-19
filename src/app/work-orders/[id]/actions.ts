"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { updateOrderNotes } from "@/app/invoices/actions";

export type WorkOrderFormState = {
  error: string | null;
};

export async function createWorkOrder(
  prevState: WorkOrderFormState,
  formData: FormData,
): Promise<WorkOrderFormState> {
  const supabase = await createClient();

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注を選択してください" };
  }

  const assignee = String(formData.get("assignee") ?? "").trim();
  if (!assignee) {
    return { error: "担当者を入力してください" };
  }

  const notes = String(formData.get("notes") ?? "").trim();

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

  if (notes) {
    const { error: orderNotesError } = await updateOrderNotes(
      orderId,
      notes,
    );

    if (orderNotesError) {
      return { error: orderNotesError };
    }
  }

  revalidatePath("/");
  revalidatePath("/work-orders");
  redirect("/work-orders");
}

export async function updateWorkOrder(
  prevState: WorkOrderFormState,
  formData: FormData,
): Promise<WorkOrderFormState> {
  const workOrderId = Number(formData.get("id"));
  if (!Number.isFinite(workOrderId)) {
    return { error: "製造指示書IDが不正です" };
  }

  const assignee = String(formData.get("assignee") ?? "").trim();
  if (!assignee) {
    return { error: "担当者を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_orders")
    .update({ assignee })
    .eq("id", workOrderId);

  if (error) {
    return { error: `work_ordersの更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${workOrderId}`);
  redirect("/work-orders");
}
