import { describe, expect, it } from "vitest";
import {
  US_STANDARD_CUTOFFS,
  calculateFinalNeeded,
  calculateTestScore,
  calculateWeightedGrade,
  formatGradePercent,
  letterFromPercent,
  roundGradeDisplay,
} from "@/lib/utils/grade";

describe("roundGradeDisplay / formatGradePercent", () => {
  it("rounds to two decimals and avoids -0", () => {
    expect(roundGradeDisplay(77.005)).toBe(77.01);
    expect(formatGradePercent(77)).toBe("77.00");
    expect(formatGradePercent(-0)).toBe("0.00");
  });
});

describe("letterFromPercent — US standard boundaries", () => {
  it("90 gives A and 89.99 gives B", () => {
    expect(letterFromPercent(90, US_STANDARD_CUTOFFS)).toBe("A");
    expect(letterFromPercent(89.99, US_STANDARD_CUTOFFS)).toBe("B");
    expect(letterFromPercent(80, US_STANDARD_CUTOFFS)).toBe("B");
    expect(letterFromPercent(79.99, US_STANDARD_CUTOFFS)).toBe("C");
    expect(letterFromPercent(60, US_STANDARD_CUTOFFS)).toBe("D");
    expect(letterFromPercent(59.99, US_STANDARD_CUTOFFS)).toBe("F");
  });
});

describe("calculateWeightedGrade", () => {
  it("Homework 90 (20), Midterm 80 (30), Final 70 (50) = 77.00%", () => {
    const r = calculateWeightedGrade(
      [
        { name: "Homework", score: 90, weight: 20 },
        { name: "Midterm", score: 80, weight: 30 },
        { name: "Final", score: 70, weight: 50 },
      ],
      US_STANDARD_CUTOFFS,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.average)).toBe("77.00");
    expect(r.letter).toBe("C");
    expect(r.weightsAre100).toBe(true);
    expect(r.weightsTotal).toBe(100);
  });

  it("scores 90 and 80 with weights 20 and 30 = 84.00% on entered weights (total 50)", () => {
    const r = calculateWeightedGrade(
      [
        { score: 90, weight: 20 },
        { score: 80, weight: 30 },
      ],
      US_STANDARD_CUTOFFS,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.average)).toBe("84.00");
    expect(r.weightsTotal).toBe(50);
    expect(r.weightsAre100).toBe(false);
    expect(r.letter).toBe("B");
    expect(r.working).toMatch(/entered weights total/i);
  });

  it("rejects negative scores/weights and zero weight totals", () => {
    expect(
      calculateWeightedGrade([{ score: -1, weight: 10 }], US_STANDARD_CUTOFFS)
        .ok,
    ).toBe(false);
    const zero = calculateWeightedGrade(
      [{ score: 90, weight: 0 }],
      US_STANDARD_CUTOFFS,
    );
    expect(zero.ok).toBe(false);
    if (zero.ok) return;
    expect(zero.error).toBe("no_weights");
  });

  it("allows scores above 100 with an extra-credit flag", () => {
    const r = calculateWeightedGrade(
      [{ score: 110, weight: 100 }],
      US_STANDARD_CUTOFFS,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hasExtraCreditScore).toBe(true);
    expect(formatGradePercent(r.average)).toBe("110.00");
  });

  it("never returns NaN for empty input", () => {
    const r = calculateWeightedGrade([], US_STANDARD_CUTOFFS);
    expect(r.ok).toBe(false);
  });
});

describe("calculateFinalNeeded", () => {
  it("current 85, final weight 40, target 80 = 72.50% needed", () => {
    const r = calculateFinalNeeded({
      currentGrade: 85,
      finalWeightPercent: 40,
      desiredGrade: 80,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kind).toBe("reachable");
    expect(formatGradePercent(r.needed)).toBe("72.50");
  });

  it("current 85, final weight 30, target 70 = 35.00%", () => {
    const r = calculateFinalNeeded({
      currentGrade: 85,
      finalWeightPercent: 30,
      desiredGrade: 70,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.needed)).toBe("35.00");
    expect(r.kind).toBe("reachable");
  });

  it("current 85, final weight 30, target 90 = 101.67% (not reachable)", () => {
    const r = calculateFinalNeeded({
      currentGrade: 85,
      finalWeightPercent: 30,
      desiredGrade: 90,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.needed)).toBe("101.67");
    expect(r.kind).toBe("unreachable");
    expect(r.message).toMatch(/above 100%/i);
  });

  it("current 95, final weight 20, target 70 = already secured (needed −30%)", () => {
    const r = calculateFinalNeeded({
      currentGrade: 95,
      finalWeightPercent: 20,
      desiredGrade: 70,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.needed)).toBe("-30.00");
    expect(r.kind).toBe("already_secured");
    expect(r.message).toMatch(/already secured/i);
    expect(formatGradePercent(r.lowestOverallIfZero!)).toBe("76.00");
  });

  it("rejects zero or >100 final weight", () => {
    const zero = calculateFinalNeeded({
      currentGrade: 80,
      finalWeightPercent: 0,
      desiredGrade: 85,
    });
    expect(zero.ok).toBe(false);
  });
});

describe("calculateTestScore", () => {
  it("42 out of 50 = 84% = B on US standard", () => {
    const r = calculateTestScore({
      pointsEarned: 42,
      pointsPossible: 50,
      cutoffs: US_STANDARD_CUTOFFS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatGradePercent(r.percent)).toBe("84.00");
    expect(r.letter).toBe("B");
  });

  it("rejects zero points possible", () => {
    const r = calculateTestScore({
      pointsEarned: 5,
      pointsPossible: 0,
      cutoffs: US_STANDARD_CUTOFFS,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("zero_possible");
  });
});
