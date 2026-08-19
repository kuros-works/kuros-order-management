import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ListPageHeader({
  heading,
  newHref,
  newLabel = "新規作成",
}: {
  heading: ReactNode;
  newHref?: string;
  newLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>{heading}</div>
      {newHref && (
        <Link href={newHref} className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          {newLabel}
        </Link>
      )}
    </div>
  );
}
