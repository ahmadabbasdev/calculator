/**
 * Multi-debt payoff simulation — snowball, avalanche, selected order, and
 * minimums-only. Money math uses integer cents with half-up interest.
 */

import { fromCents, toCents } from "@/lib/utils/money";

export {
  CURRENCY_OPTIONS,
  formatMoney,
  fromCents,
  getCurrency,
  parseDecimal,
  toCents,
  type CurrencyOption,
} from "@/lib/utils/money";

export const MAX_DEBTS = 15;
export const MAX_MONTHS = 1200; // 100 years

export type DebtPayoffStrategyId =
  | "minimums"
  | "snowball"
  | "avalanche"
  | "selected";

export type DebtInput = {
  /** Stable row id for UI ordering. */
  id: string;
  name: string;
  /** Current balance in major units; null/empty rows are ignored. */
  balance: number | null;
  /** Annual percentage rate; blank → 0. */
  aprPercent: number | null;
  minimumPayment: number | null;
};

export type DebtPayoffMonthDebt = {
  debtId: string;
  paymentCents: number;
  interestCents: number;
  balanceAfterCents: number;
};

export type DebtPayoffMonth = {
  month: number;
  debts: DebtPayoffMonthDebt[];
  totalPaymentCents: number;
  totalInterestCents: number;
  totalBalanceAfterCents: number;
};

export type DebtPayoffStrategyResult = {
  strategy: DebtPayoffStrategyId;
  paidOff: boolean;
  months: number;
  totalInterestCents: number;
  totalPaidCents: number;
  /** Month index (1-based) when each debt reaches zero; omitted if never. */
  debtPaidOffMonth: Record<string, number>;
  schedule: DebtPayoffMonth[];
  /** Ending balances when not paid off within the cap. */
  remainingBalanceCents: number;
};

export type DebtPayoffSuccess = {
  ok: true;
  strategies: Record<DebtPayoffStrategyId, DebtPayoffStrategyResult>;
  debtIds: string[];
  debtLabels: Record<string, string>;
  startingBalanceCents: number;
  sumMinimumsCents: number;
  monthlyBudgetCents: number;
  warnings: string[];
};

export type DebtPayoffFailure = {
  ok: false;
  error:
    | "empty"
    | "budget_low"
    | "interest_not_covered"
    | "invalid"
    | "negative";
  message: string;
};

export type DebtPayoffResult = DebtPayoffSuccess | DebtPayoffFailure;

type InternalDebt = {
  id: string;
  name: string;
  balanceCents: number;
  aprPercent: number;
  minPaymentCents: number;
  rowIndex: number;
};

export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  if (value >= 0) return Math.floor(value + 0.5);
  return -Math.floor(-value + 0.5);
}

/** Monthly interest in cents: half-up of balanceCents × APR / 1200. */
export function monthlyInterestCents(
  balanceCents: number,
  aprPercent: number,
): number {
  if (balanceCents <= 0 || aprPercent <= 0) return 0;
  // Integer half-up division: floor((n + 600) / 1200) for non-negative n.
  const n = balanceCents * aprPercent;
  return Math.floor((n + 600) / 1200);
}

function sanitizeDebts(inputs: DebtInput[]): InternalDebt[] | DebtPayoffFailure {
  const debts: InternalDebt[] = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const row = inputs[i]!;
    const balance = row.balance;
    if (balance === null || balance === 0) continue;
    if (!Number.isFinite(balance)) {
      return {
        ok: false,
        error: "invalid",
        message: "Enter a valid balance for each debt you want to include.",
      };
    }
    if (balance < 0) {
      return {
        ok: false,
        error: "negative",
        message: "Balances cannot be negative.",
      };
    }

    let apr = row.aprPercent;
    if (apr === null) apr = 0;
    if (!Number.isFinite(apr) || apr < 0) {
      return {
        ok: false,
        error: "invalid",
        message: "Interest rates cannot be negative. Leave APR blank for 0%.",
      };
    }

    const min = row.minimumPayment;
    if (min === null) {
      return {
        ok: false,
        error: "invalid",
        message: "Enter a minimum monthly payment for each debt with a balance.",
      };
    }
    if (!Number.isFinite(min) || min < 0) {
      return {
        ok: false,
        error: "negative",
        message: "Minimum payments cannot be negative.",
      };
    }

    const balanceCents = toCents(balance);
    if (balanceCents <= 0) continue;

    debts.push({
      id: row.id,
      name: row.name.trim() || `Debt ${debts.length + 1}`,
      balanceCents,
      aprPercent: apr,
      minPaymentCents: toCents(min),
      rowIndex: i,
    });
  }
  return debts;
}

