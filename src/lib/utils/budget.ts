/**
 * Monthly budget helpers — 50/30/20, custom percentages, and own line items.
 * Display rounding only; arithmetic uses full floats then round for output.
 */

export type BudgetMethod = "rule-50-30-20" | "custom" | "own-numbers";

export type BudgetGroupId = "needs" | "wants" | "savings";

export type BudgetLineItem = {
  id: string;
  label: string;
  /** Raw monthly amount; null when empty. */
  amount: number | null;
};

export const RULE_50_30_20 = {
  needs: 50,
  wants: 30,
  savings: 20,
} as const;

export const MAX_ROWS_PER_GROUP = 25;

export const DEFAULT_OWN_LABELS: Record<BudgetGroupId, string[]> = {
  needs: [
    "Rent or mortgage",
    "Utilities",
    "Groceries",
    "Transport",
    "Insurance",
    "Minimum debt payments",
  ],
  wants: [
    "Eating out",
    "Entertainment",
    "Subscriptions",
    "Shopping",
    "Travel",
  ],
  savings: [
    "Emergency fund",
    "Retirement",
    "Other savings",
    "Extra debt payments",
  ],
};

export type BudgetGroupAmounts = {
  needs: number;
  wants: number;
  savings: number;
};

export type BudgetVsTarget = {
  group: BudgetGroupId;
  /** Positive = above the 50/30/20 target amount; negative = below. */
  difference: number;
  targetAmount: number;
};

export type BudgetSuccess = {
  ok: true;
  method: BudgetMethod;
  income: number;
  amounts: BudgetGroupAmounts;
  /** Share of income per group (0–100+). */
  shares: BudgetGroupAmounts;
  totalSpent: number;
  /** Income − totalSpent (positive = left over, negative = short). */
  balance: number;
  vsRule: BudgetVsTarget[];
  working: string;
};

export type BudgetFailure = {
  ok: false;
  error: "empty" | "negative" | "percent_sum" | "invalid";
  message: string;
};

export type BudgetResult = BudgetSuccess | BudgetFailure;

/** Round for display (half up to 2 decimals for money). */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return value;
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100)) / 100;
}

/** Round percent for display (max 2 decimals). */
export function roundPercent(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 100) / 100;
}

