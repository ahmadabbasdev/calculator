import { describe, expect, it } from "vitest";
import { calculateBudget, type BudgetLineItem } from "@/lib/utils/budget";

function items(amounts: number[]): BudgetLineItem[] {
  return amounts.map((amount, index) => ({
    id: `t-${index}`,
    label: `Item ${index}`,
    amount,
  }));
}

describe("calculateBudget — hand-checked cases", () => {
  it("applies 50/30/20 to income 3,000", () => {
    const r = calculateBudget({
      method: "rule-50-30-20",
      income: 3000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.amounts.needs).toBe(1500);
    expect(r.amounts.wants).toBe(900);
    expect(r.amounts.savings).toBe(600);
    expect(r.working).toContain("1,500");
  });

  it("applies custom 60/20/20 to income 2,500", () => {
    const r = calculateBudget({
      method: "custom",
      income: 2500,
      customNeeds: 60,
      customWants: 20,
      customSavings: 20,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.amounts.needs).toBe(1500);
    expect(r.amounts.wants).toBe(500);
    expect(r.amounts.savings).toBe(500);
  });

  it("rejects custom percentages that do not total 100", () => {
    const r = calculateBudget({
      method: "custom",
      income: 2500,
      customNeeds: 60,
      customWants: 30,
      customSavings: 20,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("percent_sum");
  });

  it("summarizes own numbers on income 3,000", () => {
    const r = calculateBudget({
      method: "own-numbers",
      income: 3000,
      ownNeeds: items([1700]),
      ownWants: items([600]),
      ownSavings: items([400]),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.totalSpent).toBe(2700);
    expect(r.balance).toBe(300);
    expect(r.shares.savings).toBe(13.33);
    const needs = r.vsRule.find((v) => v.group === "needs")!;
    const wants = r.vsRule.find((v) => v.group === "wants")!;
    const savings = r.vsRule.find((v) => v.group === "savings")!;
    expect(needs.difference).toBe(200);
    expect(wants.difference).toBe(-300);
    expect(savings.difference).toBe(-200);
  });

  it("reports over-by when spending exceeds income", () => {
    const r = calculateBudget({
      method: "own-numbers",
      income: 3000,
      ownNeeds: items([2000]),
      ownWants: items([800]),
      ownSavings: items([400]),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.totalSpent).toBe(3200);
    expect(r.balance).toBe(-200);
  });

  it("returns empty state for income 0", () => {
    const r = calculateBudget({
      method: "rule-50-30-20",
      income: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("empty");
  });

  it("blocks negative income and negative line amounts", () => {
    const negIncome = calculateBudget({
      method: "rule-50-30-20",
      income: -100,
    });
    expect(negIncome.ok).toBe(false);
    if (!negIncome.ok) expect(negIncome.error).toBe("negative");

    const negLine = calculateBudget({
      method: "own-numbers",
      income: 1000,
      ownNeeds: items([-50]),
      ownWants: items([]),
      ownSavings: items([]),
    });
    expect(negLine.ok).toBe(false);
    if (!negLine.ok) expect(negLine.error).toBe("negative");
  });
});
