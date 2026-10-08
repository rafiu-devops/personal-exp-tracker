import { describe, expect, it } from "vitest";
import {
  computeShares,
  splitEqual,
  splitExact,
  splitPercentage,
  validateSplit,
} from "./split";

const sum = (results: Array<{ owedAmount: number }>) =>
  results.reduce((acc, r) => acc + r.owedAmount, 0);

describe("splitEqual", () => {
  it("divides evenly when the total is divisible", () => {
    const result = splitEqual(300, ["a", "b", "c"]);
    expect(result).toEqual([
      { personId: "a", owedAmount: 100 },
      { personId: "b", owedAmount: 100 },
      { personId: "c", owedAmount: 100 },
    ]);
  });

  it("distributes the remainder one unit at a time and still sums to the total", () => {
    const result = splitEqual(1000, ["a", "b", "c"]);
    expect(sum(result)).toBe(1000);
    expect(result.map((r) => r.owedAmount)).toEqual([334, 333, 333]);
  });

  it("never loses or gains a rupee across many totals", () => {
    for (let total = 0; total < 200; total += 1) {
      for (const size of [1, 2, 3, 5, 7]) {
        const people = Array.from({ length: size }, (_, i) => `p${i}`);
        expect(sum(splitEqual(total, people))).toBe(total);
      }
    }
  });

  it("returns an empty array without participants", () => {
    expect(splitEqual(500, [])).toEqual([]);
  });
});

describe("splitExact", () => {
  it("uses the entered amounts", () => {
    const result = splitExact(900, [
      { personId: "a", value: 500 },
      { personId: "b", value: 400 },
    ]);
    expect(result).toEqual([
      { personId: "a", owedAmount: 500 },
      { personId: "b", owedAmount: 400 },
    ]);
  });

  it("absorbs rounding drift on the last participant", () => {
    const result = splitExact(100, [
      { personId: "a", value: 33.3 },
      { personId: "b", value: 33.3 },
      { personId: "c", value: 33.3 },
    ]);
    expect(sum(result)).toBe(100);
  });
});

describe("splitPercentage", () => {
  it("splits by percentage and sums to the total", () => {
    const result = splitPercentage(1000, [
      { personId: "a", value: 50 },
      { personId: "b", value: 30 },
      { personId: "c", value: 20 },
    ]);
    expect(result).toEqual([
      { personId: "a", owedAmount: 500 },
      { personId: "b", owedAmount: 300 },
      { personId: "c", owedAmount: 200 },
    ]);
  });

  it("hands leftover units to the largest fractional remainders", () => {
    const result = splitPercentage(100, [
      { personId: "a", value: 33.33 },
      { personId: "b", value: 33.33 },
      { personId: "c", value: 33.34 },
    ]);
    expect(sum(result)).toBe(100);
  });
});

describe("validateSplit", () => {
  it("rejects totals below one", () => {
    expect(validateSplit(0, "equal", ["a", "b"]).valid).toBe(false);
  });

  it("requires at least two participants", () => {
    expect(validateSplit(100, "equal", ["a"]).valid).toBe(false);
  });

  it("flags exact entries that do not sum to the total", () => {
    const result = validateSplit(100, "exact", ["a", "b"], [
      { personId: "a", value: 40 },
      { personId: "b", value: 50 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("add up to 100");
  });

  it("flags percentages that do not total 100", () => {
    const result = validateSplit(100, "percentage", ["a", "b"], [
      { personId: "a", value: 40 },
      { personId: "b", value: 50 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("accepts a valid equal split", () => {
    expect(validateSplit(100, "equal", ["a", "b"]).valid).toBe(true);
  });
});

describe("computeShares", () => {
  it("routes to the correct strategy", () => {
    expect(computeShares(100, "equal", ["a", "b"])).toEqual([
      { personId: "a", owedAmount: 50 },
      { personId: "b", owedAmount: 50 },
    ]);
    expect(
      computeShares(100, "exact", ["a", "b"], [
        { personId: "a", value: 70 },
        { personId: "b", value: 30 },
      ])
    ).toEqual([
      { personId: "a", owedAmount: 70 },
      { personId: "b", owedAmount: 30 },
    ]);
  });
});
