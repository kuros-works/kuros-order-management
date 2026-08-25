"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function redirectWithParams(
  base: {
    batchInvoiceNo: string;
  },
  extra: Record<string, string>,
): never {
  const params = new URLSearchParams({
    batch_invoice_no: base.batchInvoiceNo,
    ...extra,
  });
  redirect(`/receipts/create-batch?${params.toString()}`);
}

export async function createBatchReceipt(formData: FormData) {
  const batchInvoiceNo = String(formData.get("batch_invoice_no") ?? "").trim();
  const base = { batchInvoiceNo };

  if (!batchInvoiceNo) {
    redirectWithParams(base, {
      action_error: "一括請求書コードを入力してください",
    });
  }

  const selectedIds = formData
    .getAll("item_ids")
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id));

  if (selectedIds.length === 0) {
    redirectWithParams(base, {
      action_error: "一括領収書を作成する行を選択してください",
    });
  }

  const supabase = await createClient();

  const { data: rawItems, error: itemsError } = await supabase
    .from("receipts_with_order_info")
    .select("id, received_date")
    .eq("batch_invoice_no", batchInvoiceNo);

  if (itemsError) {
    redirectWithParams(base, {
      action_error: `対象データの取得に失敗しました: ${itemsError.message}`,
    });
  }

  const paidScopedIds = new Set(
    (rawItems ?? [])
      .filter((item) => item.received_date !== null)
      .map((item) => item.id as number),
  );

  const targetIds = selectedIds.filter((id) => paidScopedIds.has(id));

  if (targetIds.length === 0) {
    redirectWithParams(base, {
      action_error: "入金済みの行がありません",
    });
  }

  const { data: existingBatchRows, error: existingBatchError } =
    await supabase
      .from("receipts")
      .select("id, batch_receipt_no")
      .in("id", targetIds);

  if (existingBatchError) {
    redirectWithParams(base, {
      action_error: `確定状況の確認に失敗しました: ${existingBatchError.message}`,
    });
  }

  const unconfirmedIds = (existingBatchRows ?? [])
    .filter((row) => row.batch_receipt_no === null)
    .map((row) => row.id as number);

  if (unconfirmedIds.length === 0) {
    redirectWithParams(base, {
      action_error: "選択した行はすべて確定済みです",
    });
  }

  const { data: lastBatch, error: lastBatchError } = await supabase
    .from("receipts")
    .select("batch_receipt_no")
    .not("batch_receipt_no", "is", null)
    .order("batch_receipt_created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastBatchError) {
    redirectWithParams(base, {
      action_error: `batch_receipt_noの採番に失敗しました: ${lastBatchError.message}`,
    });
  }

  const lastNumber = lastBatch?.batch_receipt_no
    ? Number(String(lastBatch.batch_receipt_no).replace(/^\D+/, ""))
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  const batchReceiptNo = `BR-${String(nextNumber).padStart(4, "0")}`;

  const { error: updateError } = await supabase
    .from("receipts")
    .update({
      batch_receipt_no: batchReceiptNo,
      batch_receipt_created_at: new Date().toISOString(),
    })
    .in("id", unconfirmedIds);

  if (updateError) {
    redirectWithParams(base, {
      action_error: `receiptsの更新に失敗しました: ${updateError.message}`,
    });
  }

  revalidatePath("/receipts/create-batch");
  redirectWithParams(base, {
    confirmed_no: batchReceiptNo,
    confirmed_count: String(unconfirmedIds.length),
  });
}
