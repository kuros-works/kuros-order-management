import { createClient } from "@/lib/supabase-server";
import { createBatchReceipt } from "./actions";
import { PrintDocument } from "@/components/print/PrintDocument";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

async function ReceiptPrintView({
  batchInvoiceNo,
  batchReceiptNo,
  confirmedCount,
}: {
  batchInvoiceNo: string;
  batchReceiptNo: string;
  confirmedCount: string | null;
}) {
  const supabase = await createClient();

  const closeHref = `/receipts/create-batch?${new URLSearchParams({
    batch_invoice_no: batchInvoiceNo,
  }).toString()}`;

  const [
    { data: issuerRow, error: issuerError },
    { data: receiptRows, error: receiptsError },
  ] = await Promise.all([
    supabase
      .from("company_settings")
      .select(
        "company_name, contact_person, postal_code, address, phone, email, invoice_registration_number, bank_name, branch_name, account_type, account_number, account_holder",
      )
      .maybeSingle(),
    supabase
      .from("receipts")
      .select(
        "id, received_amount, batch_receipt_created_at, invoices(order_id, orders(subject, unit, unit_price, quantity, company_id, companies(id, company_name, contact_name, address, postal_code)))",
      )
      .eq("batch_receipt_no", batchReceiptNo)
      .order("id", { ascending: true }),
  ]);

  const loadError = issuerError || receiptsError;
  if (loadError || !issuerRow) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          印刷データの取得に失敗しました
        </h1>
        {loadError && (
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
            {loadError.message}
          </pre>
        )}
        <a href={closeHref} className="mt-4 inline-block text-sm underline">
          一覧に戻る
        </a>
      </div>
    );
  }

  type CompanyRef = {
    id: number;
    company_name: string;
    contact_name: string | null;
    address: string | null;
    postal_code: string | null;
  };
  type OrderRef = {
    subject: string | null;
    unit: string | null;
    unit_price: number | null;
    quantity: number | null;
    company_id: number | null;
    companies: CompanyRef[] | CompanyRef | null;
  };
  type InvoiceRef = {
    order_id: number | null;
    orders: OrderRef[] | OrderRef | null;
  };
  type ReceiptRow = {
    id: number;
    received_amount: number | null;
    batch_receipt_created_at: string | null;
    invoices: InvoiceRef[] | InvoiceRef | null;
  };

  const rows = (receiptRows ?? []) as unknown as ReceiptRow[];

  function resolveOrder(row: ReceiptRow): OrderRef | null {
    const invoiceInfo = Array.isArray(row.invoices)
      ? row.invoices[0]
      : row.invoices;
    if (!invoiceInfo) return null;
    return Array.isArray(invoiceInfo.orders)
      ? (invoiceInfo.orders[0] ?? null)
      : invoiceInfo.orders;
  }

  const lineItems = rows.map((row) => {
    const order = resolveOrder(row);
    return {
      description: order?.subject ?? "-",
      quantity: order?.quantity ?? 0,
      unit: order?.unit ?? "",
      unitPrice: order?.unit_price ?? 0,
      amount: row.received_amount ?? 0,
    };
  });

  const firstOrder = rows.length > 0 ? resolveOrder(rows[0]) : null;
  const companyRef = firstOrder
    ? Array.isArray(firstOrder.companies)
      ? (firstOrder.companies[0] ?? null)
      : firstOrder.companies
    : null;

  if (!companyRef) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          会社情報の取得に失敗しました
        </h1>
        <a href={closeHref} className="mt-4 inline-block text-sm underline">
          一覧に戻る
        </a>
      </div>
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const firstCreatedAt = rows
    .map((row) => row.batch_receipt_created_at)
    .filter((value): value is string => !!value)
    .sort()[0];
  const documentDate = firstCreatedAt ? firstCreatedAt.slice(0, 10) : "";

  const companyAddress = companyRef.postal_code
    ? `〒${companyRef.postal_code} ${companyRef.address ?? ""}`
    : companyRef.address;

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        {confirmedCount ? (
          <p className="text-sm font-bold text-green-700">
            {batchReceiptNo}として{confirmedCount}件を確定しました
          </p>
        ) : (
          <p className="text-sm font-bold text-zinc-700">
            {batchReceiptNo} の印刷プレビュー
          </p>
        )}
        <a
          href={closeHref}
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
        >
          閉じる
        </a>
      </div>
      <PrintDocument
        documentType="receipt"
        documentNumber={batchReceiptNo}
        documentDate={documentDate}
        companyName={companyRef.company_name}
        contactName={companyRef.contact_name}
        companyAddress={companyAddress}
        issuer={{
          companyName: issuerRow.company_name,
          contactPerson: issuerRow.contact_person,
          postalCode: issuerRow.postal_code,
          address: issuerRow.address,
          phone: issuerRow.phone,
          email: issuerRow.email,
          invoiceRegistrationNumber: issuerRow.invoice_registration_number,
          bankName: issuerRow.bank_name,
          branchName: issuerRow.branch_name,
          accountType: issuerRow.account_type,
          accountNumber: issuerRow.account_number,
          accountHolder: issuerRow.account_holder,
        }}
        lineItems={lineItems}
        subtotal={subtotal}
        tax={tax}
        total={total}
        showPaymentInfo={false}
        notes={null}
      />
    </div>
  );
}

