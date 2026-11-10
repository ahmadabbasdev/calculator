import { describe, expect, it } from "vitest";
import {
  buildScheduleCsv,
  calculateDebtPayoff,
  csvSafeCell,
  fromCents,
  monthlyInterestCents,
  roundHalfUp,
  toCents,
  type DebtInput,
} from "@/lib/utils/debt-payoff";

function debt(
  id: string,
  balance: number,
  apr: number,
  minimum: number,
  name = id,
): DebtInput {
  return {
    id,
    name,
    balance,
    aprPercent: apr,
    minimumPayment: minimum,
  };
}

describe("debt-payoff — hand-checked cases", () => {
  it("pays off one 1,000 debt at 12% with 100/month in 11 months", () => {
    const r = calculateDebtPayoff({
      debts: [debt("a", 1000, 12, 100)],
      monthlyBudget: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = r.strategies.minimums;
    expect(s.paidOff).toBe(true);
    expect(s.months).toBe(11);
    expect(fromCents(s.totalInterestCents)).toBeCloseTo(58.98, 2);
    expect(fromCents(s.totalPaidCents)).toBeCloseTo(1058.98, 2);
    const last = s.schedule[s.schedule.length - 1]!;
    expect(fromCents(last.totalPaymentCents)).toBeCloseTo(58.98, 2);
    const balances = s.schedule.map((m) =>
      fromCents(m.debts[0]!.balanceAfterCents),
    );
    expect(balances).toEqual([
      910.0, 819.1, 727.29, 634.56, 540.91, 446.32, 350.78, 254.29, 156.83,
      58.4, 0,
    ]);
  });

  it("handles 0% APR with no interest", () => {
    const r = calculateDebtPayoff({
      debts: [debt("z", 600, 0, 100)],
      monthlyBudget: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = r.strategies.minimums;
    expect(s.months).toBe(6);
    expect(s.totalInterestCents).toBe(0);
    expect(s.totalPaidCents).toBe(toCents(600));
  });

  it("applies month-1 snowball and avalanche payments correctly", () => {
    const debts = [
      debt("A", 500, 6, 25, "A"),
      debt("B", 3000, 24, 75, "B"),
    ];
    const r = calculateDebtPayoff({
      debts,
      monthlyBudget: 300,
      selectedOrderIds: ["A", "B"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(monthlyInterestCents(toCents(500), 6)).toBe(250);
    expect(monthlyInterestCents(toCents(3000), 24)).toBe(6000);

    const snow = r.strategies.snowball.schedule[0]!;
    const snowA = snow.debts.find((d) => d.debtId === "A")!;
    const snowB = snow.debts.find((d) => d.debtId === "B")!;
    expect(fromCents(snowA.interestCents)).toBeCloseTo(2.5, 2);
    expect(fromCents(snowB.interestCents)).toBeCloseTo(60, 2);
    expect(fromCents(snowA.paymentCents)).toBeCloseTo(225, 2);
    expect(fromCents(snowA.balanceAfterCents)).toBeCloseTo(277.5, 2);
    expect(fromCents(snowB.paymentCents)).toBeCloseTo(75, 2);
    expect(fromCents(snowB.balanceAfterCents)).toBeCloseTo(2985, 2);

    const av = r.strategies.avalanche.schedule[0]!;
    const avA = av.debts.find((d) => d.debtId === "A")!;
    const avB = av.debts.find((d) => d.debtId === "B")!;
    expect(fromCents(avB.paymentCents)).toBeCloseTo(275, 2);
    expect(fromCents(avB.balanceAfterCents)).toBeCloseTo(2785, 2);
    expect(fromCents(avA.paymentCents)).toBeCloseTo(25, 2);
    expect(fromCents(avA.balanceAfterCents)).toBeCloseTo(477.5, 2);
  });

  it("rejects a total below the sum of minimums", () => {
    const r = calculateDebtPayoff({
      debts: [debt("a", 1000, 10, 100)],
      monthlyBudget: 99,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("budget_low");
  });

  it("flags when a minimum does not cover interest", () => {
    const r = calculateDebtPayoff({
      debts: [debt("a", 10000, 24, 100)],
      monthlyBudget: 100,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("interest_not_covered");
  });

  it("keeps invariants on randomised multi-debt inputs", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const count = 2 + Math.floor(rnd() * 4);
      const debts: DebtInput[] = [];
      let sumMin = 0;
      for (let i = 0; i < count; i += 1) {
        const balance = Math.round((50 + rnd() * 2000) * 100) / 100;
        const apr = Math.round(rnd() * 30 * 100) / 100;
        const minimum = Math.max(
          5,
          Math.round((10 + rnd() * 80) * 100) / 100,
        );
        sumMin += minimum;
        debts.push(debt(`d${i}`, balance, apr, minimum));
      }
      // Ensure budget can cover interest for high-APR cases.
      const budget = Math.round((sumMin + 50 + rnd() * 200) * 100) / 100;
      const r = calculateDebtPayoff({
        debts,
        monthlyBudget: budget,
        selectedOrderIds: debts.map((d) => d.id),
      });
      if (!r.ok) continue;

      for (const strategy of [
        "minimums",
        "snowball",
        "avalanche",
        "selected",
      ] as const) {
        const s = r.strategies[strategy];
        for (const month of s.schedule) {
          expect(month.totalPaymentCents).toBeLessThanOrEqual(
            r.monthlyBudgetCents + 0,
          );
          for (const d of month.debts) {
            expect(d.balanceAfterCents).toBeGreaterThanOrEqual(0);
          }
          if (strategy !== "minimums") {
            expect(month.totalPaymentCents).toBeLessThanOrEqual(
              r.monthlyBudgetCents,
            );
          }
        }
        if (s.paidOff) {
          expect(s.totalPaidCents).toBe(
            r.startingBalanceCents + s.totalInterestCents,
          );
        }
      }

      const snow = r.strategies.snowball;
      const av = r.strategies.avalanche;
      const mins = r.strategies.minimums;
      if (snow.paidOff && av.paidOff) {
        expect(av.totalInterestCents).toBeLessThanOrEqual(
          snow.totalInterestCents,
        );
      }
      if (snow.paidOff && mins.paidOff) {
        expect(snow.totalInterestCents).toBeLessThanOrEqual(
          mins.totalInterestCents,
        );
      }
    }
  });

  it("uses half-up cents and is timezone-independent", () => {
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
    expect(monthlyInterestCents(91000, 12)).toBe(910);
    const before = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";
    const a = calculateDebtPayoff({
      debts: [debt("a", 1000, 12, 100)],
      monthlyBudget: 100,
    });
    process.env.TZ = "America/New_York";
    const b = calculateDebtPayoff({
      debts: [debt("a", 1000, 12, 100)],
      monthlyBudget: 100,
    });
    process.env.TZ = before;
    expect(a).toEqual(b);
  });

  it("escapes CSV formula cells", () => {
    expect(csvSafeCell("=1+1")).toBe('"\'=1+1"');
    expect(csvSafeCell("+cmd")).toBe('"\'+cmd"');
    expect(csvSafeCell("-2")).toBe('"\'-2"');
    expect(csvSafeCell("@sum")).toBe('"\'@sum"');
    expect(csvSafeCell("100.00")).toBe("100.00");
    const r = calculateDebtPayoff({
      debts: [debt("a", 100, 0, 50, "=Evil")],
      monthlyBudget: 50,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const csv = buildScheduleCsv(
      r.strategies.minimums,
      r.debtLabels,
      r.debtIds,
    );
    expect(csv.split("\n")[0]).toContain("'=Evil");
  });
});
