/**
 * VAT / GST / sales-tax arithmetic in integer minor units (cents).
 * Half-up rounding via Math.round on positive amounts.
 */

import { fromCents, toCents } from "@/lib/utils/money";

export type VatGstMode = "add" | "remove" | "find-rate";

export const VAT_RATE_CHIPS = [5, 10, 15, 20] as const;
export const VAT_RATE_MIN = 0;
export const VAT_RATE_MAX = 100;

export type VatGstSuccess = {
  ok: true;
  mode: VatGstMode;
  /** Net (ex-tax) in major units after rounding. */
  net: number;
  /** Tax amount in major units after rounding. */
  tax: number;
  /** Gross (inc-tax) in major units after rounding. */
  gross: number;
  /** Effective rate as a percent (0–100+). */
  ratePercent: number;
  /** Optional equal parts that sum exactly to tax (cents-based). */
  split: { partA: number; partB: number } | null;
  /** One-line worked step with plain numbers (UI adds currency). */
  working: string;
};

export type VatGstFailure = {
  ok: false;
  error:
    | "empty"
    | "negative_price"
    | "rate_out_of_range"
    | "invalid"
    | "division_by_zero";
  message: string;
};

export type VatGstResult = VatGstSuccess | VatGstFailure;

/** Half-up to nearest cent for non-negative amounts. */
export function roundMoneyHalfUp(amount: number): number {
  if (!Number.isFinite(amount)) return amount;
  if (amount < 0) {
    // Symmetric half-up away from zero for completeness; callers block negatives.
    return -fromCents(Math.round(Math.abs(amount) * 100));
  }
  return fromCents(Math.round(amount * 100));
}

export function splitTaxEvenly(tax: number): { partA: number; partB: number } {
  const taxCents = toCents(roundMoneyHalfUp(tax));
  const partACents = Math.floor(taxCents / 2);
  const partBCents = taxCents - partACents;
  return {
    partA: fromCents(partACents),
    partB: fromCents(partBCents),
  };
}

function formatPlain(amount: number): string {
  return roundMoneyHalfUp(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRatePlain(rate: number): string {
  const rounded = Math.round(rate * 10000) / 10000;
  const trimmed = Number(rounded.toFixed(4));
  return trimmed.toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
}

function finiteOrFail(values: number[]): boolean {
  return values.every((v) => Number.isFinite(v) && !Object.is(v, Infinity));
}

/**
 * Calculate VAT/GST/sales tax for the selected mode.
 * Rate is a percent (e.g. 18 for 18%). Prices must be ≥ 0 when present.
 */
export function calculateVatGst(input: {
  mode: VatGstMode;
  /** Net price (add / find-rate). */
  net: number | null;
  /** Gross price (remove / find-rate). */
  gross: number | null;
  /** Tax rate percent (add / remove). Ignored for find-rate. */
  ratePercent: number | null;
  splitTax: boolean;
}): VatGstResult {
  const { mode, splitTax } = input;

  if (mode === "add") {
    if (input.net === null || input.ratePercent === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a net price and a tax rate to add tax.",
      };
    }
    if (input.net < 0) {
      return {
        ok: false,
        error: "negative_price",
        message: "Price cannot be negative. Enter zero or a positive amount.",
      };
    }
    if (
      input.ratePercent < VAT_RATE_MIN ||
      input.ratePercent > VAT_RATE_MAX ||
      !Number.isFinite(input.ratePercent)
    ) {
      return {
        ok: false,
        error: "rate_out_of_range",
        message: `Tax rate should be between ${VAT_RATE_MIN}% and ${VAT_RATE_MAX}%.`,
      };
    }

    const net = roundMoneyHalfUp(input.net);
    const tax = roundMoneyHalfUp(net * (input.ratePercent / 100));
    const gross = roundMoneyHalfUp(net + tax);
    if (!finiteOrFail([net, tax, gross])) {
      return {
        ok: false,
        error: "invalid",
        message: "That combination produces a number too large to display.",
      };
    }

    return {
      ok: true,
      mode,
      net,
      tax,
      gross,
      ratePercent: input.ratePercent,
      split: splitTax ? splitTaxEvenly(tax) : null,
      working: `${formatPlain(net)} × ${formatRatePlain(input.ratePercent)}% = ${formatPlain(tax)}; ${formatPlain(net)} + ${formatPlain(tax)} = ${formatPlain(gross)}`,
    };
  }

  if (mode === "remove") {
    if (input.gross === null || input.ratePercent === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a gross (tax-inclusive) price and a tax rate.",
      };
    }
    if (input.gross < 0) {
      return {
        ok: false,
        error: "negative_price",
        message: "Price cannot be negative. Enter zero or a positive amount.",
      };
    }
    if (
      input.ratePercent < VAT_RATE_MIN ||
      input.ratePercent > VAT_RATE_MAX ||
      !Number.isFinite(input.ratePercent)
    ) {
      return {
        ok: false,
        error: "rate_out_of_range",
        message: `Tax rate should be between ${VAT_RATE_MIN}% and ${VAT_RATE_MAX}%.`,
      };
    }

    const factor = 1 + input.ratePercent / 100;
    if (factor === 0) {
      return {
        ok: false,
        error: "division_by_zero",
        message: "That tax rate cannot be used to remove tax from a price.",
      };
    }

    const gross = roundMoneyHalfUp(input.gross);
    const net = roundMoneyHalfUp(gross / factor);
    const tax = roundMoneyHalfUp(gross - net);
    if (!finiteOrFail([net, tax, gross])) {
      return {
        ok: false,
        error: "invalid",
        message: "That combination produces a number too large to display.",
      };
    }

    return {
      ok: true,
      mode,
      net,
      tax,
      gross,
      ratePercent: input.ratePercent,
      split: splitTax ? splitTaxEvenly(tax) : null,
      working: `${formatPlain(gross)} ÷ (1 + ${formatRatePlain(input.ratePercent)}%) = ${formatPlain(net)}; ${formatPlain(gross)} − ${formatPlain(net)} = ${formatPlain(tax)}`,
    };
  }

  // find-rate
  if (input.net === null || input.gross === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a net price and a gross price to find the tax rate.",
    };
  }
  if (input.net < 0 || input.gross < 0) {
    return {
      ok: false,
      error: "negative_price",
      message: "Price cannot be negative. Enter zero or a positive amount.",
    };
  }
  if (input.net === 0) {
    return {
      ok: false,
      error: "division_by_zero",
      message: "Net price must be greater than zero to find a tax rate.",
    };
  }

  const net = roundMoneyHalfUp(input.net);
  const gross = roundMoneyHalfUp(input.gross);
  if (net === 0) {
    return {
      ok: false,
      error: "division_by_zero",
      message: "Net price must be greater than zero to find a tax rate.",
    };
  }

  const rawRate = (gross / net - 1) * 100;
  // Snap float noise (e.g. 14.999999999999991 → 15).
  const ratePercent = Math.round(rawRate * 1e10) / 1e10;
  const tax = roundMoneyHalfUp(gross - net);
  if (!finiteOrFail([net, tax, gross, ratePercent])) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  return {
    ok: true,
    mode,
    net,
    tax,
    gross,
    ratePercent,
    split: splitTax ? splitTaxEvenly(tax) : null,
    working: `(${formatPlain(gross)} ÷ ${formatPlain(net)} − 1) × 100 = ${formatRatePlain(ratePercent)}%`,
  };
}
