import { SELF_ID, type Expense, type PersonBalance, type Settlement } from "./types";

export interface BalanceSummary {
  /** Total others owe the current user. */
  youAreOwed: number;
  /** Total the current user owes others. */
  youOwe: number;
  /** youAreOwed - youOwe. Positive means the user is net in credit. */
  net: number;
  byPerson: PersonBalance[];
}

export type Ledger = Map<string, number>;

/**
 * Build a ledger of the current user's net position with every other person.
 *
 * Sign convention: a positive value means the person owes the current user;
 * a negative value means the current user owes that person.
 */
export function computeSelfLedger(
  expenses: Expense[],
  settlements: Settlement[],
  filter?: { groupId?: string }
): Ledger {
  const ledger: Ledger = new Map();

  const bump = (personId: string, delta: number) => {
    if (!personId || personId === SELF_ID) return;
    ledger.set(personId, (ledger.get(personId) ?? 0) + delta);
  };

  for (const expense of expenses) {
    if (expense.kind !== "shared") continue;
    if (filter?.groupId && expense.groupId !== filter.groupId) continue;

    const payer = expense.payerId;
    for (const split of expense.splits) {
      const debtor = split.personId;
      if (debtor === payer) continue;
      const amount = split.owedAmount - (split.settledAmount ?? 0);
      if (amount === 0) continue;

      if (debtor === SELF_ID) {
        // The user owes the payer.
        bump(payer, -amount);
      } else if (payer === SELF_ID) {
        // The debtor owes the user.
        bump(debtor, amount);
      }
      // Debts strictly between two other people are not part of the user's net.
    }
  }

  for (const settlement of settlements) {
    if (filter?.groupId && settlement.groupId !== filter.groupId) continue;
    const { fromPersonId, toPersonId, amount } = settlement;

    if (fromPersonId === SELF_ID && toPersonId !== SELF_ID) {
      // The user paid someone back: reduces what the user owes them.
      bump(toPersonId, amount);
    } else if (toPersonId === SELF_ID && fromPersonId !== SELF_ID) {
      // Someone paid the user back: reduces what they owe the user.
      bump(fromPersonId, -amount);
    }
  }

  return ledger;
}

/** Convert a raw ledger into user-facing totals. */
export function summarizeLedger(ledger: Ledger): BalanceSummary {
  let youAreOwed = 0;
  let youOwe = 0;
  const byPerson: PersonBalance[] = [];

  for (const [personId, net] of ledger.entries()) {
    if (net > 0) youAreOwed += net;
    else if (net < 0) youOwe += -net;
    if (net !== 0) byPerson.push({ personId, net });
  }

  byPerson.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return { youAreOwed, youOwe, net: youAreOwed - youOwe, byPerson };
}

export function computeSelfBalances(
  expenses: Expense[],
  settlements: Settlement[]
): BalanceSummary {
  return summarizeLedger(computeSelfLedger(expenses, settlements));
}

export function computeGroupBalances(
  expenses: Expense[],
  settlements: Settlement[],
  groupId: string
): BalanceSummary {
  return summarizeLedger(computeSelfLedger(expenses, settlements, { groupId }));
}