function compareSnowball(a: InternalDebt, b: InternalDebt): number {
  if (a.balanceCents !== b.balanceCents) return a.balanceCents - b.balanceCents;
  return a.rowIndex - b.rowIndex;
}

function compareAvalanche(a: InternalDebt, b: InternalDebt): number {
  if (a.aprPercent !== b.aprPercent) return b.aprPercent - a.aprPercent;
  if (a.balanceCents !== b.balanceCents) return a.balanceCents - b.balanceCents;
  return a.rowIndex - b.rowIndex;
}

/**
 * Priority order for applying leftover payment after minimums.
 * Snowball/avalanche re-rank by current balances each month.
 */
function priorityOrder(
  active: InternalDebt[],
  strategy: DebtPayoffStrategyId,
  selectedOrderIds: string[],
): InternalDebt[] {
  if (strategy === "minimums") return [];
  if (strategy === "selected") {
    const byId = new Map(active.map((d) => [d.id, d]));
    const ordered: InternalDebt[] = [];
    for (const id of selectedOrderIds) {
      const debt = byId.get(id);
      if (debt && debt.balanceCents > 0) ordered.push(debt);
    }
    for (const debt of active) {
      if (debt.balanceCents > 0 && !ordered.some((d) => d.id === debt.id)) {
        ordered.push(debt);
      }
    }
    return ordered;
  }
  const copy = active.filter((d) => d.balanceCents > 0);
  if (strategy === "snowball") copy.sort(compareSnowball);
  else copy.sort(compareAvalanche);
  return copy;
}

