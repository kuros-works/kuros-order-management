"use client";

import { useState, useTransition } from "react";

export function NotesInlineEditor({
  id,
  initialNotes,
  onSave,
}: {
  id: number;
  initialNotes: string | null;
  onSave: (id: number, notes: string) => Promise<{ error: string | null }>;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const previousNotes = initialNotes ?? "";
    if (notes === previousNotes) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onSave(id, notes);
      if (result.error) {
        setNotes(previousNotes);
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <textarea
        value={notes}
        disabled={isPending}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        rows={2}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={save}
        className="mt-1 rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        保存
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
