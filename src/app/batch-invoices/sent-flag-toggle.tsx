"use client";

import { useState, useTransition } from "react";
import { toggleSentFlag } from "./actions";

export function SentFlagToggle({
  batchInvoiceId,
  sentFlag,
}: {
  batchInvoiceId: number;
  sentFlag: boolean;
}) {
  const [checked, setChecked] = useState(sentFlag);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <input
        type="checkbox"
        checked={checked}
        disabled={isPending}
        onChange={(e) => {
          const nextChecked = e.target.checked;
          setChecked(nextChecked);
          setError(null);
          startTransition(async () => {
            const result = await toggleSentFlag(batchInvoiceId, nextChecked);
            if (result.error) {
              setChecked(!nextChecked);
              setError(result.error);
            }
          });
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