function simulateStrategy(
  starting: InternalDebt[],
  monthlyBudgetCents: number,
  strategy: DebtPayoffStrategyId,
  selectedOrderIds: string[],
): DebtPayoffStrategyResult {
  const debts = starting.map((d) => ({ ...d }));
  const debtPaidOffMonth: Record<string, number> = {};
  const schedule: DebtPayoffMonth[] = [];
  let totalInterestCents = 0;
  let totalPaidCents = 0;
  let month = 0;

  while (month < MAX_MONTHS) {
    const active = debts.filter((d) => d.balanceCents > 0);
    if (active.length === 0) break;

    month += 1;

    // 1) Accrue interest
    const interestById = new Map<string, number>();
    for (const debt of active) {
      const interest = monthlyInterestCents(debt.balanceCents, debt.aprPercent);
      debt.balanceCents += interest;
      interestById.set(debt.id, interest);
      totalInterestCents += interest;
    }

    const monthDebts: DebtPayoffMonthDebt[] = [];
    const paymentById = new Map<string, number>();

    if (strategy === "minimums") {
      // Pay only each debt's minimum; freed mins do not roll.
      for (const debt of debts) {
        if (debt.balanceCents <= 0) continue;
        const pay = Math.min(debt.minPaymentCents, debt.balanceCents);
        debt.balanceCents -= pay;
        paymentById.set(debt.id, pay);
        totalPaidCents += pay;
        if (debt.balanceCents === 0 && debtPaidOffMonth[debt.id] === undefined) {
          debtPaidOffMonth[debt.id] = month;
        }
      }
    } else {
      // 2) Pay minimums (capped), tracking remaining budget from the fixed total.
      let remaining = monthlyBudgetCents;
      for (const debt of debts) {
        if (debt.balanceCents <= 0) continue;
        const pay = Math.min(debt.minPaymentCents, debt.balanceCents, remaining);
        debt.balanceCents -= pay;
        remaining -= pay;
        paymentById.set(debt.id, pay);
        totalPaidCents += pay;
        if (debt.balanceCents === 0 && debtPaidOffMonth[debt.id] === undefined) {
          debtPaidOffMonth[debt.id] = month;
        }
      }

      // 3) Apply leftover in priority order (rolling happens automatically because
      // paid-off debts no longer take a minimum next month, and leftover this
      // month continues down the list).
      const order = priorityOrder(debts, strategy, selectedOrderIds);
      for (const debt of order) {
        if (remaining <= 0) break;
        if (debt.balanceCents <= 0) continue;
        const pay = Math.min(remaining, debt.balanceCents);
        debt.balanceCents -= pay;
        remaining -= pay;
        paymentById.set(debt.id, (paymentById.get(debt.id) ?? 0) + pay);
        totalPaidCents += pay;
        if (debt.balanceCents === 0 && debtPaidOffMonth[debt.id] === undefined) {
          debtPaidOffMonth[debt.id] = month;
        }
      }
    }

    let totalPaymentCents = 0;
    let totalInterestMonth = 0;
    let totalBalanceAfter = 0;
    for (const debt of debts) {
      const paymentCents = paymentById.get(debt.id) ?? 0;
      const interestCents = interestById.get(debt.id) ?? 0;
      if (paymentCents > 0 || interestCents > 0 || debt.balanceCents > 0) {
        monthDebts.push({
          debtId: debt.id,
          paymentCents,
          interestCents,
          balanceAfterCents: debt.balanceCents,
        });
      }
      totalPaymentCents += paymentCents;
      totalInterestMonth += interestCents;
      totalBalanceAfter += debt.balanceCents;
    }

    schedule.push({
      month,
      debts: monthDebts,
      totalPaymentCents,
      totalInterestCents: totalInterestMonth,
      totalBalanceAfterCents: totalBalanceAfter,
    });
  }

  const remainingBalanceCents = debts.reduce(
    (sum, d) => sum + Math.max(0, d.balanceCents),
    0,
  );
  const paidOff = remainingBalanceCents === 0;

  return {
    strategy,
    paidOff,
    months: paidOff ? month : MAX_MONTHS,
    totalInterestCents,
    totalPaidCents,
    debtPaidOffMonth,
    schedule,
    remainingBalanceCents,
  };
}

/**
 * Compare four payoff strategies for the given debts and monthly budget.
 */
