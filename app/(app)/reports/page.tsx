"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { CategoryChart, type ChartDatum } from "@/components/dashboard/category-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ChevronRightIcon } from "@/components/icons";
import { useData } from "@/lib/data-context";
import { categoryBreakdown, monthlyTrend, totalsFor } from "@/lib/selectors";
import { currentMonthKey, formatMoney, formatMonthLabel } from "@/lib/format";

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

function monthRange(key: string): { from: string; to: string } {
  const [y, m] = key.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${`${lastDay}`.padStart(2, "0")}` };
}

export default function ReportsPage() {
  const { expenses, resolveCategory, groups } = useData();
  const [month, setMonth] = useState(currentMonthKey());
  const isCurrent = month >= currentMonthKey();

  const range = useMemo(() => monthRange(month), [month]);
  const totals = useMemo(() => totalsFor(expenses, range), [expenses, range]);
  const breakdown = useMemo(() => categoryBreakdown(expenses, range), [expenses, range]);
  const trend = useMemo(() => monthlyTrend(expenses, 6), [expenses]);

  const chartData: ChartDatum[] = breakdown.map((b) => {
    const category = resolveCategory(b.categoryId);
    return {
      name: category?.name ?? "Uncategorised",
      value: b.total,
      color: category?.color ?? "#64748b",
    };
  });

  const daysInMonth = Number(range.to.slice(8)) || 30;
  const perDay = totals.total / daysInMonth;

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Understand where your money goes" />

      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-2 py-2">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="flex h-9 w-9 rotate-180 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted"
          aria-label="Previous month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{formatMonthLabel(month)}</span>
        <button
          type="button"
          disabled={isCurrent}
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Spent</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{formatMoney(totals.total)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Expenses</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{totals.count}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Avg / day</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{formatMoney(perDay)}</p>
        </Card>
      </div>

      <div>
        <SectionTitle title="By category" />
        <Card>
          {chartData.length === 0 ? (
            <EmptyState icon="📊" title="No spending this month" description="Add an expense to see your breakdown." />
          ) : (
            <CategoryChart data={chartData} />
          )}
        </Card>
      </div>

      {groups.length > 0 && (
        <div>
          <SectionTitle title="Details" />
          <Card className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/60">Personal spending</span>
              <span className="font-medium tabular-nums">{formatMoney(totals.personal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/60">Your share of shared</span>
              <span className="font-medium tabular-nums">{formatMoney(totals.shared)}</span>
            </div>
          </Card>
        </div>
      )}

      <div>
        <SectionTitle title="Last 6 months" />
        <Card>
          <TrendChart data={trend} />
        </Card>
      </div>
    </div>
  );
}