export default async function CreateBatchReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const batchInvoiceNo = getSingleParam(resolvedSearchParams, "batch_invoice_no");
  const actionError = getSingleParam(resolvedSearchParams, "action_error");
  const confirmedNo = getSingleParam(resolvedSearchParams, "confirmed_no");
  const confirmedCount = getSingleParam(resolvedSearchParams, "confirmed_count");
  const viewBatchNo = getSingleParam(resolvedSearchParams, "view_batch_no");

  if (confirmedNo && confirmedCount) {
    return (
      <ReceiptPrintView
        batchInvoiceNo={batchInvoiceNo}
        batchReceiptNo={confirmedNo}
        confirmedCount={confirmedCount}
      />
    );
  }

  if (viewBatchNo) {
    return (
      <ReceiptPrintView
        batchInvoiceNo={batchInvoiceNo}
        batchReceiptNo={viewBatchNo}
        confirmedCount={null}
      />
    );
  }

  const supabase = await createClient();

  const hasSearchCondition = !!batchInvoiceNo;

  let receiptItems:
    | {
        id: number;
        receipt_code: string;
        created_date: string | null;
        invoice_code: string;
        order_code: string | null;
        subject: string | null;
        quantity: number | null;
        unit_price: number | null;
        total_amount: number | null;
        company_name: string | null;
        received_date: string | null;
        received_amount: number | null;
        batch_receipt_no: string | null;
      }[]
    | null = null;
  let unpaidCount = 0;
  let searchError: string | null = null;

  if (hasSearchCondition) {
    const { data: rawItems, error } = await supabase
      .from("receipts_with_order_info")
      .select("*")
      .eq("batch_invoice_no", batchInvoiceNo)
      .order("id", { ascending: true });

    if (error) {
      searchError = `領収データの取得に失敗しました: ${error.message}`;
    } else {
      const eligibleItems = (rawItems ?? []).filter(
        (item) => item.received_date !== null,
      );
      unpaidCount = (rawItems ?? []).length - eligibleItems.length;

      const itemIds = eligibleItems.map((item) => item.id as number);
      const batchReceiptNoById = new Map<number, string | null>();
      if (itemIds.length > 0) {
        const { data: batchRows, error: batchRowsError } = await supabase
          .from("receipts")
          .select("id, batch_receipt_no")
          .in("id", itemIds);

        if (batchRowsError) {
          searchError = `確定番号の取得に失敗しました: ${batchRowsError.message}`;
        } else {
          for (const row of batchRows ?? []) {
            batchReceiptNoById.set(row.id, row.batch_receipt_no);
          }
        }
      }

      if (!searchError) {
        receiptItems = eligibleItems.map((item) => ({
          id: item.id,
          receipt_code: item.receipt_code,
          created_date: item.created_date,
          invoice_code: item.invoice_code,
          order_code: item.order_code,
          subject: item.subject,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          company_name: item.company_name,
          received_date: item.received_date,
          received_amount: item.received_amount,
          batch_receipt_no: batchReceiptNoById.get(item.id) ?? null,
        }));
      }
    }
  }

  const totalQuantity =
    receiptItems?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
  const totalAmount =
    receiptItems?.reduce((sum, item) => sum + (item.total_amount ?? 0), 0) ??
    0;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">一括領収書の抽出プレビュー</h1>
      <form
        action="/receipts/create-batch"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label
            htmlFor="batch_invoice_no"
            className="mb-1 block text-sm font-bold"
          >
            一括請求NO
          </label>
          <input
            id="batch_invoice_no"
            name="batch_invoice_no"
            type="text"
            required
            defaultValue={batchInvoiceNo}
            placeholder="例: BI-0001"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
        >
          検索
        </button>
      </form>

      {actionError && (
        <p className="mb-4 text-sm font-bold text-red-600">{actionError}</p>
      )}

      {searchError && (
        <p className="text-sm font-bold text-red-600">{searchError}</p>
      )}

      {hasSearchCondition && !searchError && unpaidCount > 0 && (
        <p className="mb-4 text-sm font-bold text-amber-700">
          {unpaidCount}件が未入金のため対象外です
        </p>
      )}

      {hasSearchCondition &&
        !searchError &&
        (receiptItems && receiptItems.length > 0 ? (
          <>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse border border-zinc-300 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      領収書番号
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      作成日
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      請求書番号
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      受注No
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      件名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      数量
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      単価
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      金額
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      会社名
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      入金日
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      入金額
                    </th>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      選択/確定状態
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item) => (
                    <tr
                      key={item.id}
                      className={item.batch_receipt_no ? "bg-zinc-100" : undefined}
                    >
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.receipt_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.created_date ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.invoice_code}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.order_code ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.subject ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.quantity ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.unit_price != null
                          ? item.unit_price.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.total_amount != null
                          ? item.total_amount.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.company_name ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.received_date ?? "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.received_amount != null
                          ? item.received_amount.toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.batch_receipt_no ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-600">
                              {item.batch_receipt_no}
                            </span>
                            <a
                              href={`/receipts/create-batch?${new URLSearchParams(
                                {
                                  batch_invoice_no: batchInvoiceNo,
                                  view_batch_no: item.batch_receipt_no,
                                },
                              ).toString()}`}
                              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
                            >
                              印刷
                            </a>
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            name="item_ids"
                            value={item.id}
                            form="create-batch-form"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm font-bold">
              合計数量: {totalQuantity.toLocaleString("ja-JP")} / 合計金額:{" "}
              {totalAmount.toLocaleString("ja-JP")}円
            </p>
            <form
              id="create-batch-form"
              action={createBatchReceipt}
              className="mt-4"
            >
              <input
                type="hidden"
                name="batch_invoice_no"
                value={batchInvoiceNo}
              />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                一括領収書を作成
              </button>
            </form>
          </>
        ) : (
          <p>
            {unpaidCount > 0
              ? "入金済みの行がありません"
              : "該当するデータがありません"}
          </p>
        ))}
    </div>
  );
}
