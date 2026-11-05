/**
 * Pure state income tax estimates (state tax only).
 * Money math uses integer cents so bracket rows sum to the total.
 */

import { fromCents, toCents } from "@/lib/utils/money";
import {
  personalExemptionForStatus,
  type FilingStatus,
  type StateTaxData,
  type TaxBracket,
} from "@/lib/state-tax/schema";

export type StateTaxInput = {
  grossIncome: number | null;
  filingStatus: FilingStatus;
  pretaxDeductions: number | null;
  state: StateTaxData;
};

export type BracketBreakdownRow = {
  from: number;
  to: number | null;
  rate: number;
  taxableInBracketCents: number;
  taxCents: number;
};

export type StateTaxSuccess = {
  ok: true;
  grossIncomeCents: number;
  pretaxDeductionsCents: number;
  standardDeductionCents: number;
  personalExemptionCents: number;
  taxableIncomeCents: number;
  taxCents: number;
  effectiveRate: number;
  marginalRate: number;
  takeHomeAfterStateTaxCents: number;
  breakdown: BracketBreakdownRow[];
  working: string;
};

export type StateTaxFailure = {
  ok: false;
  error: "empty" | "negative" | "none_structure" | "invalid";
  message: string;
};

export type StateTaxResult = StateTaxSuccess | StateTaxFailure;

function assertMoney(value: number | null, label: string): StateTaxFailure | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) {
    return { ok: false, error: "invalid", message: `Enter a valid ${label}.` };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: `${label} cannot be negative.`,
    };
  }
  return null;
}

function formatMajor(cents: number): string {
  return fromCents(cents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Apply progressive (or flat) brackets to taxable income in cents.
 */
export function taxFromBracketsCents(
  taxableIncomeCents: number,
  brackets: TaxBracket[],
): { taxCents: number; marginalRate: number; breakdown: BracketBreakdownRow[] } {
  const taxable = Math.max(0, Math.floor(taxableIncomeCents));
  let taxCents = 0;
  let marginalRate = brackets[0]?.rate ?? 0;
  const breakdown: BracketBreakdownRow[] = [];

  for (const bracket of brackets) {
    const fromCents = toCents(bracket.from);
    const toCentsExclusive =
      bracket.to === null ? Number.POSITIVE_INFINITY : toCents(bracket.to);
    if (taxable <= fromCents) {
      breakdown.push({
        from: bracket.from,
        to: bracket.to,
        rate: bracket.rate,
        taxableInBracketCents: 0,
        taxCents: 0,
      });
      continue;
    }
    const upper = Math.min(taxable, toCentsExclusive);
    const amountInBracket = Math.max(0, upper - fromCents);
    const rowTax = Math.round(amountInBracket * bracket.rate);
    taxCents += rowTax;
    if (amountInBracket > 0) {
      marginalRate = bracket.rate;
    }
    breakdown.push({
      from: bracket.from,
      to: bracket.to,
      rate: bracket.rate,
      taxableInBracketCents: amountInBracket,
      taxCents: rowTax,
    });
  }

  return { taxCents, marginalRate, breakdown };
}

export function calculateStateIncomeTax(input: StateTaxInput): StateTaxResult {
  if (input.state.structure === "none") {
    return {
      ok: false,
      error: "none_structure",
      message: `${input.state.name} has no state income tax in the verified data.`,
    };
  }

  if (input.grossIncome === null) {
    return { ok: false, error: "empty", message: "" };
  }

  const grossErr = assertMoney(input.grossIncome, "gross income");
  if (grossErr) return grossErr;
  const pretaxErr = assertMoney(input.pretaxDeductions, "pre-tax deductions");
  if (pretaxErr) return pretaxErr;

  const grossIncomeCents = toCents(input.grossIncome);
  const pretaxDeductionsCents = toCents(input.pretaxDeductions ?? 0);
  const standardDeductionCents = toCents(
    input.state.standardDeduction[input.filingStatus],
  );
  const personalExemptionCents = toCents(
    personalExemptionForStatus(input.state, input.filingStatus),
  );

  const taxableIncomeCents = Math.max(
    0,
    grossIncomeCents -
      pretaxDeductionsCents -
      standardDeductionCents -
      personalExemptionCents,
  );

  const brackets = input.state.brackets[input.filingStatus];
  const { taxCents, marginalRate, breakdown } = taxFromBracketsCents(
    taxableIncomeCents,
    brackets,
  );

  const takeHomeAfterStateTaxCents = Math.max(0, grossIncomeCents - taxCents);
  const effectiveRate =
    grossIncomeCents === 0 ? 0 : taxCents / grossIncomeCents;

  const working =
    taxableIncomeCents === 0
      ? "Taxable income is 0 after deductions, so state tax is 0.00."
      : `Taxable ${formatMajor(taxableIncomeCents)}; state tax ${formatMajor(taxCents)}.`;

  return {
    ok: true,
    grossIncomeCents,
    pretaxDeductionsCents,
    standardDeductionCents,
    personalExemptionCents,
    taxableIncomeCents,
    taxCents,
    effectiveRate,
    marginalRate,
    takeHomeAfterStateTaxCents,
    breakdown,
    working,
  };
}

/** Worked examples used on state pages (single filer). */
export const STATE_TAX_EXAMPLE_GROSS = [40_000, 80_000, 150_000] as const;

export function computeWorkedExamples(state: StateTaxData) {
  return STATE_TAX_EXAMPLE_GROSS.map((gross) => {
    const result = calculateStateIncomeTax({
      grossIncome: gross,
      filingStatus: "single",
      pretaxDeductions: 0,
      state,
    });
    return { gross, result };
  });
}
