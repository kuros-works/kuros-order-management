import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ListPageHeader({
  heading,
  newHref,
  newLabel = "新規作成",
  extraHref,
  extraLabel,
  extraLinks,
}: {
  heading: ReactNode;
  newHref?: string;
  newLabel?: string;
  extraHref?: string;
  extraLabel?: string;
  extraLinks?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>{heading}</div>
      <div className="flex items-center gap-2">
        {extraHref && (
          <Link href={extraHref} className={cn(buttonVariants(), "gap-1.5")}>
            {extraLabel}
          </Link>
        )}
        {extraLinks?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(buttonVariants(), "gap-1.5")}
          >
            {link.label}
          </Link>
        ))}
        {newHref && (
          <Link href={newHref} className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="size-4" />
            {newLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
