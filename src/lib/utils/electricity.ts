/**
 * Appliance electricity use and cost estimates, plus optional tiered billing.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

export const DEFAULT_DAYS_PER_MONTH = 30;
export const DEFAULT_QUANTITY = 1;
export const DEFAULT_DUTY_PERCENT = 100;
export const MAX_BILL_APPLIANCES = 30;
export const DEFAULT_BILL_ROW_LABELS = [
  "Fan",
  "Light",
  "Fridge",
  "TV",
  "Air conditioner",
] as const;

export type ElectricityMode = "appliance" | "bill";
export type PowerInputMode = "watts" | "amps-volts";
export type TierMethod = "incremental" | "whole";

export type ElectricityErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite"
  | "percent"
  | "tiers";

export type ApplianceUsageInput = {
  watts: number | null;
  quantity: number | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
  dutyPercent: number | null;
  standbyWatts: number | null;
  standbyHoursPerDay: number | null;
};

export type BillApplianceRow = {
  label: string;
  watts: number | null;
  quantity: number | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
  dutyPercent: number | null;
};

export type TierRow = {
  /** Inclusive upper bound in kWh (units). Null = open-ended last tier. */
  upToUnits: number | null;
  pricePerUnit: number | null;
};

export type SingleApplianceInput = {
  mode: "appliance";
  powerMode: PowerInputMode;
  watts: number | null;
  amps: number | null;
  volts: number | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
  quantity: number | null;
  dutyPercent: number | null;
  standbyWatts: number | null;
  standbyHoursPerDay: number | null;
  pricePerKwh: number | null;
};

export type BillListInput = {
  mode: "bill";
  appliances: BillApplianceRow[];
  pricePerKwh: number | null;
  useTiers: boolean;
  tiers: TierRow[];
  tierMethod: TierMethod;
  fixedCharge: number | null;
  taxPercent: number | null;
};

export type ElectricityInput = SingleApplianceInput | BillListInput;

export type SingleApplianceSuccess = {
  ok: true;
  mode: "appliance";
  watts: number;
  kwhPerDay: number;
  kwhPerMonth: number;
  kwhPerYear: number;
  costPerHour: number | null;
  costPerDay: number | null;
  costPerMonth: number | null;
  costPerYear: number | null;
  pricePerKwh: number | null;
  working: string;
};

export type BillApplianceShare = {
  label: string;
  kwhPerMonth: number;
  sharePercent: number;
};

export type BillSuccess = {
  ok: true;
  mode: "bill";
  totalKwhPerMonth: number;
  flatEnergyCost: number | null;
  energyCharge: number | null;
  fixedCharge: number;
  taxAmount: number;
  totalBill: number | null;
  pricePerKwh: number | null;
  useTiers: boolean;
  tierMethod: TierMethod | null;
  shares: BillApplianceShare[];
  working: string;
};

export type ElectricityFailure = {
  ok: false;
  error: ElectricityErrorCode;
  message: string;
};

export type ElectricityResult =
  | SingleApplianceSuccess
  | BillSuccess
  | ElectricityFailure;

function emptyResult(message: string): ElectricityFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(
  message: string,
  error: ElectricityErrorCode = "invalid",
): ElectricityFailure {
  return { ok: false, error, message };
}

function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Watts from amps × volts. */
export function wattsFromAmpsVolts(amps: number, volts: number): number {
  return amps * volts;
}

/**
 * Monthly (or period) kWh from running load.
 * kWh = watts × quantity × hoursPerDay × days × (dutyPercent/100) ÷ 1000
 */
export function runningKwh(options: {
  watts: number;
  quantity: number;
  hoursPerDay: number;
  days: number;
  dutyPercent: number;
}): number {
  return (
    (options.watts *
      options.quantity *
      options.hoursPerDay *
      options.days *
      (options.dutyPercent / 100)) /
    1000
  );
}

/** Standby kWh = standbyWatts × standbyHoursPerDay × days ÷ 1000 */
export function standbyKwh(options: {
  standbyWatts: number;
  standbyHoursPerDay: number;
  days: number;
}): number {
  return (
    (options.standbyWatts * options.standbyHoursPerDay * options.days) / 1000
  );
}

