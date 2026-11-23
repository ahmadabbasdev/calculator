/**
 * Profit margin and markup arithmetic in integer minor units (cents).
 * Half-up rounding via Math.round. Percents display to two decimal places.
 */

import { fromCents } from "@/lib/utils/money";

export type ProfitMarginMode =
  | "from-cost-price"
  | "price-from-margin"
  | "price-from-markup"
  | "cost-from-margin";

export type ProfitMarginSuccess = {
  ok: true;
  mode: ProfitMarginMode;
  cost: number;
  price: number;
  profit: number;
  /** Margin percent: profit ÷ price × 100 (or profit ÷ selling price after fees use price). */
  marginPercent: number;
  /** Markup percent: profit ÷ cost × 100. */
  markupPercent: number;
  /** Selling price after marketplace/payment fees, when fees are applied. */
  netRevenue: number | null;
  units: number | null;
  totalRevenue: number | null;
  totalCost: number | null;
  totalProfit: number | null;
  working: string;
};

export type ProfitMarginFailure = {
  ok: false;
  error:
    | "empty"
    | "negative"
    | "margin_too_high"
    | "margin_undefined"
    | "zero_cost"
    | "invalid";
  message: string;
};

export type ProfitMarginResult = ProfitMarginSuccess | ProfitMarginFailure;

export type MarginMarkupConversionSuccess = {
  ok: true;
  marginPercent: number;
  markupPercent: number;
  working: string;
};

export type MarginMarkupConversionFailure = {
  ok: false;
  error: "empty" | "negative" | "margin_too_high" | "markup_invalid" | "invalid";
  message: string;
};

export type MarginMarkupConversionResult =
  | MarginMarkupConversionSuccess
  | MarginMarkupConversionFailure;

/** Half-up to nearest cent; symmetric for negatives (losses). */
export function roundMoneyHalfUp(amount: number): number {
  if (!Number.isFinite(amount)) return amount;
  if (amount < 0) {
    return -fromCents(Math.round(Math.abs(amount) * 100));
  }
  return fromCents(Math.round(amount * 100));
}

/** Half-up to two decimal places for percent figures. */
export function roundPercentHalfUp(percent: number): number {
  if (!Number.isFinite(percent)) return percent;
  if (percent < 0) {
    return -Math.round(Math.abs(percent) * 100) / 100;
  }
  return Math.round(percent * 100) / 100;
}

function formatPlain(amount: number): string {
  return roundMoneyHalfUp(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercentPlain(percent: number): string {
  return roundPercentHalfUp(percent).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function finiteOrFail(values: number[]): boolean {
  return values.every((v) => Number.isFinite(v) && !Object.is(v, Infinity));
}

function negativeMessage(field: string): ProfitMarginFailure {
  return {
    ok: false,
    error: "negative",
    message: `${field} cannot be negative. Enter zero or a positive amount.`,
  };
}

function marginTooHighMessage(): ProfitMarginFailure {
  return {
    ok: false,
    error: "margin_too_high",
    message:
      "A margin of 100% or more cannot be used to find a price or cost. Enter a margin below 100%.",
  };
}

/**
 * markup% = margin% ÷ (1 − margin%) × 100, with margin as a percent 0–100 (exclusive of 100).
 */
export function marginToMarkup(
  marginPercent: number | null,
): MarginMarkupConversionResult {
  if (marginPercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a margin percent to convert to markup.",
    };
  }
  if (!Number.isFinite(marginPercent)) {
    return {
      ok: false,
      error: "invalid",
      message: "That margin produces a number too large to display.",
    };
  }
  if (marginPercent < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Margin cannot be negative for this conversion. Enter zero or a positive percent.",
    };
  }
  if (marginPercent >= 100) {
    return {
      ok: false,
      error: "margin_too_high",
      message:
        "A margin of 100% or more has no finite markup. Enter a margin below 100%.",
    };
  }

  const marginFraction = marginPercent / 100;
  const markupPercent = roundPercentHalfUp(
    (marginFraction / (1 - marginFraction)) * 100,
  );
  if (!finiteOrFail([markupPercent])) {
    return {
      ok: false,
      error: "invalid",
      message: "That margin produces a number too large to display.",
    };
  }

  return {
    ok: true,
    marginPercent: roundPercentHalfUp(marginPercent),
    markupPercent,
    working: `${formatPercentPlain(marginPercent)}% ÷ (1 − ${formatPercentPlain(marginPercent)}%) = ${formatPercentPlain(markupPercent)}% markup`,
  };
}

/**
 * margin% = markup% ÷ (1 + markup%) × 100.
 */
export function markupToMargin(
  markupPercent: number | null,
): MarginMarkupConversionResult {
  if (markupPercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a markup percent to convert to margin.",
    };
  }
  if (!Number.isFinite(markupPercent)) {
    return {
      ok: false,
      error: "invalid",
      message: "That markup produces a number too large to display.",
    };
  }
  if (markupPercent < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Markup cannot be negative for this conversion. Enter zero or a positive percent.",
    };
  }
  if (markupPercent === -100 || 1 + markupPercent / 100 === 0) {
    return {
      ok: false,
      error: "markup_invalid",
      message: "That markup cannot be converted to a margin.",
    };
  }

  const markupFraction = markupPercent / 100;
  const marginPercent = roundPercentHalfUp(
    (markupFraction / (1 + markupFraction)) * 100,
  );
  if (!finiteOrFail([marginPercent])) {
    return {
      ok: false,
      error: "invalid",
      message: "That markup produces a number too large to display.",
    };
  }

  return {
    ok: true,
    marginPercent,
    markupPercent: roundPercentHalfUp(markupPercent),
    working: `${formatPercentPlain(markupPercent)}% ÷ (1 + ${formatPercentPlain(markupPercent)}%) = ${formatPercentPlain(marginPercent)}% margin`,
  };
}

