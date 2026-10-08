import { describe, expect, it } from "vitest";
import { computeGroupBalances, computeSelfBalances, computeSelfLedger, summarizeLedger } from "./balances";
import { SELF_ID, type Expense, type ExpenseSplit, type Settlement } from "./types";

function makeExpense(params: {
  id: string;
  payerId: string;
  splits: Array<[string, number]>;
  groupId?: string;
}): Expense {
  const total = params.splits.reduce((acc, [, v]) => acc + v, 0);
  const splits: ExpenseSplit[] = params.splits.map(([personId, owedAmount]) => ({
    personId,
    owedAmount,
    paidAmount: personId === params.payerId ? total : 0,
    settledAmount: 0,
  }));
  return {
    id: params.id,
    kind: "shared",
    groupId: params.groupId,
    title: "Test expense",
    amount: total,
    categoryId: "cat",
    date: "2026-01-01",
    payerId: params.payerId,
    participantIds: params.splits.map(([id]) => id),
    splitType: "equal",
    splits,
    status: "active",
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeSettlement(params: {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number;
  groupId?: string;
}): Settlement {
  return {
    id: params.id,
    fromPersonId: params.fromPersonId,
    toPersonId: params.toPersonId,
    amount: params.amount,
    date: "2026-01-02",
    groupId: params.groupId,
    createdAt: 0,
  };
}

describe("computeSelfLedger", () => {
  it("records a positive balance when the user paid and others owe", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: SELF_ID, splits: [[SELF_ID, 500], ["ali", 500]] }),
    ];
    const ledger = computeSelfLedger(expenses, []);
    expect(ledger.get("ali")).toBe(500);
  });

  it("records a negative balance when someone else paid and the user owes", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "ali", splits: [[SELF_ID, 300], ["ali", 300]] }),
    ];
    const ledger = computeSelfLedger(expenses, []);
    expect(ledger.get("ali")).toBe(-300);
  });

  it("ignores debts that do not involve the user", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "ali", splits: [["sara", 100], ["ali", 100]] }),
    ];
    const ledger = computeSelfLedger(expenses, []);
    expect(ledger.size).toBe(0);
  });

  it("reduces what someone owes when they pay the user back", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: SELF_ID, splits: [[SELF_ID, 500], ["ali", 500]] }),
    ];
    const settlements = [
      makeSettlement({ id: "s1", fromPersonId: "ali", toPersonId: SELF_ID, amount: 200 }),
    ];
    expect(computeSelfLedger(expenses, settlements).get("ali")).toBe(300);
  });

  it("reduces what the user owes when the user pays someone back", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "ali", splits: [[SELF_ID, 400], ["ali", 400]] }),
    ];
    const settlements = [
      makeSettlement({ id: "s1", fromPersonId: SELF_ID, toPersonId: "ali", amount: 150 }),
    ];
    expect(computeSelfLedger(expenses, settlements).get("ali")).toBe(-250);
  });

  it("nets a full settlement back to zero", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: SELF_ID, splits: [[SELF_ID, 250], ["ali", 250]] }),
    ];
    const settlements = [
      makeSettlement({ id: "s1", fromPersonId: "ali", toPersonId: SELF_ID, amount: 250 }),
    ];
    expect(computeSelfLedger(expenses, settlements).get("ali")).toBe(0);
  });
});

describe("summarizeLedger", () => {
  it("splits the ledger into owed and owing totals", () => {
    const ledger = new Map([
      ["ali", 300],
      ["sara", -120],
    ]);
    const summary = summarizeLedger(ledger);
    expect(summary.youAreOwed).toBe(300);
    expect(summary.youOwe).toBe(120);
    expect(summary.net).toBe(180);
    expect(summary.byPerson.map((b) => b.personId)).toEqual(["ali", "sara"]);
  });
});

describe("computeSelfBalances", () => {
  it("aggregates expenses and settlements", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: SELF_ID, splits: [[SELF_ID, 600], ["ali", 600]] }),
    ];
    const settlements = [
      makeSettlement({ id: "s1", fromPersonId: "ali", toPersonId: SELF_ID, amount: 100 }),
    ];
    const balances = computeSelfBalances(expenses, settlements);
    expect(balances.net).toBe(500);
  });
});

describe("computeGroupBalances", () => {
  it("only counts activity inside the requested group", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: SELF_ID, splits: [[SELF_ID, 100], ["ali", 100]], groupId: "trip" }),
      makeExpense({ id: "e2", payerId: SELF_ID, splits: [[SELF_ID, 200], ["ali", 200]], groupId: "office" }),
    ];
    expect(computeGroupBalances(expenses, [], "trip").net).toBe(100);
    expect(computeGroupBalances(expenses, [], "office").net).toBe(200);
  });
});
