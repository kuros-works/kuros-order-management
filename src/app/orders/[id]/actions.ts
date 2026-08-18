"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type OrderFormState = {
  error: string | null;
};

export async function createOrder(
  prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const companyId = Number(formData.get("company_id"));
  if (!Number.isFinite(companyId)) {
    return { error: "顧客を選択してください" };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) {
    return { error: "件名を入力してください" };
  }

  const unit = String(formData.get("unit") ?? "").trim();
  if (!unit) {
    return { error: "単位を入力してください" };
  }

  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(quantity)) {
    return { error: "数量を入力してください" };
  }

  const unitPrice = Number(formData.get("unit_price"));
  if (!Number.isFinite(unitPrice)) {
    return { error: "単価を入力してください" };
  }

  const desiredDeliveryDate =
    String(formData.get("desired_delivery_date") ?? "").trim() || null;
  const drawingNumber =
    String(formData.get("drawing_number") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    company_id: companyId,
    subject,
    unit,
    quantity,
    unit_price: unitPrice,
    desired_delivery_date: desiredDeliveryDate,
    drawing_number: drawingNumber,
    notes,
    order_date: new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    }),
  });

  if (error) {
    return { error: `ordersへの保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateOrder(
  prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const orderId = Number(formData.get("id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注IDが不正です" };
  }

  const companyId = Number(formData.get("company_id"));
  if (!Number.isFinite(companyId)) {
    return { error: "顧客を選択してください" };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) {
    return { error: "件名を入力してください" };
  }

  const unit = String(formData.get("unit") ?? "").trim();
  if (!unit) {
    return { error: "単位を入力してください" };
  }

  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(quantity)) {
    return { error: "数量を入力してください" };
  }

  const unitPrice = Number(formData.get("unit_price"));
  if (!Number.isFinite(unitPrice)) {
    return { error: "単価を入力してください" };
  }

  const desiredDeliveryDate =
    String(formData.get("desired_delivery_date") ?? "").trim() || null;
  const drawingNumber =
    String(formData.get("drawing_number") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      company_id: companyId,
      subject,
      unit,
      quantity,
      unit_price: unitPrice,
      desired_delivery_date: desiredDeliveryDate,
      drawing_number: drawingNumber,
      notes,
    })
    .eq("id", orderId);

  if (error) {
    return { error: `ordersの更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/orders/${orderId}`);
  redirect("/");
}
