/**
 * Battery / UPS / inverter backup time and pack sizing estimates.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

export const DEFAULT_USABLE_PERCENT = 50;
export const DEFAULT_HEALTH_PERCENT = 100;
export const DEFAULT_EFFICIENCY_PERCENT = 85;
export const DEFAULT_POWER_FACTOR = 0.7;
export const DEFAULT_SERIES = 1;
export const DEFAULT_STRINGS = 1;
export const MAX_APPLIANCE_ROWS = 20;

export const LEAD_ACID_USABLE_PERCENT = 50;
export const LITHIUM_USABLE_PERCENT = 80;

export type BatteryMode = "runtime" | "needed";
export type LoadInputMode = "watts" | "appliances";

export type BatteryErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite"
  | "percent"
  | "voltage_mismatch";

export type ApplianceRow = {
  label: string;
  watts: number | null;
  quantity: number | null;
};

export type RuntimeInput = {
  mode: "runtime";
  batteryVoltage: number | null;
  batteryAh: number | null;
  series: number | null;
  strings: number | null;
  usablePercent: number | null;
  healthPercent: number | null;
  efficiencyPercent: number | null;
  loadWatts: number | null;
  appliances: ApplianceRow[] | null;
  loadMode: LoadInputMode;
  inverterRatingWatts: number | null;
};

export type NeededInput = {
  mode: "needed";
  loadWatts: number | null;
  appliances: ApplianceRow[] | null;
  loadMode: LoadInputMode;
  backupHours: number | null;
  systemVoltage: number | null;
  batteryVoltage: number | null;
  batteryAh: number | null;
  usablePercent: number | null;
  healthPercent: number | null;
  efficiencyPercent: number | null;
  inverterRatingWatts: number | null;
};

export type BatteryInput = RuntimeInput | NeededInput;

export type RuntimeSuccess = {
  ok: true;
  mode: "runtime";
  packVoltage: number;
  packAh: number;
  nominalWh: number;
  usableWh: number;
  loadWatts: number;
  runtimeHours: number;
  runtimeWholeHours: number;
  runtimeMinutes: number;
  efficiencyFraction: number;
  usableFraction: number;
  healthFraction: number;
  inverterWarning: boolean;
  working: string;
};

export type NeededSuccess = {
  ok: true;
  mode: "needed";
  loadWatts: number;
  backupHours: number;
  requiredWh: number;
  requiredPackAh: number;
  systemVoltage: number;
  batteryVoltage: number;
  batteryAh: number;
  series: number;
  strings: number;
  totalBatteries: number;
  actualRuntimeHours: number;
  actualRuntimeWholeHours: number;
  actualRuntimeMinutes: number;
  actualUsableWh: number;
  inverterWarning: boolean;
  working: string;
};

export type BatteryFailure = {
  ok: false;
  error: BatteryErrorCode;
  message: string;
};

export type BatteryResult = RuntimeSuccess | NeededSuccess | BatteryFailure;

export type VaWattsResult =
  | { ok: true; watts: number; va: number; powerFactor: number }
  | { ok: false; error: BatteryErrorCode; message: string };

function emptyResult(message: string): BatteryFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(
  message: string,
  error: BatteryErrorCode = "invalid",
): BatteryFailure {
  return { ok: false, error, message };
}

function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Convert decimal hours to whole hours + minutes (minutes rounded). */
export function hoursToHoursMinutes(hours: number): {
  hours: number;
  minutes: number;
} {
  if (!Number.isFinite(hours) || hours < 0) {
    return { hours: 0, minutes: 0 };
  }
  const totalMinutes = Math.round(hours * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function formatRuntimeLabel(hours: number): string {
  const parts = hoursToHoursMinutes(hours);
  return `${parts.hours} h ${parts.minutes} min`;
}

/** Sum appliance rows; returns null if any active row is incomplete/invalid. */
export function sumApplianceWatts(
  appliances: ApplianceRow[] | null,
): { ok: true; watts: number } | { ok: false; message: string } {
  if (appliances === null || appliances.length === 0) {
    return { ok: false, message: "Add at least one appliance with watts and quantity." };
  }
  if (appliances.length > MAX_APPLIANCE_ROWS) {
    return {
      ok: false,
      message: `You can list up to ${MAX_APPLIANCE_ROWS} appliances.`,
    };
  }

  let total = 0;
  let any = false;
  for (const row of appliances) {
    const hasWatts = row.watts !== null;
    const hasQty = row.quantity !== null;
    if (!hasWatts && !hasQty && row.label.trim() === "") continue;
    if (row.watts === null || row.quantity === null) {
      return {
        ok: false,
        message: "Each appliance row needs watts and quantity.",
      };
    }
    if (!Number.isFinite(row.watts) || !Number.isFinite(row.quantity)) {
      return { ok: false, message: "Appliance watts and quantity must be finite numbers." };
    }
    if (row.watts < 0 || row.quantity < 0) {
      return { ok: false, message: "Appliance watts and quantity cannot be negative." };
    }
    if (row.quantity === 0) continue;
    if (row.watts === 0) continue;
    any = true;
    total += row.watts * row.quantity;
  }

  if (!any) {
    return {
      ok: false,
      message: "Add at least one appliance with watts and quantity greater than zero.",
    };
  }
  if (!Number.isFinite(total)) {
    return { ok: false, message: "Appliance load must be a finite number." };
  }
  return { ok: true, watts: total };
}

function resolveLoadWatts(
  loadMode: LoadInputMode,
  loadWatts: number | null,
  appliances: ApplianceRow[] | null,
):
  | { ok: true; watts: number }
  | { ok: false; failure: BatteryFailure } {
  if (loadMode === "appliances") {
    const summed = sumApplianceWatts(appliances);
    if (!summed.ok) {
      return {
        ok: false,
        failure: emptyResult(summed.message),
      };
    }
    return { ok: true, watts: summed.watts };
  }

  if (loadWatts === null) {
    return {
      ok: false,
      failure: emptyResult("Enter the load in watts, or switch to an appliance list."),
    };
  }
  if (!Number.isFinite(loadWatts)) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "nonfinite",
        message: "Load must be a finite number.",
      },
    };
  }
  if (loadWatts < 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "negative",
        message: "Load cannot be negative.",
      },
    };
  }
  if (loadWatts === 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "zero",
        message: "Load must be greater than zero.",
      },
    };
  }
  return { ok: true, watts: loadWatts };
}

