/**
 * Core domain types for the MM expense tracker.
 *
 * All monetary amounts are stored as integers in the smallest whole unit
 * supported for the MVP currency (PKR rupees). Never rely on floating point
 * equality for settlement calculations.
 */

export const SELF_ID = "self";

export type SplitType = "equal" | "exact" | "percentage";
export type ExpenseKind = "personal" | "shared";
export type ExpenseStatus = "active" | "settled";
export type PaymentMethod = "cash" | "card" | "other";

/** The kind of money container an account represents. */
export type AccountType = "cash" | "wallet" | "savings" | "card" | "other";

/**
 * A money container (cash in hand, mobile wallet, savings, debit/credit card).
 * Its live balance = openingBalance + income + received settlements - expenses.
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Balance the account started with, before any tracked activity. */
  openingBalance: number;
  icon: string;
  color: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Money added to an account (salary, top-up, transfer in, …). */
export interface Income {
  id: string;
  accountId: string;
  amount: number;
  /** ISO date string (yyyy-MM-dd). */
  date: string;
  note?: string;
  createdAt: number;
}

/** Money moved between two of the user's own accounts (e.g. card → wallet). */
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  /** ISO date string (yyyy-MM-dd). */
  date: string;
  note?: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  /** Avatar image: a URL (e.g. Google photo) or an inline data URL. */
  photoURL?: string;
  currency: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: number;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** A single participant's position inside a shared expense. */
export interface ExpenseSplit {
  /** Person id, or SELF_ID for the current user. */
  personId: string;
  /** How much of the total this participant is responsible for. */
  owedAmount: number;
  /** How much this participant actually put in. */
  paidAmount: number;
  /** Amount already settled back (for this expense). */
  settledAmount: number;
}

export interface Expense {
  id: string;
  kind: ExpenseKind;
  groupId?: string;
  title: string;
  amount: number;
  categoryId: string;
  /** ISO date string (yyyy-MM-dd) of the expense. */
  date: string;
  note?: string;
  /** @deprecated kept for older records; new expenses use `accountId`. */
  paymentMethod?: PaymentMethod;
  /** Account the money left from. */
  accountId?: string;
  /** Person id of the payer, or SELF_ID. Only for shared expenses. */
  payerId: string;
  /** Person ids participating, including SELF_ID when applicable. */
  participantIds: string[];
  splitType: SplitType;
  splits: ExpenseSplit[];
  status: ExpenseStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Settlement {
  id: string;
  groupId?: string;
  /** Person id (or SELF_ID) who paid back. */
  fromPersonId: string;
  /** Person id (or SELF_ID) who received the money. */
  toPersonId: string;
  amount: number;
  /** ISO date string (yyyy-MM-dd). */
  date: string;
  note?: string;
  /** Account the money moved through (when the user is a party). */
  accountId?: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId?: string;
  /** ISO month string (yyyy-MM). */
  month: string;
  amount: number;
}

export interface SplitEntry {
  personId: string;
  /** For splitType "exact": the exact amount. For "percentage": the percentage. */
  value: number;
}

export interface SplitResult {
  personId: string;
  owedAmount: number;
}

export interface PersonBalance {
  personId: string;
  /** Positive: this person owes the current user. Negative: the user owes them. */
  net: number;
}
