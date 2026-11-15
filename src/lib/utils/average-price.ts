/**
 * Weighted average purchase price (cost basis arithmetic).
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

export const MAX_PURCHASE_ROWS = 50;
export const QUANTITY_DISPLAY_DIGITS = 8;

export type PurchaseInput = {
  /** Optional label or date — ignored by math. */
  label?: string;
  quantity: number | null;
  price: number | null;
  /** Optional; treated as 0 when null and fees are included. */
  fee: number | null;
};

export type AveragePriceErrorCode =
  | "empty"
  | "invalid"
  | "negative"
  | "nonfinite"
  | "zero_quantity"
  | "unreachable";

export type AveragePriceFailure = {
  ok: false;
  error: AveragePriceErrorCode;
  message: string;
};

export type AveragePriceBreakdown = {
  totalQuantity: number;
  totalCost: number;
  averagePrice: number;
  working: string;
};

export type BuyMoreResult = {
  extraQuantity: number;
  extraPrice: number;
  extraCost: number;
  totalQuantity: number;
  totalCost: number;
  averagePrice: number;
  working: string;
};

export type TargetPriceResult =
  | {
      ok: true;
      targetAverage: number;
      extraQuantity: number;
      requiredPrice: number;
      working: string;
    }
  | {
      ok: false;
      error: AveragePriceErrorCode;
      message: string;
    };

export type MarkResult = {
  currentPrice: number;
  marketValue: number;
  difference: number;
  percentVsCost: number;
  working: string;
};

export type AveragePriceSuccess = {
  ok: true;
  includeFees: boolean;
  base: AveragePriceBreakdown;
  buyMore: BuyMoreResult | null;
  target: TargetPriceResult | null;
  mark: MarkResult | null;
};

export type AveragePriceResult = AveragePriceSuccess | AveragePriceFailure;

export type AveragePriceInput = {
  rows: PurchaseInput[];
  includeFees: boolean;
  buyMoreQuantity: number | null;
  buyMorePrice: number | null;
  targetAverage: number | null;
  targetExtraQuantity: number | null;
  currentPrice: number | null;
};

function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function rejectNegative(
  value: number,
  label: string,
): AveragePriceFailure | null {
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "nonfinite",
      message: `${label} must be a finite number.`,
    };
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

/**
 * Row contribution: quantity × price (+ fee when includeFees).
 * Returns null when the row is ignored (missing fields or zero quantity).
 */
export function rowContribution(
  row: PurchaseInput,
  includeFees: boolean,
):
  | { quantity: number; cost: number }
  | { skip: true }
  | { error: AveragePriceFailure } {
  const hasQuantity = row.quantity !== null;
  const hasPrice = row.price !== null;
  if (!hasQuantity && !hasPrice && row.fee === null) {
    return { skip: true };
  }
  if (!hasQuantity || !hasPrice) {
    return {
      error: {
        ok: false,
        error: "empty",
        message: "Each used purchase row needs both quantity and price per unit.",
      },
    };
  }

  const quantity = row.quantity!;
  const price = row.price!;
  const qErr = rejectNegative(quantity, "Quantity");
  if (qErr) return { error: qErr };
  const pErr = rejectNegative(price, "Price per unit");
  if (pErr) return { error: pErr };

  if (quantity === 0) {
    return { skip: true };
  }

  let fee = 0;
  if (includeFees) {
    if (row.fee === null) {
      fee = 0;
    } else {
      const fErr = rejectNegative(row.fee, "Fee");
      if (fErr) return { error: fErr };
      fee = row.fee;
    }
  }

  const cost = quantity * price + fee;
  if (!Number.isFinite(cost)) {
    return {
      error: {
        ok: false,
        error: "nonfinite",
        message: "A purchase row produced a non-finite cost.",
      },
    };
  }
  return { quantity, cost };
}