function applyFeesAndUnits(args: {
  mode: ProfitMarginMode;
  cost: number;
  price: number;
  feePercent: number;
  fixedFee: number;
  units: number | null;
  working: string;
}): ProfitMarginResult {
  const { mode, cost, price, feePercent, fixedFee, units, working } = args;

  if (price === 0) {
    return {
      ok: false,
      error: "margin_undefined",
      message: "Margin is undefined when the selling price is zero.",
    };
  }

  const hasFees = feePercent !== 0 || fixedFee !== 0;
  const netRevenue = hasFees
    ? roundMoneyHalfUp(price * (1 - feePercent / 100) - fixedFee)
    : null;
  const revenueBase = netRevenue ?? price;
  const profit = roundMoneyHalfUp(revenueBase - cost);

  const marginPercent = roundPercentHalfUp((profit / price) * 100);

  let markupPercent: number;
  if (cost === 0) {
    if (profit === 0) {
      markupPercent = 0;
    } else {
      return {
        ok: false,
        error: "zero_cost",
        message:
          "Markup is undefined when cost is zero and profit is not zero. Enter a cost greater than zero.",
      };
    }
  } else {
    markupPercent = roundPercentHalfUp((profit / cost) * 100);
  }

  let totalRevenue: number | null = null;
  let totalCost: number | null = null;
  let totalProfit: number | null = null;

  if (units !== null) {
    const unitRevenue = netRevenue ?? price;
    totalRevenue = roundMoneyHalfUp(unitRevenue * units);
    totalCost = roundMoneyHalfUp(cost * units);
    totalProfit = roundMoneyHalfUp(profit * units);
  }

  const check = [
    cost,
    price,
    profit,
    marginPercent,
    markupPercent,
    ...(netRevenue !== null ? [netRevenue] : []),
    ...(totalRevenue !== null
      ? [totalRevenue, totalCost!, totalProfit!]
      : []),
  ];
  if (!finiteOrFail(check)) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  return {
    ok: true,
    mode,
    cost,
    price,
    profit,
    marginPercent,
    markupPercent,
    netRevenue,
    units,
    totalRevenue,
    totalCost,
    totalProfit,
    working,
  };
}

function normalizeOptionalFees(
  feePercent: number | null,
  fixedFee: number | null,
):
  | { ok: true; feePercent: number; fixedFee: number }
  | ProfitMarginFailure {
  const fee = feePercent ?? 0;
  const fixed = fixedFee ?? 0;
  if (fee < 0) return negativeMessage("Fee percent");
  if (fixed < 0) return negativeMessage("Fixed fee");
  if (!Number.isFinite(fee) || !Number.isFinite(fixed)) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }
  if (fee > 100) {
    return {
      ok: false,
      error: "invalid",
      message: "Fee percent should be between 0% and 100%.",
    };
  }
  return { ok: true, feePercent: fee, fixedFee: fixed };
}

function normalizeOptionalUnits(
  units: number | null,
): { ok: true; units: number | null } | ProfitMarginFailure {
  if (units === null) return { ok: true, units: null };
  if (units < 0) return negativeMessage("Units sold");
  if (units === 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Units sold must be greater than zero when provided.",
    };
  }
  if (!Number.isFinite(units)) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }
  return { ok: true, units };
}

