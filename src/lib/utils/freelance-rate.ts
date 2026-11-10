/**
 * Freelance rate helpers — find hourly rate from income goal, or take-home
 * from a rate. Display rounding only; arithmetic uses full floats.
 */

export type FreelanceMode = "find-rate" | "take-home";

export type ExpensePeriod = "monthly" | "yearly";

export type FreelanceFindRateSuccess = {
  ok: true;
  mode: "find-rate";
  weeksWorked: number;
  billableHours: number;
  revenueNeeded: number;
  revenueWithBuffer: number;
  hourlyRate: number;
  annualRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  projectQuote: number | null;
  working: string;
};

export type FreelanceTakeHomeSuccess = {
  ok: true;
  mode: "take-home";
  weeksWorked: number;
  billableHours: number;
  annualRevenue: number;
  profit: number;
  takeHome: number;
  taxOnProfit: number;
  isLoss: boolean;
  working: string;
};

export type FreelanceFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid"
    | "negative"
    | "weeks_off"
    | "hours"
    | "tax"
    | "fee";
  message: string;
};

export type FreelanceResult =
  | FreelanceFindRateSuccess
  | FreelanceTakeHomeSuccess
  | FreelanceFailure;

/** Round half-up to `digits` decimal places (display / money). */
export function roundMoney(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** digits;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function annualExpenses(
  expenses: number,
  period: ExpensePeriod,
): number {
  return period === "monthly" ? expenses * 12 : expenses;
}

function weeksAndHours(
  weeksOff: number,
  billableHoursPerWeek: number,
):
  | { ok: true; weeksWorked: number; billableHours: number }
  | FreelanceFailure {
  if (!Number.isFinite(weeksOff) || weeksOff < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter zero or a positive number of weeks off.",
    };
  }
  if (weeksOff >= 52) {
    return {
      ok: false,
      error: "weeks_off",
      message:
        "Weeks off must be less than 52 so there are billable weeks left in the year.",
    };
  }
  if (!Number.isFinite(billableHoursPerWeek) || billableHoursPerWeek <= 0) {
    return {
      ok: false,
      error: "hours",
      message: "Billable hours per week must be greater than zero.",
    };
  }
  const weeksWorked = 52 - weeksOff;
  const billableHours = billableHoursPerWeek * weeksWorked;
  if (!Number.isFinite(billableHours) || billableHours <= 0) {
    return {
      ok: false,
      error: "hours",
      message: "Billable hours per year must be greater than zero.",
    };
  }
  return { ok: true, weeksWorked, billableHours };
}

function validateRates(
  taxRatePercent: number,
  platformFeePercent: number,
): FreelanceFailure | null {
  if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a tax rate of zero or more.",
    };
  }
  if (taxRatePercent >= 100) {
    return {
      ok: false,
      error: "tax",
      message: "Tax rate must be below 100%.",
    };
  }
  if (!Number.isFinite(platformFeePercent) || platformFeePercent < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a platform fee of zero or more.",
    };
  }
  if (platformFeePercent >= 100) {
    return {
      ok: false,
      error: "fee",
      message: "Platform fee must be below 100%.",
    };
  }
  return null;
}

/**
 * Mode 1: required hourly rate from take-home goal and costs.
 */