export function costFromKwh(kwh: number, pricePerKwh: number): number {
  return kwh * pricePerKwh;
}

function requireNonNegative(
  value: number,
  label: string,
): ElectricityFailure | null {
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
 * Incremental (slab) charge: each tier's price applies only inside that tier.
 * Whole-bill: the price of the tier the total falls in applies to all units.
 * Tier "up to X" is inclusive. Last tier may be open-ended (upToUnits null).
 */
export function calculateTieredCharge(options: {
  units: number;
  tiers: { upToUnits: number | null; pricePerUnit: number }[];
  method: TierMethod;
}):
  | { ok: true; charge: number; appliedPrice: number | null }
  | { ok: false; error: ElectricityErrorCode; message: string } {
  const { units, tiers, method } = options;

  if (!Number.isFinite(units)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Usage must be a finite number.",
    };
  }
  if (units < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Usage cannot be negative.",
    };
  }
  if (tiers.length === 0) {
    return {
      ok: false,
      error: "tiers",
      message: "Add at least one billing tier.",
    };
  }

  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i]!;
    if (!Number.isFinite(tier.pricePerUnit) || tier.pricePerUnit < 0) {
      return {
        ok: false,
        error: tier.pricePerUnit < 0 ? "negative" : "nonfinite",
        message: "Each tier needs a non-negative price per unit.",
      };
    }
    const isLast = i === tiers.length - 1;
    if (!isLast) {
      if (tier.upToUnits === null || !Number.isFinite(tier.upToUnits)) {
        return {
          ok: false,
          error: "tiers",
          message: "Only the last tier can be open-ended.",
        };
      }
      if (tier.upToUnits <= 0) {
        return {
          ok: false,
          error: "tiers",
          message: "Tier limits must be greater than zero.",
        };
      }
    } else if (tier.upToUnits !== null) {
      if (!Number.isFinite(tier.upToUnits) || tier.upToUnits <= 0) {
        return {
          ok: false,
          error: "tiers",
          message: "Tier limits must be greater than zero.",
        };
      }
    }
  }

  // Ascending finite bounds among closed tiers (and last if finite)
  const bounds: number[] = [];
  for (let i = 0; i < tiers.length; i += 1) {
    const upTo = tiers[i]!.upToUnits;
    if (upTo === null) {
      if (i !== tiers.length - 1) {
        return {
          ok: false,
          error: "tiers",
          message: "Only the last tier can be open-ended.",
        };
      }
      continue;
    }
    bounds.push(upTo);
  }
  for (let i = 1; i < bounds.length; i += 1) {
    if (bounds[i]! <= bounds[i - 1]!) {
      return {
        ok: false,
        error: "tiers",
        message: "Tier limits must be ascending (each “up to” higher than the last).",
      };
    }
  }

  if (units === 0) {
    return { ok: true, charge: 0, appliedPrice: null };
  }

  if (method === "whole") {
    let appliedPrice: number | null = null;
    let previous = 0;
    for (let i = 0; i < tiers.length; i += 1) {
      const tier = tiers[i]!;
      const upper = tier.upToUnits;
      if (upper === null || units <= upper) {
        appliedPrice = tier.pricePerUnit;
        break;
      }
      previous = upper;
      void previous;
    }
    if (appliedPrice === null) {
      return {
        ok: false,
        error: "tiers",
        message: "Usage is above the last closed tier. Make the last tier open-ended.",
      };
    }
    const charge = units * appliedPrice;
    if (!Number.isFinite(charge)) {
      return {
        ok: false,
        error: "invalid",
        message: "Tier calculation produced a non-finite result.",
      };
    }
    return { ok: true, charge, appliedPrice };
  }

  // Incremental
  let charge = 0;
  let previousBound = 0;
  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i]!;
    if (units <= previousBound) break;
    const upper = tier.upToUnits;
    const sliceEnd = upper === null ? units : Math.min(units, upper);
    const slice = sliceEnd - previousBound;
    if (slice > 0) {
      charge += slice * tier.pricePerUnit;
    }
    if (upper === null) break;
    previousBound = upper;
  }

  if (tiers[tiers.length - 1]!.upToUnits !== null && units > previousBound) {
    return {
      ok: false,
      error: "tiers",
      message: "Usage is above the last closed tier. Make the last tier open-ended.",
    };
  }

  if (!Number.isFinite(charge)) {
    return {
      ok: false,
      error: "invalid",
      message: "Tier calculation produced a non-finite result.",
    };
  }
  return { ok: true, charge, appliedPrice: null };
}