export function weightedAverageFromRows(
  rows: PurchaseInput[],
  includeFees: boolean,
): AveragePriceBreakdown | AveragePriceFailure {
  if (rows.length === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Add at least one purchase with quantity and price.",
    };
  }
  if (rows.length > MAX_PURCHASE_ROWS) {
    return {
      ok: false,
      error: "invalid",
      message: `You can enter up to ${MAX_PURCHASE_ROWS} purchases.`,
    };
  }

  let totalQuantity = 0;
  let totalCost = 0;
  let used = 0;

  for (const row of rows) {
    const contrib = rowContribution(row, includeFees);
    if ("error" in contrib) return contrib.error;
    if ("skip" in contrib) continue;
    totalQuantity += contrib.quantity;
    totalCost += contrib.cost;
    used += 1;
  }

  if (used === 0 || totalQuantity === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Enter quantity and price for at least one purchase.",
    };
  }

  const averagePrice = totalCost / totalQuantity;
  if (!Number.isFinite(averagePrice)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Average price is not a finite number.",
    };
  }

  const feeNote = includeFees ? " including fees" : "";
  return {
    totalQuantity,
    totalCost,
    averagePrice,
    working: `${used} purchase${used === 1 ? "" : "s"}${feeNote}: total cost ${formatNum(totalCost, 2)} ÷ quantity ${formatNum(totalQuantity, QUANTITY_DISPLAY_DIGITS)} = average ${formatNum(averagePrice, 2)} per unit.`,
  };
}

export function applyBuyMore(
  base: AveragePriceBreakdown,
  extraQuantity: number,
  extraPrice: number,
): BuyMoreResult | AveragePriceFailure {
  const qErr = rejectNegative(extraQuantity, "Extra quantity");
  if (qErr) return qErr;
  const pErr = rejectNegative(extraPrice, "Extra price");
  if (pErr) return pErr;
  if (extraQuantity === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Extra quantity must be greater than zero.",
    };
  }

  const extraCost = extraQuantity * extraPrice;
  const totalQuantity = base.totalQuantity + extraQuantity;
  const totalCost = base.totalCost + extraCost;
  const averagePrice = totalCost / totalQuantity;
  if (!Number.isFinite(averagePrice) || !Number.isFinite(totalCost)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Buy-more calculation produced a non-finite result.",
    };
  }

  return {
    extraQuantity,
    extraPrice,
    extraCost,
    totalQuantity,
    totalCost,
    averagePrice,
    working: `After ${formatNum(extraQuantity, QUANTITY_DISPLAY_DIGITS)} more at ${formatNum(extraPrice, 2)}: total cost ${formatNum(totalCost, 2)} ÷ ${formatNum(totalQuantity, QUANTITY_DISPLAY_DIGITS)} = ${formatNum(averagePrice, 2)} per unit.`,
  };
}

/**
 * requiredPrice = (target × (quantity + extra) − totalCost) ÷ extra
 */
export function requiredPriceForTarget(
  base: AveragePriceBreakdown,
  targetAverage: number,
  extraQuantity: number,
): TargetPriceResult {
  if (targetAverage === null || extraQuantity === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a target average and an extra quantity.",
    };
  }
  const tErr = rejectNegative(targetAverage, "Target average");
  if (tErr) {
    return { ok: false, error: tErr.error, message: tErr.message };
  }
  const qErr = rejectNegative(extraQuantity, "Extra quantity for target");
  if (qErr) {
    return { ok: false, error: qErr.error, message: qErr.message };
  }
  if (extraQuantity === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Extra quantity for the target must be greater than zero.",
    };
  }

  const requiredPrice =
    (targetAverage * (base.totalQuantity + extraQuantity) - base.totalCost) /
    extraQuantity;

  if (!Number.isFinite(requiredPrice)) {
    return {
      ok: false,
      error: "invalid",
      message: "The required price is not a finite number.",
    };
  }

  if (requiredPrice <= 0) {
    return {
      ok: false,
      error: "unreachable",
      message:
        "That target average cannot be reached with this extra quantity. The required price would be zero or negative — use a higher target, a larger extra quantity, or different purchase figures.",
    };
  }

  return {
    ok: true,
    targetAverage,
    extraQuantity,
    requiredPrice,
    working: `Required price = (${formatNum(targetAverage, 2)} × (${formatNum(base.totalQuantity, QUANTITY_DISPLAY_DIGITS)} + ${formatNum(extraQuantity, QUANTITY_DISPLAY_DIGITS)}) − ${formatNum(base.totalCost, 2)}) ÷ ${formatNum(extraQuantity, QUANTITY_DISPLAY_DIGITS)} = ${formatNum(requiredPrice, 2)}.`,
  };
}

