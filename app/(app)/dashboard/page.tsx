"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  MoneyText,
  SectionTitle,
} from "@/components/ui";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { SettlementSheet, type SettlementPreset } from "@/components/settlement/settlement-sheet";
import { GroupIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { computeSelfBalances } from "@/lib/balances";
import { categoryBreakdown, dashboardTotals, recentExpenses } from "@/lib/selectors";
import { formatMoney } from "@/lib/format";
import { startOfMonthISO } from "@/lib/format";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { expenses, settlements, categories, resolveName } = useData();
  const currency = profile?.currency ?? "PKR";
  const [settlePreset, setSettlePreset] = useState<SettlementPreset | null>(null);

  const totals = useMemo(() => dashboardTotals(expenses), [expenses]);
  const balances = useMemo(
    () => computeSelfBalances(expenses, settlements),
    [expenses, settlements]
  );
  const breakdown = useMemo(
    () =>
      categoryBreakdown(expenses, { from: startOfMonthISO() }).map((entry) => {
        const category = categories.find((c) => c.id === entry.categoryId);
        return {
          name: category?.name ?? "Other",
          value: entry.total,
          color: category?.color ?? "#64748b",
        };
      }),
    [expenses, categories]
  );
  const recent = useMemo(() => recentExpenses(expenses, 5), [expenses]);

  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle="Here's your money at a glance"
        actions={<ThemeToggle />}
      />

      {/* Headline totals */}
      <Card className="bg-gradient-to-br from-brand to-indigo-500 text-brand-foreground">
        <p className="text-sm/relaxed opacity-80">Spent this month</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatMoney(totals.month.total, currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/15 px-3 py-2">
            <p className="opacity-80">Today</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(totals.today.total, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2">
            <p className="opacity-80">Last 7 days</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(totals.week.total, currency)}
            </p>
          </div>
        </div>
      </Card>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">You owe</p>
          <p className="mt-1 text-base font-bold text-negative tabular-nums">
            {formatMoney(balances.youOwe, currency)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Owed to you</p>
          <p className="mt-1 text-base font-bold text-positive tabular-nums">
            {formatMoney(balances.youAreOwed, currency)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Net</p>
          <MoneyText
            amount={balances.net}
            signed
            currency={currency}
            className="mt-1 block text-base font-bold"
          />
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/expenses/new" icon={<PlusIcon className="h-5 w-5" />} label="Expense" />
        <QuickAction
          href="/expenses/new?kind=shared"
          icon={<UsersIcon className="h-5 w-5" />}
          label="Group expense"
        />
        <QuickAction href="/groups/new" icon={<GroupIcon className="h-5 w-5" />} label="New group" />
      </div>

      {/* Spending by category */}
      {breakdown.length > 0 && (
        <Card>
          <SectionTitle
            title="This month by category"
            action={
              <Link href="/reports" className="text-xs font-semibold text-brand">
                Reports
              </Link>
            }
          />
          <CategoryChart data={breakdown} />
        </Card>
      )}

      {/* Who owes whom */}
      {balances.byPerson.length > 0 && (
        <div>
          <SectionTitle title="Balances" />
          <Card className="divide-y divide-border p-0">
            {balances.byPerson.slice(0, 6).map((b) => (
              <div key={b.personId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={resolveName(b.personId)} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{resolveName(b.personId)}</p>
                  <p className="text-xs text-foreground/50">
                    {b.net > 0 ? "owes you" : "you owe"}
                  </p>
                </div>
                <MoneyText amount={Math.abs(b.net)} currency={currency} className="font-semibold" />
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() =>
                    setSettlePreset({
                      personId: b.personId,
                      direction: b.net > 0 ? "theyOwe" : "iOwe",
                      amount: Math.abs(b.net),
                    })
                  }
                >
                  Settle
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Recent expenses */}
      <div>
        <SectionTitle
          title="Recent"
          action={
            <Link href="/expenses" className="text-xs font-semibold text-brand">
              View all
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No expenses yet"
            description="Tap + to record your first expense — it takes seconds."
            action={
              <Link
                href="/expenses/new"
                className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
              >
                Add expense
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {recent.map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      <SettlementSheet
        open={settlePreset !== null}
        onClose={() => setSettlePreset(null)}
        preset={settlePreset ?? undefined}
      />
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-4 text-center transition hover:bg-surface-muted active:scale-[0.98]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </span>
      <span className="text-xs font-medium text-foreground/70">{label}</span>
    </Link>
  );
}