function parsePercent(
  value: number | null,
  fallback: number,
  label: string,
): { ok: true; percent: number } | { ok: false; failure: BatteryFailure } {
  const raw = value === null || !Number.isFinite(value) ? fallback : value;
  if (!Number.isFinite(raw)) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "nonfinite",
        message: `${label} must be a finite number.`,
      },
    };
  }
  if (raw < 1 || raw > 100) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "percent",
        message: `${label} must be between 1 and 100.`,
      },
    };
  }
  return { ok: true, percent: raw };
}

function parsePositiveCount(
  value: number | null,
  fallback: number,
  label: string,
): { ok: true; value: number } | { ok: false; failure: BatteryFailure } {
  const raw = value === null || !Number.isFinite(value) ? fallback : value;
  if (!Number.isFinite(raw)) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "nonfinite",
        message: `${label} must be a finite number.`,
      },
    };
  }
  if (raw < 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "negative",
        message: `${label} cannot be negative.`,
      },
    };
  }
  if (raw === 0 || !Number.isInteger(raw)) {
    return {
      ok: false,
      failure: invalidResult(`${label} must be a whole number of at least 1.`),
    };
  }
  return { ok: true, value: raw };
}

export function packVoltage(batteryVoltage: number, series: number): number {
  return batteryVoltage * series;
}

export function packAh(batteryAh: number, strings: number): number {
  return batteryAh * strings;
}

export function nominalWattHours(packV: number, packCapacityAh: number): number {
  return packV * packCapacityAh;
}

export function usableWattHours(
  nominalWh: number,
  usableFraction: number,
  healthFraction: number,
): number {
  return nominalWh * usableFraction * healthFraction;
}

export function runtimeHoursFromUsable(
  usableWh: number,
  efficiencyFraction: number,
  loadWatts: number,
): number {
  return (usableWh * efficiencyFraction) / loadWatts;
}

export function requiredWattHours(
  loadWatts: number,
  hours: number,
  efficiencyFraction: number,
  usableFraction: number,
  healthFraction: number,
): number {
  return loadWatts * hours / (efficiencyFraction * usableFraction * healthFraction);
}

export function vaToWatts(va: number, powerFactor: number): number {
  return va * powerFactor;
}

export function wattsToVa(watts: number, powerFactor: number): number {
  return watts / powerFactor;
}

/**
 * Convert VA ↔ watts with an editable power factor (example default 0.7).
 */