/**
 * Estimate single-appliance use/cost or a multi-appliance bill with optional tiers.
 */
export function calculateElectricity(
  input: ElectricityInput,
): ElectricityResult {
  if (input.mode === "appliance") {
    return calculateSingleAppliance(input);
  }
  return calculateBill(input);
}

function resolveWatts(input: SingleApplianceInput):
  | { ok: true; watts: number }
  | { ok: false; failure: ElectricityFailure } {
  if (input.powerMode === "amps-volts") {
    if (input.amps === null || input.volts === null) {
      return {
        ok: false,
        failure: emptyResult("Enter amps and volts to get watts."),
      };
    }
    const aErr = requireNonNegative(input.amps, "Amps");
    if (aErr) return { ok: false, failure: aErr };
    const vErr = requireNonNegative(input.volts, "Volts");
    if (vErr) return { ok: false, failure: vErr };
    if (input.amps === 0 || input.volts === 0) {
      return {
        ok: false,
        failure: {
          ok: false,
          error: "zero",
          message: "Amps and volts must be greater than zero.",
        },
      };
    }
    const watts = wattsFromAmpsVolts(input.amps, input.volts);
    if (!Number.isFinite(watts)) {
      return {
        ok: false,
        failure: invalidResult("Amps × volts produced a non-finite result."),
      };
    }
    return { ok: true, watts };
  }

  if (input.watts === null) {
    return {
      ok: false,
      failure: emptyResult("Enter power in watts, or switch to amps × volts."),
    };
  }
  const err = requireNonNegative(input.watts, "Watts");
  if (err) return { ok: false, failure: err };
  if (input.watts === 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "zero",
        message: "Watts must be greater than zero.",
      },
    };
  }
  return { ok: true, watts: input.watts };
}

