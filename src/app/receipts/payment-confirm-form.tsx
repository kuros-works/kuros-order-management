"use client";

import { useState, useTransition } from "react";
import { confirmPayment } from "./actions";

function todayJST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function PaymentConfirmForm({
  receiptId,
  defaultAmount,
}: {
  receiptId: number;
  defaultAmount: number | null;
}) {
  const [receivedDate, setReceivedDate] = useState(todayJST());
  const [receivedAmount, setReceivedAmount] = useState(
    defaultAmount !== null ? String(defaultAmount) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await confirmPayment(
            receiptId,
            receivedDate,
            Number(receivedAmount),
          );
          if (result.error) {
            setError(result.error);
          }
        });
      }}
    >
      <input
        type="date"
        value={receivedDate}
        onChange={(e) => setReceivedDate(e.target.value)}
        required
        className="rounded border border-zinc-300 px-2 py-1 text-xs"
      />
      <input
        type="number"
        min="1"
        step="1"
        value={receivedAmount}
        onChange={(e) => setReceivedAmount(e.target.value)}
        required
        className="rounded border border-zinc-300 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        入金確定
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