function formatPlain(amount: number): string {
  return roundMoney(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function sharesOfIncome(
  amounts: BudgetGroupAmounts,
  income: number,
): BudgetGroupAmounts {
  if (income === 0) {
    return { needs: 0, wants: 0, savings: 0 };
  }
  return {
    needs: roundPercent((amounts.needs / income) * 100),
    wants: roundPercent((amounts.wants / income) * 100),
    savings: roundPercent((amounts.savings / income) * 100),
  };
}

function vsRuleTargets(
  amounts: BudgetGroupAmounts,
  income: number,
): BudgetVsTarget[] {
  const targets = {
    needs: roundMoney(income * (RULE_50_30_20.needs / 100)),
    wants: roundMoney(income * (RULE_50_30_20.wants / 100)),
    savings: roundMoney(income * (RULE_50_30_20.savings / 100)),
  };
  return (["needs", "wants", "savings"] as const).map((group) => ({
    group,
    targetAmount: targets[group],
    difference: roundMoney(amounts[group] - targets[group]),
  }));
}

function sumLineItems(items: BudgetLineItem[]): number | null {
  let total = 0;
  for (const item of items) {
    if (item.amount === null) continue;
    if (!Number.isFinite(item.amount)) return null;
    if (item.amount < 0) return null;
    total += item.amount;
  }
  return total;
}

export function createDefaultOwnItems(): Record<BudgetGroupId, BudgetLineItem[]> {
  let n = 0;
  const nextId = () => {
    n += 1;
    return `row-${n}`;
  };
  return {
    needs: DEFAULT_OWN_LABELS.needs.map((label) => ({
      id: nextId(),
      label,
      amount: null,
    })),
    wants: DEFAULT_OWN_LABELS.wants.map((label) => ({
      id: nextId(),
      label,
      amount: null,
    })),
    savings: DEFAULT_OWN_LABELS.savings.map((label) => ({
      id: nextId(),
      label,
      amount: null,
    })),
  };
}

/**
 * Calculate budget allocations for the selected method.
 */
export function calculateBudget(input: {
  method: BudgetMethod;
  income: number | null;
  customNeeds?: number | null;
  customWants?: number | null;
  customSavings?: number | null;
  ownNeeds?: BudgetLineItem[];
  ownWants?: BudgetLineItem[];
  ownSavings?: BudgetLineItem[];
}): BudgetResult {
  const { method, income } = input;

  if (income === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter your monthly after-tax income to see a budget breakdown.",
    };
  }
  if (!Number.isFinite(income)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a valid monthly income amount.",
    };
  }
  if (income < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Income cannot be negative. Enter zero or a positive amount.",
    };
  }
  if (income === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a monthly after-tax income greater than zero to see results.",
    };
  }

  if (method === "rule-50-30-20") {
    const amounts: BudgetGroupAmounts = {
      needs: roundMoney(income * 0.5),
      wants: roundMoney(income * 0.3),
      savings: roundMoney(income * 0.2),
    };
    // Keep the three parts summing to income after rounding.
    amounts.savings = roundMoney(income - amounts.needs - amounts.wants);
    const totalSpent = roundMoney(
      amounts.needs + amounts.wants + amounts.savings,
    );
    return {
      ok: true,
      method,
      income: roundMoney(income),
      amounts,
      shares: { needs: 50, wants: 30, savings: 20 },
      totalSpent,
      balance: roundMoney(income - totalSpent),
      vsRule: vsRuleTargets(amounts, income),
      working: `${formatPlain(income)} × 50% = ${formatPlain(amounts.needs)}; × 30% = ${formatPlain(amounts.wants)}; × 20% = ${formatPlain(amounts.savings)}`,
    };
  }

  if (method === "custom") {
    const n = input.customNeeds;
    const w = input.customWants;
    const s = input.customSavings;
    if (n == null || w == null || s == null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter three percentages for needs, wants, and savings.",
      };
    }
    if (n < 0 || w < 0 || s < 0) {
      return {
        ok: false,
        error: "negative",
        message: "Percentages cannot be negative.",
      };
    }
    const sum = n + w + s;
    // Allow tiny float drift around 100.
    if (Math.abs(sum - 100) > 0.0001) {
      return {
        ok: false,
        error: "percent_sum",
        message: `Custom percentages must total 100% (currently ${roundPercent(sum)}%).`,
      };
    }
    const amounts: BudgetGroupAmounts = {
      needs: roundMoney(income * (n / 100)),
      wants: roundMoney(income * (w / 100)),
      savings: roundMoney(income * (s / 100)),
    };
    amounts.savings = roundMoney(income - amounts.needs - amounts.wants);
    const totalSpent = roundMoney(
      amounts.needs + amounts.wants + amounts.savings,
    );
    return {
      ok: true,
      method,
      income: roundMoney(income),
      amounts,
      shares: {
        needs: roundPercent(n),
        wants: roundPercent(w),
        savings: roundPercent(s),
      },
      totalSpent,
      balance: roundMoney(income - totalSpent),
      vsRule: vsRuleTargets(amounts, income),
      working: `${formatPlain(income)} × ${roundPercent(n)}% = ${formatPlain(amounts.needs)}; × ${roundPercent(w)}% = ${formatPlain(amounts.wants)}; × ${roundPercent(s)}% = ${formatPlain(amounts.savings)}`,
    };
  }

  // own-numbers
  const needsSum = sumLineItems(input.ownNeeds ?? []);
  const wantsSum = sumLineItems(input.ownWants ?? []);
  const savingsSum = sumLineItems(input.ownSavings ?? []);
  if (needsSum === null || wantsSum === null || savingsSum === null) {
    return {
      ok: false,
      error: "negative",
      message: "Amounts cannot be negative. Leave a row blank or enter zero or more.",
    };
  }

  const amounts: BudgetGroupAmounts = {
    needs: roundMoney(needsSum),
    wants: roundMoney(wantsSum),
    savings: roundMoney(savingsSum),
  };
  const totalSpent = roundMoney(amounts.needs + amounts.wants + amounts.savings);
  if (!Number.isFinite(totalSpent)) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  const balance = roundMoney(income - totalSpent);
  const shares = sharesOfIncome(amounts, income);

  return {
    ok: true,
    method,
    income: roundMoney(income),
    amounts,
    shares,
    totalSpent,
    balance,
    vsRule: vsRuleTargets(amounts, income),
    working: `Needs ${formatPlain(amounts.needs)} + wants ${formatPlain(amounts.wants)} + savings ${formatPlain(amounts.savings)} = ${formatPlain(totalSpent)}; income ${formatPlain(income)} − total ${formatPlain(totalSpent)} = ${formatPlain(balance)}`,
  };
}

export function groupLabel(group: BudgetGroupId): string {
  switch (group) {
    case "needs":
      return "Needs";
    case "wants":
      return "Wants";
    case "savings":
      return "Savings and debt repayment";
  }
}