function calculateSingleAppliance(
  input: SingleApplianceInput,
): ElectricityResult {
  const wattsResolved = resolveWatts(input);
  if (!wattsResolved.ok) return wattsResolved.failure;

  if (input.hoursPerDay === null) {
    return emptyResult("Enter hours per day.");
  }
  const hoursErr = requireNonNegative(input.hoursPerDay, "Hours per day");
  if (hoursErr) return hoursErr;

  const days =
    input.daysPerMonth === null || !Number.isFinite(input.daysPerMonth)
      ? DEFAULT_DAYS_PER_MONTH
      : input.daysPerMonth;
  const daysErr = requireNonNegative(days, "Days per month");
  if (daysErr) return daysErr;
  if (days === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Days per month must be greater than zero.",
    };
  }

  const quantity =
    input.quantity === null || !Number.isFinite(input.quantity)
      ? DEFAULT_QUANTITY
      : input.quantity;
  const qtyErr = requireNonNegative(quantity, "Quantity");
  if (qtyErr) return qtyErr;
  if (quantity === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Quantity must be greater than zero.",
    };
  }

  const duty =
    input.dutyPercent === null || !Number.isFinite(input.dutyPercent)
      ? DEFAULT_DUTY_PERCENT
      : input.dutyPercent;
  if (duty < 0 || duty > 100) {
    return {
      ok: false,
      error: "percent",
      message: "% of time drawing full power must be between 0 and 100.",
    };
  }

  const standbyWatts =
    input.standbyWatts === null || !Number.isFinite(input.standbyWatts)
      ? 0
      : input.standbyWatts;
  const standbyHours =
    input.standbyHoursPerDay === null ||
    !Number.isFinite(input.standbyHoursPerDay)
      ? 0
      : input.standbyHoursPerDay;
  const swErr = requireNonNegative(standbyWatts, "Standby watts");
  if (swErr) return swErr;
  const shErr = requireNonNegative(standbyHours, "Standby hours per day");
  if (shErr) return shErr;

  if (
    input.pricePerKwh !== null &&
    (!Number.isFinite(input.pricePerKwh) || input.pricePerKwh < 0)
  ) {
    return {
      ok: false,
      error: input.pricePerKwh < 0 ? "negative" : "nonfinite",
      message: "Price per kWh cannot be negative.",
    };
  }

  const runDay = runningKwh({
    watts: wattsResolved.watts,
    quantity,
    hoursPerDay: input.hoursPerDay,
    days: 1,
    dutyPercent: duty,
  });
  const standbyDay = standbyKwh({
    standbyWatts,
    standbyHoursPerDay: standbyHours,
    days: 1,
  });
  const kwhPerDay = runDay + standbyDay;
  const kwhPerMonth = kwhPerDay * days;
  const kwhPerYear = kwhPerMonth * 12;

  if (
    !Number.isFinite(kwhPerDay) ||
    !Number.isFinite(kwhPerMonth) ||
    !Number.isFinite(kwhPerYear)
  ) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const price = input.pricePerKwh;
  const hasPrice = price !== null && Number.isFinite(price);
  const costPerDay = hasPrice ? costFromKwh(kwhPerDay, price!) : null;
  const costPerMonth = hasPrice ? costFromKwh(kwhPerMonth, price!) : null;
  const costPerYear = hasPrice ? costFromKwh(kwhPerYear, price!) : null;
  // Cost for one hour of active draw at the entered duty and quantity
  const costPerHourSimple = hasPrice
    ? (wattsResolved.watts * quantity * (duty / 100) * price!) / 1000
    : null;

  const workingParts = [
    `${formatNum(wattsResolved.watts, 2)} W × ${formatNum(quantity, 0)} × ${formatNum(input.hoursPerDay, 2)} h/day × ${formatNum(duty, 1)}% ÷ 1000 = ${formatNum(runDay, 4)} kWh/day running`,
  ];
  if (standbyWatts > 0 && standbyHours > 0) {
    workingParts.push(
      `standby ${formatNum(standbyWatts, 2)} W × ${formatNum(standbyHours, 2)} h = ${formatNum(standbyDay, 4)} kWh/day`,
    );
  }
  workingParts.push(
    `month ${formatNum(kwhPerMonth, 2)} kWh (${formatNum(days, 0)} days)`,
  );
  if (hasPrice) {
    workingParts.push(
      `× ${formatNum(price!, 4)} /kWh → ${formatNum(costPerMonth!, 2)} /month`,
    );
  }

  return {
    ok: true,
    mode: "appliance",
    watts: wattsResolved.watts,
    kwhPerDay,
    kwhPerMonth,
    kwhPerYear,
    costPerHour: costPerHourSimple,
    costPerDay,
    costPerMonth,
    costPerYear,
    pricePerKwh: hasPrice ? price! : null,
    working: workingParts.join("; ") + ".",
  };
}