export function convertVaWatts(input: {
  direction: "va-to-w" | "w-to-va";
  va: number | null;
  watts: number | null;
  powerFactor: number | null;
}): VaWattsResult {
  const pf =
    input.powerFactor === null || !Number.isFinite(input.powerFactor)
      ? DEFAULT_POWER_FACTOR
      : input.powerFactor;

  if (!Number.isFinite(pf)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Power factor must be a finite number.",
    };
  }
  if (pf <= 0 || pf > 1) {
    return {
      ok: false,
      error: "invalid",
      message: "Power factor must be greater than 0 and at most 1.",
    };
  }

  if (input.direction === "va-to-w") {
    if (input.va === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a VA rating to convert to watts.",
      };
    }
    if (!Number.isFinite(input.va)) {
      return { ok: false, error: "nonfinite", message: "VA must be a finite number." };
    }
    if (input.va < 0) {
      return { ok: false, error: "negative", message: "VA cannot be negative." };
    }
    if (input.va === 0) {
      return { ok: false, error: "zero", message: "VA must be greater than zero." };
    }
    const watts = vaToWatts(input.va, pf);
    if (!Number.isFinite(watts)) {
      return { ok: false, error: "invalid", message: "Conversion produced a non-finite result." };
    }
    return { ok: true, watts, va: input.va, powerFactor: pf };
  }

  if (input.watts === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter watts to convert to VA.",
    };
  }
  if (!Number.isFinite(input.watts)) {
    return { ok: false, error: "nonfinite", message: "Watts must be a finite number." };
  }
  if (input.watts < 0) {
    return { ok: false, error: "negative", message: "Watts cannot be negative." };
  }
  if (input.watts === 0) {
    return { ok: false, error: "zero", message: "Watts must be greater than zero." };
  }
  const va = wattsToVa(input.watts, pf);
  if (!Number.isFinite(va)) {
    return { ok: false, error: "invalid", message: "Conversion produced a non-finite result." };
  }
  return { ok: true, watts: input.watts, va, powerFactor: pf };
}

function inverterWarning(
  loadWatts: number,
  inverterRatingWatts: number | null,
): boolean {
  if (
    inverterRatingWatts === null ||
    !Number.isFinite(inverterRatingWatts) ||
    inverterRatingWatts <= 0
  ) {
    return false;
  }
  return loadWatts > inverterRatingWatts;
}

/**
 * Estimate backup runtime or the battery pack needed for a target time.
 */
export function calculateBatteryBackup(input: BatteryInput): BatteryResult {
  if (input.mode === "runtime") {
    return calculateRuntime(input);
  }
  return calculateNeeded(input);
}

function calculateRuntime(input: RuntimeInput): BatteryResult {
  if (input.batteryVoltage === null || input.batteryAh === null) {
    return emptyResult(
      "Enter battery voltage and capacity (Ah) to estimate runtime.",
    );
  }
  if (!Number.isFinite(input.batteryVoltage) || !Number.isFinite(input.batteryAh)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Battery voltage and capacity must be finite numbers.",
    };
  }
  if (input.batteryVoltage < 0 || input.batteryAh < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Battery voltage and capacity cannot be negative.",
    };
  }
  if (input.batteryVoltage === 0 || input.batteryAh === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Battery voltage and capacity must be greater than zero.",
    };
  }

  const seriesParsed = parsePositiveCount(input.series, DEFAULT_SERIES, "Series count");
  if (!seriesParsed.ok) return seriesParsed.failure;
  const stringsParsed = parsePositiveCount(
    input.strings,
    DEFAULT_STRINGS,
    "Parallel strings",
  );
  if (!stringsParsed.ok) return stringsParsed.failure;

  const usableParsed = parsePercent(
    input.usablePercent,
    DEFAULT_USABLE_PERCENT,
    "Usable share",
  );
  if (!usableParsed.ok) return usableParsed.failure;
  const healthParsed = parsePercent(
    input.healthPercent,
    DEFAULT_HEALTH_PERCENT,
    "Battery health",
  );
  if (!healthParsed.ok) return healthParsed.failure;
  const effParsed = parsePercent(
    input.efficiencyPercent,
    DEFAULT_EFFICIENCY_PERCENT,
    "Inverter or UPS efficiency",
  );
  if (!effParsed.ok) return effParsed.failure;

  const load = resolveLoadWatts(input.loadMode, input.loadWatts, input.appliances);
  if (!load.ok) return load.failure;

  if (
    input.inverterRatingWatts !== null &&
    Number.isFinite(input.inverterRatingWatts) &&
    input.inverterRatingWatts < 0
  ) {
    return {
      ok: false,
      error: "negative",
      message: "Inverter or UPS rating cannot be negative.",
    };
  }

  const series = seriesParsed.value;
  const strings = stringsParsed.value;
  const usableFraction = usableParsed.percent / 100;
  const healthFraction = healthParsed.percent / 100;
  const efficiencyFraction = effParsed.percent / 100;

  const packV = packVoltage(input.batteryVoltage, series);
  const packCapacityAh = packAh(input.batteryAh, strings);
  const nominalWh = nominalWattHours(packV, packCapacityAh);
  const usableWh = usableWattHours(nominalWh, usableFraction, healthFraction);
  const runtimeHours = runtimeHoursFromUsable(
    usableWh,
    efficiencyFraction,
    load.watts,
  );

  if (
    !Number.isFinite(packV) ||
    !Number.isFinite(packCapacityAh) ||
    !Number.isFinite(nominalWh) ||
    !Number.isFinite(usableWh) ||
    !Number.isFinite(runtimeHours)
  ) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const parts = hoursToHoursMinutes(runtimeHours);
  const working = `Pack ${formatNum(packV, 2)} V × ${formatNum(packCapacityAh, 2)} Ah = ${formatNum(nominalWh, 2)} Wh nominal; usable ${formatNum(usableWh, 2)} Wh (= × ${formatNum(usableParsed.percent, 1)}% × ${formatNum(healthParsed.percent, 1)}%); runtime ${formatNum(usableWh, 2)} × ${formatNum(effParsed.percent, 1)}% ÷ ${formatNum(load.watts, 2)} W = ${formatNum(runtimeHours, 2)} h (${formatRuntimeLabel(runtimeHours)}).`;

  return {
    ok: true,
    mode: "runtime",
    packVoltage: packV,
    packAh: packCapacityAh,
    nominalWh,
    usableWh,
    loadWatts: load.watts,
    runtimeHours,
    runtimeWholeHours: parts.hours,
    runtimeMinutes: parts.minutes,
    efficiencyFraction,
    usableFraction,
    healthFraction,
    inverterWarning: inverterWarning(load.watts, input.inverterRatingWatts),
    working,
  };
}