export function calculateFindRate(input: {
  takeHome: number | null;
  expenses: number | null;
  expensePeriod: ExpensePeriod;
  taxRatePercent: number | null;
  weeksOff: number | null;
  billableHoursPerWeek: number | null;
  platformFeePercent: number | null;
  bufferPercent: number | null;
  projectHours: number | null;
  revisionBufferPercent: number | null;
}): FreelanceResult {
  const {
    takeHome,
    expenses,
    expensePeriod,
    taxRatePercent,
    weeksOff,
    billableHoursPerWeek,
    platformFeePercent,
    bufferPercent,
    projectHours,
    revisionBufferPercent,
  } = input;

  if (
    takeHome === null ||
    expenses === null ||
    taxRatePercent === null ||
    weeksOff === null ||
    billableHoursPerWeek === null
  ) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter take-home income, expenses, tax rate, weeks off, and billable hours to see a rate.",
    };
  }

  if (
    !Number.isFinite(takeHome) ||
    !Number.isFinite(expenses) ||
    !Number.isFinite(taxRatePercent) ||
    !Number.isFinite(weeksOff) ||
    !Number.isFinite(billableHoursPerWeek)
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for each required field.",
    };
  }

  if (takeHome < 0 || expenses < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Take-home income and expenses cannot be negative.",
    };
  }

  const fee = platformFeePercent ?? 0;
  const buffer = bufferPercent ?? 0;
  const rateCheck = validateRates(taxRatePercent, fee);
  if (rateCheck) return rateCheck;

  if (!Number.isFinite(buffer) || buffer < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Profit buffer must be zero or more.",
    };
  }

  const hours = weeksAndHours(weeksOff, billableHoursPerWeek);
  if (!hours.ok) return hours;

  const tax = taxRatePercent / 100;
  const feeFrac = fee / 100;
  const bufferFrac = buffer / 100;
  const expenseYear = annualExpenses(expenses, expensePeriod);

  const preTaxNeeded = takeHome / (1 - tax);
  const revenueNeeded = (preTaxNeeded + expenseYear) / (1 - feeFrac);
  const revenueWithBuffer = revenueNeeded * (1 + bufferFrac);
  const hourlyRate = revenueWithBuffer / hours.billableHours;

  if (
    !Number.isFinite(revenueNeeded) ||
    !Number.isFinite(revenueWithBuffer) ||
    !Number.isFinite(hourlyRate)
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  let projectQuote: number | null = null;
  if (projectHours !== null) {
    if (!Number.isFinite(projectHours) || projectHours < 0) {
      return {
        ok: false,
        error: "invalid",
        message: "Project hours must be zero or more.",
      };
    }
    const rev =
      revisionBufferPercent === null || revisionBufferPercent === undefined
        ? 0
        : revisionBufferPercent;
    if (!Number.isFinite(rev) || rev < 0) {
      return {
        ok: false,
        error: "invalid",
        message: "Revision buffer must be zero or more.",
      };
    }
    projectQuote = hourlyRate * projectHours * (1 + rev / 100);
  }

  const annualRevenue = revenueWithBuffer;
  const monthlyRevenue = annualRevenue / 12;
  const weeklyRevenue = annualRevenue / hours.weeksWorked;

  return {
    ok: true,
    mode: "find-rate",
    weeksWorked: hours.weeksWorked,
    billableHours: hours.billableHours,
    revenueNeeded,
    revenueWithBuffer,
    hourlyRate,
    annualRevenue,
    monthlyRevenue,
    weeklyRevenue,
    projectQuote,
    working: `${roundMoney(takeHome).toLocaleString("en-US")} take-home → ${roundMoney(revenueWithBuffer).toLocaleString("en-US")} revenue ÷ ${hours.billableHours.toLocaleString("en-US")} billable hours = ${roundMoney(hourlyRate).toLocaleString("en-US")} / hour`,
  };
}

/**
 * Mode 2: estimated take-home from an hourly rate and the same cost/hours model.
 * Buffer is not used.
 */
