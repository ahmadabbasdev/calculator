import { describe, expect, it } from "vitest";
import { fromCents } from "@/lib/utils/money";
import type { StateTaxData } from "@/lib/state-tax/schema";
import { calculateStateIncomeTax } from "@/lib/utils/state-tax";

function flatState(overrides: Partial<StateTaxData> = {}): StateTaxData {
  return {
    code: "ZZ",
    name: "Testland Flat",
    taxYear: 2026,
    structure: "flat",
    wave: null,
    modelFit: "good",
    modelFitReason: "Flat fixture for unit tests.",
    limits: [],
    brackets: {
      single: [{ from: 0, to: null, rate: 0.05 }],
      married_joint: [{ from: 0, to: null, rate: 0.05 }],
      head_of_household: [{ from: 0, to: null, rate: 0.05 }],
    },
    standardDeduction: {
      single: 10000,
      married_joint: 20000,
      head_of_household: 15000,
    },
    personalExemption: null,
    localTaxNote: null,
    notes: [
      { text: "Flat fixture note one.", sourceUrl: "https://example.test/a" },
      { text: "Flat fixture note two.", sourceUrl: "https://example.test/b" },
    ],
    facts: [
      {
        label: "Fixture",
        text: "Flat fixture fact one.",
        sourceUrl: "https://example.test/f1",
      },
      {
        label: "Fixture",
        text: "Flat fixture fact two.",
        sourceUrl: "https://example.test/f2",
      },
      {
        label: "Fixture",
        text: "Flat fixture fact three.",
        sourceUrl: "https://example.test/f3",
      },
      {
        label: "Fixture",
        text: "Flat fixture fact four.",
        sourceUrl: "https://example.test/f4",
      },
    ],
    sources: [{ label: "Testland Revenue", url: "https://example.test" }],
    lastVerified: "2026-01-15",
    verified: false,
    ...overrides,
  };
}

function progressiveState(): StateTaxData {
  return {
    code: "ZZ",
    name: "Testland",
    taxYear: 2026,
    structure: "progressive",
    wave: null,
    modelFit: "good",
    modelFitReason: "Progressive fixture for unit tests.",
    limits: [],
    brackets: {
      single: [
        { from: 0, to: 10000, rate: 0.02 },
        { from: 10000, to: 40000, rate: 0.04 },
        { from: 40000, to: null, rate: 0.06 },
      ],
      married_joint: [
        { from: 0, to: 10000, rate: 0.02 },
        { from: 10000, to: 40000, rate: 0.04 },
        { from: 40000, to: null, rate: 0.06 },
      ],
      head_of_household: [
        { from: 0, to: 10000, rate: 0.02 },
        { from: 10000, to: 40000, rate: 0.04 },
        { from: 40000, to: null, rate: 0.06 },
      ],
    },
    standardDeduction: {
      single: 5000,
      married_joint: 10000,
      head_of_household: 7500,
    },
    personalExemption: null,
    localTaxNote: null,
    notes: [
      { text: "Progressive fixture note one.", sourceUrl: "https://example.test/a" },
      { text: "Progressive fixture note two.", sourceUrl: "https://example.test/b" },
    ],
    facts: [
      {
        label: "Fixture",
        text: "Progressive fixture fact one.",
        sourceUrl: "https://example.test/f1",
      },
      {
        label: "Fixture",
        text: "Progressive fixture fact two.",
        sourceUrl: "https://example.test/f2",
      },
      {
        label: "Fixture",
        text: "Progressive fixture fact three.",
        sourceUrl: "https://example.test/f3",
      },
      {
        label: "Fixture",
        text: "Progressive fixture fact four.",
        sourceUrl: "https://example.test/f4",
      },
    ],
    sources: [{ label: "Testland Revenue", url: "https://example.test" }],
    lastVerified: "2026-01-15",
    verified: false,
  };
}

describe("calculateStateIncomeTax — flat", () => {
  it("flat 5%, deduction 10,000, gross 50,000 → taxable 40,000, tax 2,000, effective 4%", () => {
    const r = calculateStateIncomeTax({
      grossIncome: 50000,
      filingStatus: "single",
      pretaxDeductions: 0,
      state: flatState(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.taxableIncomeCents)).toBe(40000);
    expect(fromCents(r.taxCents)).toBe(2000);
    expect(r.effectiveRate).toBeCloseTo(0.04, 6);
    expect(r.marginalRate).toBe(0.05);
  });
});

describe("calculateStateIncomeTax — progressive", () => {
  it("gross 60,000, deduction 5,000 → tax 2,300.00, effective 3.83%, marginal 6%", () => {
    const r = calculateStateIncomeTax({
      grossIncome: 60000,
      filingStatus: "single",
      pretaxDeductions: 0,
      state: progressiveState(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.taxableIncomeCents)).toBe(55000);
    // 10k*2% + 30k*4% + 15k*6% = 200 + 1200 + 900 = 2300
    expect(fromCents(r.taxCents)).toBe(2300);
    expect(r.effectiveRate).toBeCloseTo(2300 / 60000, 4);
    expect((r.effectiveRate * 100).toFixed(2)).toBe("3.83");
    expect(r.marginalRate).toBe(0.06);
    const sum = r.breakdown.reduce((acc, row) => acc + row.taxCents, 0);
    expect(sum).toBe(r.taxCents);
  });

  it("taxable exactly 10,000 → tax 200.00", () => {
    const r = calculateStateIncomeTax({
      grossIncome: 15000,
      filingStatus: "single",
      pretaxDeductions: 0,
      state: progressiveState(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.taxableIncomeCents)).toBe(10000);
    expect(fromCents(r.taxCents)).toBe(200);
  });

  it("income below the deduction → tax 0", () => {
    const r = calculateStateIncomeTax({
      grossIncome: 4000,
      filingStatus: "single",
      pretaxDeductions: 0,
      state: progressiveState(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.taxableIncomeCents).toBe(0);
    expect(r.taxCents).toBe(0);
  });

  it("pre-tax deductions reduce taxable income", () => {
    const without = calculateStateIncomeTax({
      grossIncome: 60000,
      filingStatus: "single",
      pretaxDeductions: 0,
      state: progressiveState(),
    });
    const withPretax = calculateStateIncomeTax({
      grossIncome: 60000,
      filingStatus: "single",
      pretaxDeductions: 5000,
      state: progressiveState(),
    });
    expect(without.ok && withPretax.ok).toBe(true);
    if (!without.ok || !withPretax.ok) return;
    expect(withPretax.taxableIncomeCents).toBe(without.taxableIncomeCents - 500000);
    expect(withPretax.taxCents).toBeLessThan(without.taxCents);
  });
});