function rowMonthlyKwh(row: BillApplianceRow):
  | { ok: true; kwh: number; label: string }
  | { ok: false; failure: ElectricityFailure }
  | { ok: true; kwh: 0; label: string; skip: true } {
  const hasAny =
    row.watts !== null ||
    row.hoursPerDay !== null ||
    (row.quantity !== null && row.quantity !== DEFAULT_QUANTITY) ||
    (row.daysPerMonth !== null &&
      row.daysPerMonth !== DEFAULT_DAYS_PER_MONTH) ||
    (row.dutyPercent !== null && row.dutyPercent !== DEFAULT_DUTY_PERCENT);

  if (!hasAny && row.label.trim() !== "") {
    // Label-only empty row — skip
    return { ok: true, kwh: 0, label: row.label, skip: true };
  }
  if (!hasAny) {
    return { ok: true, kwh: 0, label: row.label || "Appliance", skip: true };
  }

  if (row.watts === null || row.hoursPerDay === null) {
    return {
      ok: false,
      failure: emptyResult(
        "Each filled appliance row needs watts and hours per day.",
      ),
    };
  }

  const wattsErr = requireNonNegative(row.watts, "Watts");
  if (wattsErr) return { ok: false, failure: wattsErr };
  const hoursErr = requireNonNegative(row.hoursPerDay, "Hours per day");
  if (hoursErr) return { ok: false, failure: hoursErr };

  const quantity =
    row.quantity === null || !Number.isFinite(row.quantity)
      ? DEFAULT_QUANTITY
      : row.quantity;
  const qtyErr = requireNonNegative(quantity, "Quantity");
  if (qtyErr) return { ok: false, failure: qtyErr };

  const days =
    row.daysPerMonth === null || !Number.isFinite(row.daysPerMonth)
      ? DEFAULT_DAYS_PER_MONTH
      : row.daysPerMonth;
  const daysErr = requireNonNegative(days, "Days per month");
  if (daysErr) return { ok: false, failure: daysErr };
  if (days === 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "zero",
        message: "Days per month must be greater than zero.",
      },
    };
  }

  const duty =
    row.dutyPercent === null || !Number.isFinite(row.dutyPercent)
      ? DEFAULT_DUTY_PERCENT
      : row.dutyPercent;
  if (duty < 0 || duty > 100) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "percent",
        message: "% of time must be between 0 and 100.",
      },
    };
  }

  if (row.watts === 0 || quantity === 0 || row.hoursPerDay === 0) {
    return {
      ok: true,
      kwh: 0,
      label: row.label.trim() || "Appliance",
      skip: true,
    };
  }

  const kwh = runningKwh({
    watts: row.watts,
    quantity,
    hoursPerDay: row.hoursPerDay,
    days,
    dutyPercent: duty,
  });
  if (!Number.isFinite(kwh)) {
    return {
      ok: false,
      failure: invalidResult("Appliance kWh produced a non-finite result."),
    };
  }
  return { ok: true, kwh, label: row.label.trim() || "Appliance" };
}