function calculateNeeded(input: NeededInput): BatteryResult {
  if (
    input.backupHours === null ||
    input.systemVoltage === null ||
    input.batteryVoltage === null ||
    input.batteryAh === null
  ) {
    return emptyResult(
      "Enter backup hours, system voltage, and battery voltage and Ah to size a pack.",
    );
  }

  const nums = [
    input.backupHours,
    input.systemVoltage,
    input.batteryVoltage,
    input.batteryAh,
  ];
  if (nums.some((n) => !Number.isFinite(n))) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Backup hours, voltages and Ah must be finite numbers.",
    };
  }
  if (nums.some((n) => n! < 0)) {
    return {
      ok: false,
      error: "negative",
      message: "Backup hours, voltages and Ah cannot be negative.",
    };
  }
  if (nums.some((n) => n! === 0)) {
    return {
      ok: false,
      error: "zero",
      message: "Backup hours, voltages and Ah must be greater than zero.",
    };
  }

  const usableParsed = parsePercent(
    input.usablePercent,
    DEFAULT_USABLE_PERCENT,
    "Usable share",
  );
  if (!usableParsed.ok) return usableParsed.failure;
  const healthParsed = parsePercent(
    input.healthPercent,
    DEFAULT_HEALTH_PERCENT,
    "Battery health",
  );
  if (!healthParsed.ok) return healthParsed.failure;
  const effParsed = parsePercent(
    input.efficiencyPercent,
    DEFAULT_EFFICIENCY_PERCENT,
    "Inverter or UPS efficiency",
  );
  if (!effParsed.ok) return effParsed.failure;

  const load = resolveLoadWatts(input.loadMode, input.loadWatts, input.appliances);
  if (!load.ok) return load.failure;

  if (
    input.inverterRatingWatts !== null &&
    Number.isFinite(input.inverterRatingWatts) &&
    input.inverterRatingWatts < 0
  ) {
    return {
      ok: false,
      error: "negative",
      message: "Inverter or UPS rating cannot be negative.",
    };
  }

  const systemVoltage = input.systemVoltage;
  const batteryVoltage = input.batteryVoltage;
  const batteryAh = input.batteryAh;
  const usableFraction = usableParsed.percent / 100;
  const healthFraction = healthParsed.percent / 100;
  const efficiencyFraction = effParsed.percent / 100;

  const ratio = systemVoltage / batteryVoltage;
  if (!Number.isFinite(ratio) || Math.abs(ratio - Math.round(ratio)) > 1e-9) {
    return invalidResult(
      "System voltage must divide evenly by the battery voltage so series count is a whole number. Adjust one of the voltages.",
      "voltage_mismatch",
    );
  }
  const series = Math.round(ratio);

  const requiredWh = requiredWattHours(
    load.watts,
    input.backupHours,
    efficiencyFraction,
    usableFraction,
    healthFraction,
  );
  const requiredPackAh = requiredWh / systemVoltage;
  const strings = Math.ceil(requiredPackAh / batteryAh);
  const totalBatteries = series * strings;

  const actualPackAh = packAh(batteryAh, strings);
  const actualNominalWh = nominalWattHours(systemVoltage, actualPackAh);
  const actualUsableWh = usableWattHours(
    actualNominalWh,
    usableFraction,
    healthFraction,
  );
  const actualRuntimeHours = runtimeHoursFromUsable(
    actualUsableWh,
    efficiencyFraction,
    load.watts,
  );

  if (
    !Number.isFinite(requiredWh) ||
    !Number.isFinite(requiredPackAh) ||
    !Number.isFinite(strings) ||
    !Number.isFinite(actualRuntimeHours) ||
    !Number.isFinite(actualUsableWh)
  ) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const parts = hoursToHoursMinutes(actualRuntimeHours);
  const working = `Need ${formatNum(requiredWh, 2)} Wh (= ${formatNum(load.watts, 2)} W × ${formatNum(input.backupHours, 2)} h ÷ (${formatNum(effParsed.percent, 1)}% × ${formatNum(usableParsed.percent, 1)}% × ${formatNum(healthParsed.percent, 1)}%)); at ${formatNum(systemVoltage, 2)} V that is ${formatNum(requiredPackAh, 2)} Ah → ${series} in series × ${strings} string${strings === 1 ? "" : "s"} = ${totalBatteries} batteries; this pack gives about ${formatNum(actualRuntimeHours, 2)} h (${formatRuntimeLabel(actualRuntimeHours)}).`;

  return {
    ok: true,
    mode: "needed",
    loadWatts: load.watts,
    backupHours: input.backupHours,
    requiredWh,
    requiredPackAh,
    systemVoltage,
    batteryVoltage,
    batteryAh,
    series,
    strings,
    totalBatteries,
    actualRuntimeHours,
    actualRuntimeWholeHours: parts.hours,
    actualRuntimeMinutes: parts.minutes,
    actualUsableWh,
    inverterWarning: inverterWarning(load.watts, input.inverterRatingWatts),
    working,
  };
}

