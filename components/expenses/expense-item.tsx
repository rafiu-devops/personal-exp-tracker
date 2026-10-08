"use client";

import { useData } from "@/lib/data-context";
import { selfShareOf } from "@/lib/selectors";
import { formatDayLabel } from "@/lib/format";
import { SELF_ID, type Expense } from "@/lib/types";
import { cn } from "@/lib/cn";
import { MoneyText } from "@/components/ui";
import Link from "next/link";

export function ExpenseItem({
  expense,
  className,
}: {
  expense: Expense;
  className?: string;
}) {
  const { resolveCategory, resolveName, groups } = useData();
  const category = resolveCategory(expense.categoryId);
  const group = groups.find((g) => g.id === expense.groupId);
  const share = selfShareOf(expense);
  const isShared = expense.kind === "shared";

  const subtitleParts = [category?.name ?? "Uncategorised"];
  if (group) subtitleParts.push(group.name);
  else if (isShared && expense.payerId !== SELF_ID) {
    subtitleParts.push(`${resolveName(expense.payerId)} paid`);
  }

  return (
    <Link
      href={`/expenses/${expense.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 transition hover:bg-surface-muted active:scale-[0.99]",
        className
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
        style={{ background: `${category?.color ?? "#64748b"}22` }}
      >
        {category?.icon ?? "📦"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">{expense.title}</span>
          {isShared && (
            <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              SHARED
            </span>
          )}
        </div>
        <div className="truncate text-xs text-foreground/50">
          {subtitleParts.join(" · ")}
        </div>
      </div>
      <div className="text-right">
        <MoneyText amount={share} className="font-semibold" />
        <div className="text-[11px] text-foreground/40">{formatDayLabel(expense.date)}</div>
      </div>
    </Link>
  );
}
