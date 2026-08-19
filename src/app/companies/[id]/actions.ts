"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type CompanyFormState = {
  error: string | null;
};

function buildCompanyPayload(
  formData: FormData,
):
  | { ok: false; error: string }
  | { ok: true; payload: Record<string, string | null> } {
  const companyName = String(formData.get("company_name") ?? "").trim();
  if (!companyName) {
    return { ok: false, error: "会社名を入力してください" };
  }

  const companyCode =
    String(formData.get("company_code") ?? "").trim() || null;
  const postalCode = String(formData.get("postal_code") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const contactName =
    String(formData.get("contact_name") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const paymentTermsDays =
    String(formData.get("payment_terms_days") ?? "").trim() || null;
  const invoiceRegistrationNumber =
    String(formData.get("invoice_registration_number") ?? "").trim() || null;
  const registeredDate =
    String(formData.get("registered_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  return {
    ok: true,
    payload: {
      company_name: companyName,
      company_code: companyCode,
      postal_code: postalCode,
      address,
      phone,
      contact_name: contactName,
      email,
      payment_terms_days: paymentTermsDays,
      invoice_registration_number: invoiceRegistrationNumber,
      registered_date: registeredDate,
      notes,
    },
  };
}

export async function createCompany(
  prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const result = buildCompanyPayload(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("companies").insert(result.payload);

  if (error) {
    return { error: `companiesへの保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/companies");
  redirect("/companies");
}

export async function updateCompany(
  prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const companyId = Number(formData.get("id"));
  if (!Number.isFinite(companyId)) {
    return { error: "顧客IDが不正です" };
  }

  const result = buildCompanyPayload(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update(result.payload)
    .eq("id", companyId);

  if (error) {
    return { error: `companiesの更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  redirect("/companies");
}
