import { SELF_ID, type Expense } from "./types";
import { todayISO, monthKey } from "./format";

/** The portion of an expense attributable to the current user. */
export function selfShareOf(expense: Expense): number {
  if (expense.kind === "personal") return expense.amount;
  const split = expense.splits.find((s) => s.personId === SELF_ID);
  return split ? split.owedAmount : 0;
}

export function isWithin(iso: string, from?: string, to?: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

export function filterExpenses(
  expenses: Expense[],
  range: { from?: string; to?: string } = {}
): Expense[] {
  return expenses.filter((e) => isWithin(e.date, range.from, range.to));
}

export interface PeriodTotals {
  total: number;
  personal: number;
  shared: number;
  count: number;
}

export function totalsFor(
  expenses: Expense[],
  range: { from?: string; to?: string } = {}
): PeriodTotals {
  const inRange = filterExpenses(expenses, range);
  let personal = 0;
  let shared = 0;
  for (const e of inRange) {
    const share = selfShareOf(e);
    if (e.kind === "personal") personal += share;
    else shared += share;
  }
  return {
    total: personal + shared,
    personal,
    shared,
    count: inRange.length,
  };
}

export function dashboardTotals(expenses: Expense[]): {
  today: PeriodTotals;
  week: PeriodTotals;
  month: PeriodTotals;
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 6 * 86400000);
  const startOfWeek = `${weekAgo.getFullYear()}-${`${weekAgo.getMonth() + 1}`.padStart(2, "0")}-${`${weekAgo.getDate()}`.padStart(2, "0")}`;
  const today = todayISO();
  return {
    today: totalsFor(expenses, { from: today, to: today }),
    week: totalsFor(expenses, { from: startOfWeek, to: today }),
    month: totalsFor(expenses, { from: `${monthKey(now)}-01` }),
  };
}

export function categoryBreakdown(
  expenses: Expense[],
  range: { from?: string; to?: string } = {}
): Array<{ categoryId: string; total: number }> {
  const map = new Map<string, number>();
  for (const e of filterExpenses(expenses, range)) {
    const share = selfShareOf(e);
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + share);
  }
  return [...map.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export function monthlyTrend(
  expenses: Expense[],
  months = 6
): Array<{ month: string; total: number }> {
  const now = new Date();
  const result: Array<{ month: string; total: number }> = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const total = expenses
      .filter((e) => monthKey(e.date) === key)
      .reduce((acc, e) => acc + selfShareOf(e), 0);
    result.push({ month: key, total });
  }
  return result;
}

export function recentExpenses(expenses: Expense[], limit = 5): Expense[] {
  return [...expenses]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
    .slice(0, limit);
}
