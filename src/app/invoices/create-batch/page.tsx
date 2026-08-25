import { createClient } from "@/lib/supabase-server";
import { createBatchInvoice } from "./actions";
import { PrintDocument } from "@/components/print/PrintDocument";

function getSingleParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

async function InvoicePrintView({
  companyId,
  startDate,
  endDate,
  batchInvoiceNo,
  confirmedCount,
}: {
  companyId: string;
  startDate: string;
  endDate: string;
  batchInvoiceNo: string;
  confirmedCount: string | null;
}) {
  const supabase = await createClient();

  const closeHref = `/invoices/create-batch?${new URLSearchParams({
    company_id: companyId,
    start_date: startDate,
    end_date: endDate,
  }).toString()}`;

  const [
    { data: company, error: companyError },
    { data: issuerRow, error: issuerError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, contact_name, address, postal_code")
      .eq("id", Number(companyId))
      .maybeSingle(),
    supabase
      .from("company_settings")
      .select(
        "company_name, contact_person, postal_code, address, phone, email, invoice_registration_number, bank_name, branch_name, account_type, account_number, account_holder",
      )
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, order_id, batch_invoice_created_at")
      .eq("batch_invoice_no", batchInvoiceNo)
      .order("id", { ascending: true }),
  ]);

  const loadError = companyError || issuerError || itemsError;
  if (loadError || !company || !issuerRow) {
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

  const orderIds = Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.order_id)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  );

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, subject, unit, unit_price, quantity")
    .in("id", orderIds.length > 0 ? orderIds : [-1]);

  if (ordersError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          受注データの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {ordersError.message}
        </pre>
        <a href={closeHref} className="mt-4 inline-block text-sm underline">
          一覧に戻る
        </a>
      </div>
    );
  }

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));

  const lineItems = (items ?? []).map((item) => {
    const order =
      item.order_id !== null && item.order_id !== undefined
        ? orderById.get(item.order_id)
        : undefined;
    const unitPrice = order?.unit_price ?? 0;
    const quantity = order?.quantity ?? 0;
    return {
      description: order?.subject ?? "-",
      quantity,
      unit: order?.unit ?? "",
      unitPrice,
      amount: unitPrice * quantity,
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const firstCreatedAt = (items ?? [])
    .map((item) => item.batch_invoice_created_at)
    .filter((value): value is string => !!value)
    .sort()[0];
  const documentDate = firstCreatedAt ? firstCreatedAt.slice(0, 10) : "";

  const companyAddress = company.postal_code
    ? `〒${company.postal_code} ${company.address ?? ""}`
    : company.address;

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        {confirmedCount ? (
          <p className="text-sm font-bold text-green-700">
            {batchInvoiceNo}として{confirmedCount}件を確定しました
          </p>
        ) : (
          <p className="text-sm font-bold text-zinc-700">
            {batchInvoiceNo} の印刷プレビュー
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
        documentType="invoice"
        documentNumber={batchInvoiceNo}
        documentDate={documentDate}
        companyName={company.company_name}
        contactName={company.contact_name}
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
        showPaymentInfo={true}
        notes={null}
      />
    </div>
  );
}

export default async function CreateBatchInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const companyId = getSingleParam(resolvedSearchParams, "company_id");
  const startDate = getSingleParam(resolvedSearchParams, "start_date");
  const endDate = getSingleParam(resolvedSearchParams, "end_date");
  const actionError = getSingleParam(resolvedSearchParams, "action_error");
  const confirmedNo = getSingleParam(resolvedSearchParams, "confirmed_no");
  const confirmedCount = getSingleParam(resolvedSearchParams, "confirmed_count");
  const viewBatchNo = getSingleParam(resolvedSearchParams, "view_batch_no");

  if (confirmedNo && confirmedCount) {
    return (
      <InvoicePrintView
        companyId={companyId}
        startDate={startDate}
        endDate={endDate}
        batchInvoiceNo={confirmedNo}
        confirmedCount={confirmedCount}
      />
    );
  }

  if (viewBatchNo) {
    return (
      <InvoicePrintView
        companyId={companyId}
        startDate={startDate}
        endDate={endDate}
        batchInvoiceNo={viewBatchNo}
        confirmedCount={null}
      />
    );
  }

  const supabase = await createClient();

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("id", { ascending: true });

  if (companiesError) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          companiesの取得に失敗しました
        </h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-500">
          {companiesError.message}
        </pre>
      </div>
    );
  }

  const hasSearchCondition = !!companyId && !!startDate && !!endDate;
  const selectedCompany = companies?.find(
    (company) => String(company.id) === companyId,
  );

  let invoiceItems:
    | {
        id: number;
        issued_date: string | null;
        invoice_code: string;
        order_code: string | null;
        subject: string | null;
        quantity: number | null;
        unit_price: number | null;
        total_amount: number | null;
        batch_invoice_no: string | null;
      }[]
    | null = null;
  let searchError: string | null = null;

  if (hasSearchCondition) {
    if (!selectedCompany || !selectedCompany.company_name) {
      searchError = "選択された会社が見つかりません";
    } else {
      const { data: rawItems, error } = await supabase
        .from("invoices_with_order_info")
        .select("*")
        .eq("company_name", selectedCompany.company_name)
        .gte("issued_date", startDate)
        .lte("issued_date", endDate)
        .order("issued_date", { ascending: true });

      if (error) {
        searchError = `請求データの取得に失敗しました: ${error.message}`;
      } else {
        const itemIds = (rawItems ?? []).map((item) => item.id as number);
        const batchInvoiceNoById = new Map<number, string | null>();
        if (itemIds.length > 0) {
          const { data: batchRows, error: batchRowsError } = await supabase
            .from("invoices")
            .select("id, batch_invoice_no")
            .in("id", itemIds);

          if (batchRowsError) {
            searchError = `確定番号の取得に失敗しました: ${batchRowsError.message}`;
          } else {
            for (const row of batchRows ?? []) {
              batchInvoiceNoById.set(row.id, row.batch_invoice_no);
            }
          }
        }

        if (!searchError) {
          invoiceItems = (rawItems ?? []).map((item) => ({
            id: item.id,
            issued_date: item.issued_date,
            invoice_code: item.invoice_code,
            order_code: item.order_code,
            subject: item.subject,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            batch_invoice_no: batchInvoiceNoById.get(item.id) ?? null,
          }));
        }
      }
    }
  }

  const totalQuantity =
    invoiceItems?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
  const totalAmount =
    invoiceItems?.reduce((sum, item) => sum + (item.total_amount ?? 0), 0) ??
    0;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-bold">一括請求書の抽出プレビュー</h1>
      <form
        action="/invoices/create-batch"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label
            htmlFor="company_id"
            className="mb-1 block text-sm font-bold"
          >
            会社
          </label>
          <select
            id="company_id"
            name="company_id"
            required
            defaultValue={companyId}
            className="w-56 rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              選択してください
            </option>
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="start_date"
            className="mb-1 block text-sm font-bold"
          >
            開始日
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={startDate}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="mb-1 block text-sm font-bold">
            終了日
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={endDate}
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

      {hasSearchCondition &&
        !searchError &&
        (invoiceItems && invoiceItems.length > 0 ? (
          <>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse border border-zinc-300 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 border border-zinc-300 bg-zinc-100 px-3 py-2 text-left">
                      発行日
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
                      選択/確定状態
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item) => (
                    <tr
                      key={item.id}
                      className={item.batch_invoice_no ? "bg-zinc-100" : undefined}
                    >
                      <td className="border border-zinc-300 px-3 py-2">
                        {item.issued_date ?? "-"}
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
                        {item.batch_invoice_no ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-600">
                              {item.batch_invoice_no}
                            </span>
                            <a
                              href={`/invoices/create-batch?${new URLSearchParams(
                                {
                                  company_id: companyId,
                                  start_date: startDate,
                                  end_date: endDate,
                                  view_batch_no: item.batch_invoice_no,
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
              action={createBatchInvoice}
              className="mt-4"
            >
              <input type="hidden" name="company_id" value={companyId} />
              <input type="hidden" name="start_date" value={startDate} />
              <input type="hidden" name="end_date" value={endDate} />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                一括請求書を作成
              </button>
            </form>
          </>
        ) : (
          <p>該当するデータがありません</p>
        ))}
    </div>
  );
}