/**
 * Calculate profit, margin and markup for the selected mode.
 * Optional fees: net revenue = price × (1 − fee%) − fixed fee; profit = net revenue − cost.
 * Margin uses profit ÷ price; markup uses profit ÷ cost.
 */
export function calculateProfitMargin(input: {
  mode: ProfitMarginMode;
  cost: number | null;
  price: number | null;
  marginPercent: number | null;
  markupPercent: number | null;
  units: number | null;
  feePercent: number | null;
  fixedFee: number | null;
}): ProfitMarginResult {
  const fees = normalizeOptionalFees(input.feePercent, input.fixedFee);
  if (!fees.ok) return fees;
  const unitsResult = normalizeOptionalUnits(input.units);
  if (!unitsResult.ok) return unitsResult;
  const { feePercent, fixedFee } = fees;
  const { units } = unitsResult;

  if (input.mode === "from-cost-price") {
    if (input.cost === null || input.price === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a cost and a selling price.",
      };
    }
    if (input.cost < 0) return negativeMessage("Cost");
    if (input.price < 0) return negativeMessage("Price");

    const cost = roundMoneyHalfUp(input.cost);
    const price = roundMoneyHalfUp(input.price);
    const hasFees = feePercent !== 0 || fixedFee !== 0;
    const working = hasFees
      ? `${formatPlain(price)} × (1 − ${formatPercentPlain(feePercent)}%) − ${formatPlain(fixedFee)} = net; net − ${formatPlain(cost)} = profit`
      : `${formatPlain(price)} − ${formatPlain(cost)} = profit; margin = profit ÷ ${formatPlain(price)}; markup = profit ÷ ${formatPlain(cost)}`;

    return applyFeesAndUnits({
      mode: input.mode,
      cost,
      price,
      feePercent,
      fixedFee,
      units,
      working,
    });
  }

  if (input.mode === "price-from-margin") {
    if (input.cost === null || input.marginPercent === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a cost and a target margin percent.",
      };
    }
    if (input.cost < 0) return negativeMessage("Cost");
    if (input.marginPercent < 0) return negativeMessage("Margin");
    if (input.marginPercent >= 100) return marginTooHighMessage();

    const cost = roundMoneyHalfUp(input.cost);
    const marginFraction = input.marginPercent / 100;
    const price = roundMoneyHalfUp(cost / (1 - marginFraction));
    const working = `${formatPlain(cost)} ÷ (1 − ${formatPercentPlain(input.marginPercent)}%) = ${formatPlain(price)}`;

    return applyFeesAndUnits({
      mode: input.mode,
      cost,
      price,
      feePercent,
      fixedFee,
      units,
      working,
    });
  }

  if (input.mode === "price-from-markup") {
    if (input.cost === null || input.markupPercent === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a cost and a target markup percent.",
      };
    }
    if (input.cost < 0) return negativeMessage("Cost");
    if (input.markupPercent < 0) return negativeMessage("Markup");

    const cost = roundMoneyHalfUp(input.cost);
    const price = roundMoneyHalfUp(cost * (1 + input.markupPercent / 100));
    const working = `${formatPlain(cost)} × (1 + ${formatPercentPlain(input.markupPercent)}%) = ${formatPlain(price)}`;

    return applyFeesAndUnits({
      mode: input.mode,
      cost,
      price,
      feePercent,
      fixedFee,
      units,
      working,
    });
  }

  // cost-from-margin
  if (input.price === null || input.marginPercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a selling price and a margin percent.",
    };
  }
  if (input.price < 0) return negativeMessage("Price");
  if (input.marginPercent < 0) return negativeMessage("Margin");
  if (input.marginPercent >= 100) return marginTooHighMessage();

  const price = roundMoneyHalfUp(input.price);
  if (price === 0) {
    return {
      ok: false,
      error: "margin_undefined",
      message: "Margin is undefined when the selling price is zero.",
    };
  }

  const marginFraction = input.marginPercent / 100;
  const cost = roundMoneyHalfUp(price * (1 - marginFraction));
  const working = `${formatPlain(price)} × (1 − ${formatPercentPlain(input.marginPercent)}%) = ${formatPlain(cost)}`;

  return applyFeesAndUnits({
    mode: "cost-from-margin",
    cost,
    price,
    feePercent,
    fixedFee,
    units,
    working,
  });
}
