"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getOrdersWithRemainingQuantity } from "@/lib/backlog";
import { updateOrderNotes } from "../actions";

export type CreateInvoiceState = {
  error: string | null;
};

export async function createInvoice(
  prevState: CreateInvoiceState,
  formData: FormData,
): Promise<CreateInvoiceState> {
  const supabase = await createClient();

  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) {
    return { error: "受注を選択してください" };
  }

  const issuedDate = String(formData.get("issued_date") ?? "").trim();
  if (!issuedDate) {
    return { error: "請求日を入力してください" };
  }

  const notes = String(formData.get("notes") ?? "").trim();

  const { data: backlog, error: backlogError } =
    await getOrdersWithRemainingQuantity(supabase);

  if (backlogError) {
    return { error: backlogError };
  }

  const order = backlog?.find((o) => o.id === orderId);
  if (!order) {
    return { error: "選択された受注が見つかりません" };
  }

  if (order.remaining_quantity !== 0) {
    return { error: "分納途中の受注は請求できません" };
  }

  const { data: existingInvoice, error: existingInvoiceError } =
    await supabase
      .from("invoices")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

  if (existingInvoiceError) {
    return {
      error: `請求済みチェックに失敗しました: ${existingInvoiceError.message}`,
    };
  }

  if (existingInvoice) {
    return { error: "この受注はすでに請求済みです" };
  }

  const { data: lastInvoice, error: lastInvoiceError } = await supabase
    .from("invoices")
    .select("invoice_code")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastInvoiceError) {
    return {
      error: `invoice_codeの採番に失敗しました: ${lastInvoiceError.message}`,
    };
  }

  const lastNumber = lastInvoice?.invoice_code
    ? Number(String(lastInvoice.invoice_code).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const invoiceCode = `INV-${String(nextNumber).padStart(4, "0")}`;

  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      order_id: orderId,
      company_id: order.company_id,
      invoice_code: invoiceCode,
      issued_date: issuedDate,
    })
    .select("id")
    .single();

  if (insertError || !invoice) {
    if (insertError?.code === "23505") {
      return { error: "この受注はすでに請求済みです" };
    }
    return {
      error: `invoicesへの保存に失敗しました: ${insertError?.message}`,
    };
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

  revalidatePath("/invoices");
  redirect("/invoices");
}