export type RuntimeReferenceRow = {
  batteryLabel: string;
  batteryVoltage: number;
  batteryAh: number;
  series: number;
  strings: number;
  loadWatts: number;
  usablePercent: number;
  efficiencyPercent: number;
  usableWh: number;
  runtimeHours: number;
};

/** Build a reference runtime row for content tables (same runtime math). */
export function runtimeReferenceRow(options: {
  batteryVoltage: number;
  batteryAh: number;
  series?: number;
  strings?: number;
  loadWatts: number;
  usablePercent?: number;
  healthPercent?: number;
  efficiencyPercent?: number;
}): RuntimeReferenceRow {
  const series = options.series ?? 1;
  const strings = options.strings ?? 1;
  const usablePercent = options.usablePercent ?? DEFAULT_USABLE_PERCENT;
  const healthPercent = options.healthPercent ?? DEFAULT_HEALTH_PERCENT;
  const efficiencyPercent =
    options.efficiencyPercent ?? DEFAULT_EFFICIENCY_PERCENT;

  const result = calculateBatteryBackup({
    mode: "runtime",
    batteryVoltage: options.batteryVoltage,
    batteryAh: options.batteryAh,
    series,
    strings,
    usablePercent,
    healthPercent,
    efficiencyPercent,
    loadWatts: options.loadWatts,
    appliances: null,
    loadMode: "watts",
    inverterRatingWatts: null,
  });

  const usableWh = result.ok && result.mode === "runtime" ? result.usableWh : 0;
  const runtimeHours =
    result.ok && result.mode === "runtime" ? result.runtimeHours : 0;

  return {
    batteryLabel: `${options.batteryVoltage} V ${options.batteryAh} Ah${series > 1 || strings > 1 ? ` (${series}S${strings}P)` : ""}`,
    batteryVoltage: options.batteryVoltage,
    batteryAh: options.batteryAh,
    series,
    strings,
    loadWatts: options.loadWatts,
    usablePercent,
    efficiencyPercent,
    usableWh,
    runtimeHours,
  };
}
