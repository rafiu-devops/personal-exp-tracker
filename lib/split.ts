import type { SplitEntry, SplitResult, SplitType } from "./types";

/**
 * The split engine. All amounts are integers in whole currency units (PKR).
 * Every function guarantees that the returned shares sum to the total so the
 * ledger can never drift.
 */

export interface SplitValidation {
  valid: boolean;
  errors: string[];
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Split a total equally between participants. Any remainder (from integer
 * division) is distributed one unit at a time across the first participants so
 * the shares always add up to the total exactly.
 */
export function splitEqual(total: number, participantIds: string[]): SplitResult[] {
  if (participantIds.length === 0) return [];
  const base = Math.floor(total / participantIds.length);
  let remainder = total - base * participantIds.length;
  return participantIds.map((personId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { personId, owedAmount: base + extra };
  });
}

/** Use the exact amounts a user typed. Values must already sum to the total. */
export function splitExact(total: number, entries: SplitEntry[]): SplitResult[] {
  const results = entries.map((e) => ({
    personId: e.personId,
    owedAmount: Math.round(e.value),
  }));
  const diff = total - sum(results.map((r) => r.owedAmount));
  if (diff !== 0 && results.length > 0) {
    // Absorb any rounding drift on the last participant.
    results[results.length - 1].owedAmount += diff;
  }
  return results;
}

/**
 * Percentage split. Percentages must total 100. We use integer arithmetic:
 * floor each share, then hand out the remaining units to the entries with the
 * largest fractional remainder.
 */
export function splitPercentage(
  total: number,
  entries: SplitEntry[]
): SplitResult[] {
  if (entries.length === 0) return [];
  const weighted = entries.map((e) => {
    const exact = (total * e.value) / 100;
    const floor = Math.floor(exact);
    return { personId: e.personId, owedAmount: floor, frac: exact - floor };
  });
  let remainder = total - sum(weighted.map((w) => w.owedAmount));
  const order = [...weighted].sort((a, b) => b.frac - a.frac);
  let i = 0;
  while (remainder > 0 && order.length > 0) {
    order[i % order.length].owedAmount += 1;
    remainder -= 1;
    i += 1;
  }
  return weighted.map((w) => ({ personId: w.personId, owedAmount: w.owedAmount }));
}

/** Validate the configuration before computing shares. */
export function validateSplit(
  total: number,
  method: SplitType,
  participantIds: string[],
  entries?: SplitEntry[]
): SplitValidation {
  const errors: string[] = [];

  if (!Number.isFinite(total) || total <= 0) {
    errors.push("Amount must be greater than 0.");
  }
  if (participantIds.length < 2) {
    errors.push("A shared expense needs at least 2 participants.");
  }
  if (entries && entries.length !== participantIds.length) {
    errors.push("Every participant needs a value.");
  }

  if (method === "exact" && entries) {
    const totalEntered = sum(entries.map((e) => Math.round(e.value)));
    if (totalEntered !== total) {
      errors.push(
        `Exact amounts must add up to ${total}. Currently ${totalEntered}.`
      );
    }
  }

  if (method === "percentage" && entries) {
    const totalPercent = sum(entries.map((e) => e.value));
    if (Math.round(totalPercent * 100) !== 10000) {
      errors.push(
        `Percentages must add up to 100%. Currently ${totalPercent}%.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Compute shares for a given split method. Assumes config is already valid. */
export function computeShares(
  total: number,
  method: SplitType,
  participantIds: string[],
  entries?: SplitEntry[]
): SplitResult[] {
  switch (method) {
    case "exact":
      return splitExact(total, entries ?? []);
    case "percentage":
      return splitPercentage(total, entries ?? []);
    case "equal":
    default:
      return splitEqual(total, participantIds);
  }
}