function calculateBill(input: BillListInput): ElectricityResult {
  if (input.appliances.length > MAX_BILL_APPLIANCES) {
    return invalidResult(
      `You can list up to ${MAX_BILL_APPLIANCES} appliances.`,
    );
  }

  const active: { label: string; kwh: number }[] = [];
  for (const row of input.appliances) {
    const resolved = rowMonthlyKwh(row);
    if (!resolved.ok) return resolved.failure;
    if ("skip" in resolved && resolved.skip) {
      if (resolved.kwh > 0) {
        active.push({ label: resolved.label, kwh: resolved.kwh });
      }
      continue;
    }
    active.push({ label: resolved.label, kwh: resolved.kwh });
  }

  if (active.length === 0) {
    // Allow empty appliance list when showing fixed charge only with tiers/flat
    // Spec: zero usage still shows fixed charge and tax
  }

  const totalKwhPerMonth = active.reduce((sum, row) => sum + row.kwh, 0);
  if (!Number.isFinite(totalKwhPerMonth)) {
    return invalidResult("Total kWh produced a non-finite result.");
  }

  const shares: BillApplianceShare[] =
    totalKwhPerMonth > 0
      ? active.map((row) => ({
          label: row.label,
          kwhPerMonth: row.kwh,
          sharePercent: (row.kwh / totalKwhPerMonth) * 100,
        }))
      : active.map((row) => ({
          label: row.label,
          kwhPerMonth: row.kwh,
          sharePercent: 0,
        }));

  // Normalize shares so they sum to 100% when there is usage (fix float drift on last)
  if (totalKwhPerMonth > 0 && shares.length > 0) {
    const sumShares = shares.reduce((s, row) => s + row.sharePercent, 0);
    const drift = 100 - sumShares;
    if (Math.abs(drift) > 0 && Math.abs(drift) < 0.1) {
      shares[shares.length - 1]!.sharePercent += drift;
    }
  }

  const fixedCharge =
    input.fixedCharge === null || !Number.isFinite(input.fixedCharge)
      ? 0
      : input.fixedCharge;
  const fixedErr = requireNonNegative(fixedCharge, "Fixed monthly charge");
  if (fixedErr) return fixedErr;

  const taxPercent =
    input.taxPercent === null || !Number.isFinite(input.taxPercent)
      ? 0
      : input.taxPercent;
  if (taxPercent < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Tax or surcharge cannot be negative.",
    };
  }

  let energyCharge: number | null = null;
  let flatEnergyCost: number | null = null;
  let working: string;

  if (input.useTiers) {
    const parsedTiers: { upToUnits: number | null; pricePerUnit: number }[] =
      [];
    for (let i = 0; i < input.tiers.length; i += 1) {
      const tier = input.tiers[i]!;
      if (tier.pricePerUnit === null) {
        return emptyResult("Each tier needs a price per unit.");
      }
      const isLast = i === input.tiers.length - 1;
      if (!isLast && tier.upToUnits === null) {
        return invalidResult(
          "Only the last tier can be open-ended.",
          "tiers",
        );
      }
      parsedTiers.push({
        upToUnits: tier.upToUnits,
        pricePerUnit: tier.pricePerUnit,
      });
    }

    const tiered = calculateTieredCharge({
      units: totalKwhPerMonth,
      tiers: parsedTiers,
      method: input.tierMethod,
    });
    if (!tiered.ok) {
      return { ok: false, error: tiered.error, message: tiered.message };
    }
    energyCharge = tiered.charge;
    working = `${formatNum(totalKwhPerMonth, 2)} kWh (units) under ${input.tierMethod === "incremental" ? "incremental" : "whole-bill"} tiers → energy ${formatNum(energyCharge, 2)}`;
  } else {
    if (input.pricePerKwh === null) {
      if (active.length === 0 && fixedCharge === 0) {
        return emptyResult(
          "Add appliances with watts and hours, or open the bill section for tiers and charges.",
        );
      }
      if (active.length > 0) {
        return emptyResult(
          "Enter a price per kWh, or open “My bill is not a flat rate” for tiers.",
        );
      }
      // Zero usage + fixed only
      energyCharge = 0;
      flatEnergyCost = 0;
      working = `No appliance usage; fixed charge ${formatNum(fixedCharge, 2)}`;
    } else {
      const priceErr = requireNonNegative(input.pricePerKwh, "Price per kWh");
      if (priceErr) return priceErr;
      flatEnergyCost = costFromKwh(totalKwhPerMonth, input.pricePerKwh);
      energyCharge = flatEnergyCost;
      working = `${formatNum(totalKwhPerMonth, 2)} kWh × ${formatNum(input.pricePerKwh, 4)} /kWh = ${formatNum(energyCharge, 2)}`;
    }
  }

  const taxableBase = (energyCharge ?? 0) + fixedCharge;
  const taxAmount = taxableBase * (taxPercent / 100);
  const totalBill = taxableBase + taxAmount;

  if (
    !Number.isFinite(taxAmount) ||
    !Number.isFinite(totalBill) ||
    (energyCharge !== null && !Number.isFinite(energyCharge))
  ) {
    return invalidResult("Bill total produced a non-finite result.");
  }

  if (fixedCharge > 0 || taxPercent > 0) {
    working += `; fixed ${formatNum(fixedCharge, 2)} + tax ${formatNum(taxPercent, 2)}% → total ${formatNum(totalBill, 2)}`;
  }
  working += ".";

  return {
    ok: true,
    mode: "bill",
    totalKwhPerMonth,
    flatEnergyCost,
    energyCharge,
    fixedCharge,
    taxAmount,
    totalBill,
    pricePerKwh: input.useTiers ? null : input.pricePerKwh,
    useTiers: input.useTiers,
    tierMethod: input.useTiers ? input.tierMethod : null,
    shares,
    working,
  };
}

/** Build a reference kWh/month row for content tables (same running math). */
export function monthlyKwhReferenceRow(options: {
  watts: number;
  hoursPerDay: number;
  daysPerMonth?: number;
  quantity?: number;
  dutyPercent?: number;
}): {
  watts: number;
  hoursPerDay: number;
  daysPerMonth: number;
  kwhPerMonth: number;
} {
  const days = options.daysPerMonth ?? DEFAULT_DAYS_PER_MONTH;
  const quantity = options.quantity ?? DEFAULT_QUANTITY;
  const duty = options.dutyPercent ?? DEFAULT_DUTY_PERCENT;
  return {
    watts: options.watts,
    hoursPerDay: options.hoursPerDay,
    daysPerMonth: days,
    kwhPerMonth: runningKwh({
      watts: options.watts,
      quantity,
      hoursPerDay: options.hoursPerDay,
      days,
      dutyPercent: duty,
    }),
  };
}
