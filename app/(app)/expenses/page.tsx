"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Chip, EmptyState, Input, Select } from "@/components/ui";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { SearchIcon } from "@/components/icons";
import { useData } from "@/lib/data-context";
import { filterExpenses, selfShareOf } from "@/lib/selectors";
import { formatDayLabel, formatMoney } from "@/lib/format";
import type { ExpenseKind } from "@/lib/types";

type KindFilter = "all" | ExpenseKind;

export default function ExpensesPage() {
  const { expenses, categories, groups } = useData();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [groupId, setGroupId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterExpenses(expenses).filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (categoryId && e.categoryId !== categoryId) return false;
      if (groupId && e.groupId !== groupId) return false;
      if (q) {
        const haystack = `${e.title} ${e.note ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, query, kind, categoryId, groupId]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const totalShown = filtered.reduce((acc, e) => acc + selfShareOf(e), 0);
  const hasAny = expenses.length > 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Expenses" subtitle={`${filtered.length} shown · ${formatMoney(totalShown)}`} />

      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or note…"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "personal", "shared"] as KindFilter[]).map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === "all" ? "All" : k === "personal" ? "Personal" : "Shared"}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!hasAny ? (
        <EmptyState
          icon="🧾"
          title="No expenses yet"
          description="Record your first expense to start tracking where your money goes."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Nothing matches" description="Try changing the search or filters." />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => {
            const dayTotal = items.reduce((acc, e) => acc + selfShareOf(e), 0);
            return (
              <div key={date}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                    {formatDayLabel(date)}
                  </span>
                  <span className="text-xs font-medium text-foreground/45 tabular-nums">
                    {formatMoney(dayTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((expense) => (
                    <ExpenseItem key={expense.id} expense={expense} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