export function calculateDebtPayoff(input: {
  debts: DebtInput[];
  /** Total monthly amount available for all debt payments. */
  monthlyBudget: number | null;
  /** Row ids in the user's preferred order (for "selected"). */
  selectedOrderIds?: string[];
}): DebtPayoffResult {
  const sanitized = sanitizeDebts(input.debts);
  if (!Array.isArray(sanitized)) return sanitized;

  if (sanitized.length === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Add at least one debt with a balance to see a payoff plan.",
    };
  }

  const budget = input.monthlyBudget;
  if (budget === null) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter the total monthly amount you can put toward debt payments.",
    };
  }
  if (!Number.isFinite(budget)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a valid total monthly payment amount.",
    };
  }
  if (budget < 0) {
    return {
      ok: false,
      error: "negative",
      message: "The total monthly amount cannot be negative.",
    };
  }

  const monthlyBudgetCents = toCents(budget);
  const sumMinimumsCents = sanitized.reduce(
    (sum, d) => sum + d.minPaymentCents,
    0,
  );

  if (monthlyBudgetCents < sumMinimumsCents) {
    return {
      ok: false,
      error: "budget_low",
      message: `The total monthly amount must be at least the sum of the minimums (${fromCents(sumMinimumsCents).toFixed(2)}).`,
    };
  }

  const warnings: string[] = [];
  const uncovered = sanitized.filter(
    (d) =>
      monthlyInterestCents(d.balanceCents, d.aprPercent) > d.minPaymentCents,
  );

  if (uncovered.length > 0) {
    const extra = monthlyBudgetCents - sumMinimumsCents;
    // If there is no spare amount beyond minimums, balances that do not cover
    // interest cannot shrink — surface a clear error (matches hand-checked case).
    if (extra <= 0) {
      return {
        ok: false,
        error: "interest_not_covered",
        message:
          "At least one minimum payment does not cover that debt’s monthly interest, and there is no extra amount in the total to reduce the balance. Raise the minimum or the total monthly amount.",
      };
    }
    warnings.push(
      "At least one minimum payment does not cover that debt’s monthly interest on its own. Extra money in the total monthly amount is needed to bring that balance down.",
    );
  }

  const selectedOrderIds =
    input.selectedOrderIds ?? sanitized.map((d) => d.id);

  const strategies: DebtPayoffStrategyId[] = [
    "minimums",
    "snowball",
    "avalanche",
    "selected",
  ];

  const results = {} as Record<DebtPayoffStrategyId, DebtPayoffStrategyResult>;
  for (const strategy of strategies) {
    results[strategy] = simulateStrategy(
      sanitized,
      monthlyBudgetCents,
      strategy,
      selectedOrderIds,
    );
  }

  const debtLabels: Record<string, string> = {};
  for (const d of sanitized) debtLabels[d.id] = d.name;

  return {
    ok: true,
    strategies: results,
    debtIds: sanitized.map((d) => d.id),
    debtLabels,
    startingBalanceCents: sanitized.reduce((s, d) => s + d.balanceCents, 0),
    sumMinimumsCents,
    monthlyBudgetCents,
    warnings,
  };
}

export function strategyLabel(id: DebtPayoffStrategyId): string {
  switch (id) {
    case "minimums":
      return "Minimums only";
    case "snowball":
      return "Snowball";
    case "avalanche":
      return "Avalanche";
    case "selected":
      return "Selected order";
  }
}

/** Prefix spreadsheet formula-like cells for safe CSV download. */
export function csvSafeCell(value: string | number): string {
  const raw = String(value);
  const needsQuote =
    raw.includes(",") ||
    raw.includes('"') ||
    raw.includes("\n") ||
    raw.includes("\r");
  let cell = raw.replace(/"/g, '""');
  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }
  return needsQuote || cell.startsWith("'") ? `"${cell}"` : cell;
}

export function buildScheduleCsv(
  result: DebtPayoffStrategyResult,
  debtLabels: Record<string, string>,
  debtIds: string[],
): string {
  const header = [
    "Month",
    ...debtIds.flatMap((id) => [
      `${debtLabels[id] ?? id} payment`,
      `${debtLabels[id] ?? id} interest`,
      `${debtLabels[id] ?? id} balance`,
    ]),
    "Total payment",
    "Total interest",
    "Total balance",
  ];
  const lines = [header.map(csvSafeCell).join(",")];
  for (const row of result.schedule) {
    const byId = new Map(row.debts.map((d) => [d.debtId, d]));
    const cells: (string | number)[] = [row.month];
    for (const id of debtIds) {
      const d = byId.get(id);
      cells.push(
        d ? fromCents(d.paymentCents).toFixed(2) : "0.00",
        d ? fromCents(d.interestCents).toFixed(2) : "0.00",
        d ? fromCents(d.balanceAfterCents).toFixed(2) : "0.00",
      );
    }
    cells.push(
      fromCents(row.totalPaymentCents).toFixed(2),
      fromCents(row.totalInterestCents).toFixed(2),
      fromCents(row.totalBalanceAfterCents).toFixed(2),
    );
    lines.push(cells.map(csvSafeCell).join(","));
  }
  return lines.join("\n");
}