export function markToMarket(
  base: AveragePriceBreakdown,
  currentPrice: number,
): MarkResult | AveragePriceFailure {
  const pErr = rejectNegative(currentPrice, "Current price");
  if (pErr) return pErr;

  const marketValue = base.totalQuantity * currentPrice;
  const difference = marketValue - base.totalCost;
  const percentVsCost =
    base.totalCost === 0 ? 0 : (difference / base.totalCost) * 100;

  if (
    !Number.isFinite(marketValue) ||
    !Number.isFinite(difference) ||
    !Number.isFinite(percentVsCost)
  ) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Current-price comparison produced a non-finite result.",
    };
  }

  const sign =
    difference > 0 ? "above cost" : difference < 0 ? "below cost" : "equal to cost";

  return {
    currentPrice,
    marketValue,
    difference,
    percentVsCost,
    working: `At ${formatNum(currentPrice, 2)} per unit, value ${formatNum(marketValue, 2)} is ${formatNum(Math.abs(difference), 2)} ${sign} (${formatNum(percentVsCost, 2)}% vs cost).`,
  };
}

function isAveragePriceFailure(
  value: AveragePriceBreakdown | AveragePriceFailure | BuyMoreResult | MarkResult,
): value is AveragePriceFailure {
  return "ok" in value && value.ok === false;
}

/**
 * Full average-price calculation from purchase rows and optional scenarios.
 */
export function calculateAveragePrice(
  input: AveragePriceInput,
): AveragePriceResult {
  const baseResult = weightedAverageFromRows(input.rows, input.includeFees);
  if (isAveragePriceFailure(baseResult)) return baseResult;
  const base: AveragePriceBreakdown = baseResult;

  let buyMore: BuyMoreResult | null = null;
  if (input.buyMoreQuantity !== null && input.buyMorePrice !== null) {
    const more = applyBuyMore(
      base,
      input.buyMoreQuantity,
      input.buyMorePrice,
    );
    if (isAveragePriceFailure(more)) return more;
    buyMore = more;
  }

  let target: TargetPriceResult | null = null;
  if (input.targetAverage !== null && input.targetExtraQuantity !== null) {
    target = requiredPriceForTarget(
      base,
      input.targetAverage,
      input.targetExtraQuantity,
    );
  }

  let mark: MarkResult | null = null;
  if (input.currentPrice !== null) {
    const m = markToMarket(base, input.currentPrice);
    if (isAveragePriceFailure(m)) return m;
    mark = m;
  }

  return {
    ok: true,
    includeFees: input.includeFees,
    base,
    buyMore,
    target,
    mark,
  };
}

/** Build a reference row from the same weighted-average function. */
export function averagePriceReferenceRow(
  rows: PurchaseInput[],
  includeFees: boolean,
): AveragePriceBreakdown & { includeFees: boolean } {
  const result = weightedAverageFromRows(rows, includeFees);
  if (isAveragePriceFailure(result)) {
    return {
      includeFees,
      totalQuantity: 0,
      totalCost: 0,
      averagePrice: 0,
      working: result.message,
    };
  }
  return { includeFees, ...result };
}
