type Receipt = {
  id: number;
  receipt_code: string;
  created_date: string;
  sent_date: string | null;
  received_date: string | null;
  received_amount: number | null;
};

export function ReceiptTabContent({
  receipt,
  hasInvoice,
  receiptSentStatusLabel,
}: {
  receipt: Receipt | null;
  hasInvoice: boolean;
  receiptSentStatusLabel: string;
}) {
  if (!receipt) {
    return (
      <p className="text-zinc-500">
        {hasInvoice
          ? "領収書は請求書作成時に自動生成されます"
          : "請求書が未作成のため領収書もありません"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 block text-sm font-bold">領収書番号</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.receipt_code}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">作成日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.created_date}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">領収書送信状況</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receiptSentStatusLabel}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">送信日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.sent_date ?? "-"}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">入金日</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.received_date ?? "-"}
        </div>
      </div>
      <div>
        <p className="mb-1 block text-sm font-bold">入金額</p>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {receipt.received_amount != null
            ? `${receipt.received_amount.toLocaleString("ja-JP")}円`
            : "-"}
        </div>
      </div>
    </div>
  );
}
