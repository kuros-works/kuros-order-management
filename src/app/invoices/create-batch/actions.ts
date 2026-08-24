"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function redirectWithParams(
  base: {
    companyId: string;
    startDate: string;
    endDate: string;
  },
  extra: Record<string, string>,
): never {
  const params = new URLSearchParams({
    company_id: base.companyId,
    start_date: base.startDate,
    end_date: base.endDate,
    ...extra,
  });
  redirect(`/invoices/create-batch?${params.toString()}`);
}

export async function createBatchInvoice(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const base = { companyId, startDate, endDate };

  const companyIdNum = Number(companyId);
  if (!companyId || !Number.isFinite(companyIdNum)) {
    redirectWithParams(base, { action_error: "会社を選択してください" });
  }
  if (!startDate || !endDate) {
    redirectWithParams(base, { action_error: "開始日・終了日を入力してください" });
  }

  const supabase = await createClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, company_name")
    .eq("id", companyIdNum)
    .maybeSingle();

  if (companyError) {
    redirectWithParams(base, {
      action_error: `companiesの取得に失敗しました: ${companyError.message}`,
    });
  }
  if (!company || !company.company_name) {
    redirectWithParams(base, { action_error: "選択された会社が見つかりません" });
  }

  const { data: rawItems, error: itemsError } = await supabase
    .from("invoices_with_order_info")
    .select("id")
    .eq("company_name", company!.company_name)
    .gte("issued_date", startDate)
    .lte("issued_date", endDate);

  if (itemsError) {
    redirectWithParams(base, {
      action_error: `対象データの取得に失敗しました: ${itemsError.message}`,
    });
  }

  const targetIds = (rawItems ?? []).map((item) => item.id as number);

  if (targetIds.length === 0) {
    redirectWithParams(base, {
      action_error: "対象データが0件のため一括請求書を作成できません",
    });
  }

  const { data: existingBatchRows, error: existingBatchError } =
    await supabase
      .from("invoices")
      .select("id, batch_invoice_no")
      .in("id", targetIds);

  if (existingBatchError) {
    redirectWithParams(base, {
      action_error: `確定状況の確認に失敗しました: ${existingBatchError.message}`,
    });
  }

  const unconfirmedIds = (existingBatchRows ?? [])
    .filter((row) => row.batch_invoice_no === null)
    .map((row) => row.id as number);

  if (unconfirmedIds.length === 0) {
    redirectWithParams(base, {
      action_error: "対象となる未確定データがありません",
    });
  }

  const { data: lastBatch, error: lastBatchError } = await supabase
    .from("invoices")
    .select("batch_invoice_no")
    .not("batch_invoice_no", "is", null)
    .order("batch_invoice_created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastBatchError) {
    redirectWithParams(base, {
      action_error: `batch_invoice_noの採番に失敗しました: ${lastBatchError.message}`,
    });
  }

  const lastNumber = lastBatch?.batch_invoice_no
    ? Number(String(lastBatch.batch_invoice_no).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const batchInvoiceNo = `BI-${String(nextNumber).padStart(4, "0")}`;

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      batch_invoice_no: batchInvoiceNo,
      batch_invoice_created_at: new Date().toISOString(),
    })
    .in("id", unconfirmedIds);

  if (updateError) {
    redirectWithParams(base, {
      action_error: `invoicesの更新に失敗しました: ${updateError.message}`,
    });
  }

  revalidatePath("/invoices/create-batch");
  redirectWithParams(base, {
    confirmed_no: batchInvoiceNo,
    confirmed_count: String(unconfirmedIds.length),
  });
}