export function calculateTakeHome(input: {
  hourlyRate: number | null;
  expenses: number | null;
  expensePeriod: ExpensePeriod;
  taxRatePercent: number | null;
  weeksOff: number | null;
  billableHoursPerWeek: number | null;
  platformFeePercent: number | null;
}): FreelanceResult {
  const {
    hourlyRate,
    expenses,
    expensePeriod,
    taxRatePercent,
    weeksOff,
    billableHoursPerWeek,
    platformFeePercent,
  } = input;

  if (
    hourlyRate === null ||
    expenses === null ||
    taxRatePercent === null ||
    weeksOff === null ||
    billableHoursPerWeek === null
  ) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter an hourly rate, expenses, tax rate, weeks off, and billable hours to see take-home.",
    };
  }

  if (
    !Number.isFinite(hourlyRate) ||
    !Number.isFinite(expenses) ||
    !Number.isFinite(taxRatePercent) ||
    !Number.isFinite(weeksOff) ||
    !Number.isFinite(billableHoursPerWeek)
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for each required field.",
    };
  }

  if (hourlyRate < 0 || expenses < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Hourly rate and expenses cannot be negative.",
    };
  }

  const fee = platformFeePercent ?? 0;
  const rateCheck = validateRates(taxRatePercent, fee);
  if (rateCheck) return rateCheck;

  const hours = weeksAndHours(weeksOff, billableHoursPerWeek);
  if (!hours.ok) return hours;

  const tax = taxRatePercent / 100;
  const feeFrac = fee / 100;
  const expenseYear = annualExpenses(expenses, expensePeriod);

  const annualRevenue = hourlyRate * hours.billableHours;
  const afterFee = annualRevenue * (1 - feeFrac);
  const profit = afterFee - expenseYear;
  const isLoss = profit < 0;
  const taxOnProfit = isLoss ? 0 : profit * tax;
  const takeHome = isLoss ? profit : profit * (1 - tax);

  if (
    !Number.isFinite(annualRevenue) ||
    !Number.isFinite(profit) ||
    !Number.isFinite(takeHome)
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  return {
    ok: true,
    mode: "take-home",
    weeksWorked: hours.weeksWorked,
    billableHours: hours.billableHours,
    annualRevenue,
    profit,
    takeHome,
    taxOnProfit,
    isLoss,
    working: isLoss
      ? `${roundMoney(hourlyRate).toLocaleString("en-US")}/hr × ${hours.billableHours.toLocaleString("en-US")} hours − costs = ${roundMoney(profit).toLocaleString("en-US")} (loss)`
      : `${roundMoney(hourlyRate).toLocaleString("en-US")}/hr × ${hours.billableHours.toLocaleString("en-US")} hours → ${roundMoney(takeHome).toLocaleString("en-US")} take-home`,
  };
}

/** Project quote from an unrounded (or raw) hourly rate. */
export function projectQuoteFromRate(
  hourlyRate: number,
  projectHours: number,
  revisionBufferPercent = 0,
): number {
  return roundMoney(
    hourlyRate * projectHours * (1 + revisionBufferPercent / 100),
  );
}

export function calculateFreelanceRate(input: {
  mode: FreelanceMode;
  takeHome?: number | null;
  hourlyRate?: number | null;
  expenses: number | null;
  expensePeriod: ExpensePeriod;
  taxRatePercent: number | null;
  weeksOff: number | null;
  billableHoursPerWeek: number | null;
  platformFeePercent?: number | null;
  bufferPercent?: number | null;
  projectHours?: number | null;
  revisionBufferPercent?: number | null;
}): FreelanceResult {
  if (input.mode === "find-rate") {
    return calculateFindRate({
      takeHome: input.takeHome ?? null,
      expenses: input.expenses,
      expensePeriod: input.expensePeriod,
      taxRatePercent: input.taxRatePercent,
      weeksOff: input.weeksOff,
      billableHoursPerWeek: input.billableHoursPerWeek,
      platformFeePercent: input.platformFeePercent ?? null,
      bufferPercent: input.bufferPercent ?? null,
      projectHours: input.projectHours ?? null,
      revisionBufferPercent: input.revisionBufferPercent ?? null,
    });
  }
  return calculateTakeHome({
    hourlyRate: input.hourlyRate ?? null,
    expenses: input.expenses,
    expensePeriod: input.expensePeriod,
    taxRatePercent: input.taxRatePercent,
    weeksOff: input.weeksOff,
    billableHoursPerWeek: input.billableHoursPerWeek,
    platformFeePercent: input.platformFeePercent ?? null,
  });
}
