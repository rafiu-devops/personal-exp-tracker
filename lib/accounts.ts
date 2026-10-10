import { SELF_ID } from "./types";
import type {
  Account,
  AccountType,
  Expense,
  Settlement,
  Income,
  Transfer,
} from "./types";
import { monthKey } from "./format";

/** Metadata for each account type, used to build pickers and icons. */
export const ACCOUNT_TYPES: Array<{
  type: AccountType;
  label: string;
  icon: string;
  color: string;
}> = [
  { type: "cash", label: "Cash", icon: "💵", color: "#22c55e" },
  { type: "wallet", label: "Wallet", icon: "👛", color: "#0ea5e9" },
  { type: "savings", label: "Savings", icon: "🏦", color: "#8b5cf6" },
  { type: "card", label: "Card", icon: "💳", color: "#f59e0b" },
  { type: "other", label: "Other", icon: "💰", color: "#64748b" },
];

export function accountTypeMeta(type: AccountType) {
  return ACCOUNT_TYPES.find((t) => t.type === type) ?? ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1];
}

export const DEFAULT_ACCOUNTS: Array<
  Pick<Account, "name" | "type" | "icon" | "color" | "openingBalance" | "archived">
> = [
  { name: "Cash", type: "cash", icon: "💵", color: "#22c55e", openingBalance: 0, archived: false },
  { name: "Wallet", type: "wallet", icon: "👛", color: "#0ea5e9", openingBalance: 0, archived: false },
  { name: "Savings", type: "savings", icon: "🏦", color: "#8b5cf6", openingBalance: 0, archived: false },
  { name: "Card", type: "card", icon: "💳", color: "#f59e0b", openingBalance: 0, archived: false },
];

export interface AccountBalance {
  accountId: string;
  opening: number;
  income: number;
  /** Money received (settlements where the user was paid back). */
  received: number;
  /** Money spent + paid out (expenses and outgoing settlements). */
  spent: number;
  /** Money moved into this account from another account. */
  transferIn: number;
  /** Money moved out of this account into another account. */
  transferOut: number;
  balance: number;
}

/** Total current balance across all accounts (including archived). */
export function totalAccountBalance(balances: AccountBalance[]): number {
  return balances.reduce((acc, b) => acc + b.balance, 0);
}

/** Map each account type to the first account of that type. */
function buildByTypeMap(accounts: Account[]): Map<AccountType, string> {
  const byType = new Map<AccountType, string>();
  for (const account of accounts) {
    if (!byType.has(account.type)) byType.set(account.type, account.id);
  }
  return byType;
}

/**
 * Attribute an expense to an account. Prefers the explicit `accountId` and
 * falls back to matching the legacy `paymentMethod` against an account's type
 * so expenses created before accounts existed still deduct correctly.
 */
function resolveExpenseAccount(
  expense: Expense,
  byType: Map<AccountType, string>
): string | undefined {
  if (expense.accountId) return expense.accountId;
  if (expense.paymentMethod && expense.paymentMethod !== "other") {
    return byType.get(expense.paymentMethod);
  }
  return undefined;
}

/**
 * Compute the live balance of every account from its opening balance, tracked
 * income, and the money that has flowed through it. Only activity where the
 * current user is the payer/receiver affects their account balances.
 */
export function computeAccountBalances(
  accounts: Account[],
  expenses: Expense[],
  settlements: Settlement[],
  incomes: Income[] = [],
  transfers: Transfer[] = []
): AccountBalance[] {
  const map = new Map<string, AccountBalance>();
  const byType = buildByTypeMap(accounts);
  for (const account of accounts) {
    map.set(account.id, {
      accountId: account.id,
      opening: account.openingBalance,
      income: 0,
      received: 0,
      spent: 0,
      transferIn: 0,
      transferOut: 0,
      balance: account.openingBalance,
    });
  }

  const bump = (
    id: string | undefined,
    field: "income" | "received" | "spent" | "transferIn" | "transferOut",
    amount: number
  ) => {
    if (!id) return;
    const bucket = map.get(id);
    if (!bucket) return;
    bucket[field] += amount;
  };

  for (const income of incomes) {
    bump(income.accountId, "income", income.amount);
  }

  for (const expense of expenses) {
    if (expense.payerId !== SELF_ID) continue;
    const accountId = resolveExpenseAccount(expense, byType);
    bump(accountId, "spent", expense.amount);
  }

  for (const settlement of settlements) {
    if (settlement.fromPersonId === SELF_ID && settlement.toPersonId !== SELF_ID) {
      bump(settlement.accountId, "spent", settlement.amount);
    } else if (settlement.toPersonId === SELF_ID && settlement.fromPersonId !== SELF_ID) {
      bump(settlement.accountId, "received", settlement.amount);
    }
  }

  for (const transfer of transfers) {
    bump(transfer.fromAccountId, "transferOut", transfer.amount);
    bump(transfer.toAccountId, "transferIn", transfer.amount);
  }

  const result: AccountBalance[] = [];
  for (const bucket of map.values()) {
    bucket.balance =
      bucket.opening +
      bucket.income +
      bucket.received +
      bucket.transferIn -
      bucket.spent -
      bucket.transferOut;
    result.push(bucket);
  }
  return result;
}

export interface MonthBudgetEntry {
  accountId: string;
  /** Income set for the month on this account. */
  income: number;
  /** Money spent from this account during the month. */
  spent: number;
  /** income - spent. Negative means the account is overspent this month. */
  balance: number;
}

export interface MonthBudget {
  /** ISO month (yyyy-MM). */
  month: string;
  entries: MonthBudgetEntry[];
  totalIncome: number;
  totalSpent: number;
  totalBalance: number;
  /** Accounts whose spending exceeded their income for the month. */
  overspent: MonthBudgetEntry[];
}

/**
 * Budget for a single month: the income you set per account minus what you
 * spent from it. Spending over income pushes the entry (and the total) into
 * the minus, which the UI surfaces as "settle your this month budget".
 */
export function monthBudget(
  accounts: Account[],
  expenses: Expense[],
  incomes: Income[],
  month: string
): MonthBudget {
  const map = new Map<string, MonthBudgetEntry>();
  const byType = buildByTypeMap(accounts);
  for (const account of accounts) {
    map.set(account.id, { accountId: account.id, income: 0, spent: 0, balance: 0 });
  }

  const inMonth = (iso?: string) => Boolean(iso && monthKey(iso) === month);

  for (const income of incomes) {
    if (!inMonth(income.date)) continue;
    const bucket = map.get(income.accountId);
    if (bucket) bucket.income += income.amount;
  }

  for (const expense of expenses) {
    if (expense.payerId !== SELF_ID || !inMonth(expense.date)) continue;
    const accountId = resolveExpenseAccount(expense, byType);
    if (!accountId) continue;
    const bucket = map.get(accountId);
    if (bucket) bucket.spent += expense.amount;
  }

  const entries = [...map.values()];
  for (const entry of entries) entry.balance = entry.income - entry.spent;

  const totalIncome = entries.reduce((acc, e) => acc + e.income, 0);
  const totalSpent = entries.reduce((acc, e) => acc + e.spent, 0);

  return {
    month,
    entries,
    totalIncome,
    totalSpent,
    totalBalance: totalIncome - totalSpent,
    overspent: entries.filter((e) => e.balance < 0),
  };
}
