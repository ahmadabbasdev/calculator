/**
 * Solar panel system sizing, production, cost and payback estimates.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

export const DEFAULT_SUN_HOURS = 5;
export const DEFAULT_LOSSES_PERCENT = 20;
export const DEFAULT_SHARE_PERCENT = 100;
export const DEFAULT_PANEL_WATTS = 500;
export const DEFAULT_PANEL_AREA_M2 = 2.2;
export const DEFAULT_EXCESS_VALUE_PERCENT = 0;
export const DEFAULT_DEGRADATION_PERCENT = 0;
export const DEFAULT_PRICE_INCREASE_PERCENT = 0;
export const DEFAULT_LIFETIME_YEARS = 25;

export const SHARE_NOTE_PERCENT = 200;
export const LOSSES_NOTE_PERCENT = 60;

export type UsePeriod = "month" | "year";
export type SolarMode = "size" | "produce";
export type ProduceSizeMode = "kw" | "panels";

export type SolarErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite";

export type SolarYearRow = {
  year: number;
  savings: number;
  cumulativeSavings: number;
};

export type SolarSuccess = {
  ok: true;
  mode: SolarMode;
  annualUseKwh: number | null;
  sunHours: number;
  lossesFraction: number;
  yieldPerKw: number;
  neededKw: number | null;
  panelCount: number;
  panelWatts: number;
  installedKw: number;
  annualProductionKwh: number;
  monthlyAvgProductionKwh: number;
  usedOnSiteKwh: number | null;
  excessKwh: number | null;
  year1Savings: number | null;
  systemCost: number | null;
  simplePaybackYears: number | null;
  roofAreaM2: number | null;
  lifetimeYears: number;
  lifetimeSavings: number | null;
  lifetimeNet: number | null;
  paybackYearInterpolated: number | null;
  yearRows: SolarYearRow[];
  working: string;
  notes: string[];
};

export type SolarFailure = {
  ok: false;
  error: SolarErrorCode;
  message: string;
};

export type SolarResult = SolarSuccess | SolarFailure;

export type SizeSystemInput = {
  mode: "size";
  useKwh: number | null;
  usePeriod: UsePeriod;
  sunHours: number | null;
  lossesPercent: number | null;
  sharePercent: number | null;
  panelWatts: number | null;
  panelAreaM2: number | null;
  pricePerKwh: number | null;
  costPerWatt: number | null;
  excessValuePercent: number | null;
  degradationPercent: number | null;
  priceIncreasePercent: number | null;
  lifetimeYears: number | null;
};

export type ProduceSystemInput = {
  mode: "produce";
  sizeMode: ProduceSizeMode;
  systemKw: number | null;
  panelCount: number | null;
  panelWatts: number | null;
  sunHours: number | null;
  lossesPercent: number | null;
  pricePerKwh: number | null;
};

export type SolarInput = SizeSystemInput | ProduceSystemInput;

function emptyResult(
  message = "Enter your electricity use and peak sun hours to see an estimate.",
): SolarFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(message: string): SolarFailure {
  return { ok: false, error: "invalid", message };
}

/** Yield (kWh/year) per installed kW. */
export function yieldPerKw(
  sunHoursPerDay: number,
  lossesFraction: number,
): number {
  return sunHoursPerDay * 365 * (1 - lossesFraction);
}

export function annualUseFromInput(
  useKwh: number,
  period: UsePeriod,
): number {
  return period === "month" ? useKwh * 12 : useKwh;
}

export function neededSystemKw(
  annualUseKwh: number,
  shareFraction: number,
  yieldKwhPerKw: number,
): number {
  return (annualUseKwh * shareFraction) / yieldKwhPerKw;
}

export function panelCountForKw(
  neededKw: number,
  panelWatts: number,
): number {
  return Math.ceil((neededKw * 1000) / panelWatts);
}

export function installedKwFromPanels(
  panels: number,
  panelWatts: number,
): number {
  return (panels * panelWatts) / 1000;
}

export function yearSavings(
  year1Savings: number,
  yearIndex: number,
  degradationFraction: number,
  priceIncreaseFraction: number,
): number {
  // yearIndex is 1-based
  const y = yearIndex - 1;
  return (
    year1Savings *
    Math.pow(1 - degradationFraction, y) *
    Math.pow(1 + priceIncreaseFraction, y)
  );
}

/**
 * Build year-by-year savings rows and interpolate payback year when
 * cumulative savings crosses system cost.
 */
export function buildLifetimeView(options: {
  year1Savings: number;
  systemCost: number | null;
  lifetimeYears: number;
  degradationFraction: number;
  priceIncreaseFraction: number;
}): {
  rows: SolarYearRow[];
  lifetimeSavings: number;
  lifetimeNet: number | null;
  paybackYearInterpolated: number | null;
} {
  const {
    year1Savings,
    systemCost,
    lifetimeYears,
    degradationFraction,
    priceIncreaseFraction,
  } = options;

  const rows: SolarYearRow[] = [];
  let cumulative = 0;
  let paybackYearInterpolated: number | null = null;

  for (let year = 1; year <= lifetimeYears; year += 1) {
    const savings = yearSavings(
      year1Savings,
      year,
      degradationFraction,
      priceIncreaseFraction,
    );
    const prevCumulative = cumulative;
    cumulative += savings;
    rows.push({ year, savings, cumulativeSavings: cumulative });

    if (
      paybackYearInterpolated === null &&
      systemCost !== null &&
      Number.isFinite(systemCost) &&
      systemCost >= 0
    ) {
      if (systemCost === 0) {
        paybackYearInterpolated = 0;
      } else if (cumulative + 1e-12 >= systemCost) {
        if (savings <= 1e-12) {
          paybackYearInterpolated = year;
        } else {
          const fraction = (systemCost - prevCumulative) / savings;
          paybackYearInterpolated = year - 1 + Math.min(1, Math.max(0, fraction));
        }
      }
    }
  }

  return {
    rows,
    lifetimeSavings: cumulative,
    lifetimeNet:
      systemCost !== null && Number.isFinite(systemCost)
        ? cumulative - systemCost
        : null,
    paybackYearInterpolated,
  };
}

function collectNotes(sharePercent: number, lossesPercent: number): string[] {
  const notes: string[] = [];
  if (sharePercent > SHARE_NOTE_PERCENT) {
    notes.push(
      "A share above 200% is unusual for covering household use — treat this figure cautiously.",
    );
  }
  if (lossesPercent > LOSSES_NOTE_PERCENT) {
    notes.push(
      "System losses above 60% are high for a typical estimate — double-check the value you entered.",
    );
  }
  return notes;
}

function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Size a system from annual/monthly use, or estimate production from a known size.
 */
export function calculateSolar(input: SolarInput): SolarResult {
  if (input.mode === "produce") {
    return calculateProduce(input);
  }
  return calculateSize(input);
}

function calculateSize(input: SizeSystemInput): SolarResult {
  if (input.useKwh === null || input.sunHours === null) {
    return emptyResult();
  }
  if (!Number.isFinite(input.useKwh) || !Number.isFinite(input.sunHours)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Enter finite numbers for use and sun hours.",
    };
  }
  if (input.useKwh < 0 || input.sunHours < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Use and sun hours cannot be negative.",
    };
  }
  if (input.useKwh === 0 || input.sunHours === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Use and sun hours must be greater than zero.",
    };
  }

  const lossesPercent =
    input.lossesPercent === null || !Number.isFinite(input.lossesPercent)
      ? DEFAULT_LOSSES_PERCENT
      : input.lossesPercent;
  const sharePercent =
    input.sharePercent === null || !Number.isFinite(input.sharePercent)
      ? DEFAULT_SHARE_PERCENT
      : input.sharePercent;
  const panelWatts =
    input.panelWatts === null || !Number.isFinite(input.panelWatts)
      ? DEFAULT_PANEL_WATTS
      : input.panelWatts;
  const panelAreaM2 =
    input.panelAreaM2 === null || !Number.isFinite(input.panelAreaM2)
      ? null
      : input.panelAreaM2;
  const excessValuePercent =
    input.excessValuePercent === null ||
    !Number.isFinite(input.excessValuePercent)
      ? DEFAULT_EXCESS_VALUE_PERCENT
      : input.excessValuePercent;
  const degradationPercent =
    input.degradationPercent === null ||
    !Number.isFinite(input.degradationPercent)
      ? DEFAULT_DEGRADATION_PERCENT
      : input.degradationPercent;
  const priceIncreasePercent =
    input.priceIncreasePercent === null ||
    !Number.isFinite(input.priceIncreasePercent)
      ? DEFAULT_PRICE_INCREASE_PERCENT
      : input.priceIncreasePercent;
  const lifetimeYears =
    input.lifetimeYears === null || !Number.isFinite(input.lifetimeYears)
      ? DEFAULT_LIFETIME_YEARS
      : Math.floor(input.lifetimeYears);

  if (lossesPercent < 0 || sharePercent < 0 || panelWatts <= 0) {
    return invalidResult(
      "Losses and share cannot be negative, and panel wattage must be greater than zero.",
    );
  }
  if (lossesPercent >= 100) {
    return invalidResult("Losses must be below 100%.");
  }
  if (degradationPercent < 0 || priceIncreasePercent < 0) {
    return invalidResult(
      "Degradation and price increase cannot be negative.",
    );
  }
  if (degradationPercent >= 100) {
    return invalidResult("Degradation must be below 100%.");
  }
  if (lifetimeYears < 1) {
    return invalidResult("Lifetime years must be at least 1.");
  }
  if (
    input.pricePerKwh !== null &&
    (!Number.isFinite(input.pricePerKwh) || input.pricePerKwh < 0)
  ) {
    return {
      ok: false,
      error: input.pricePerKwh < 0 ? "negative" : "nonfinite",
      message: "Electricity price cannot be negative.",
    };
  }
  if (
    input.costPerWatt !== null &&
    (!Number.isFinite(input.costPerWatt) || input.costPerWatt < 0)
  ) {
    return {
      ok: false,
      error: input.costPerWatt < 0 ? "negative" : "nonfinite",
      message: "Installed cost per watt cannot be negative.",
    };
  }
  if (panelAreaM2 !== null && panelAreaM2 < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Panel area cannot be negative.",
    };
  }

  const annualUseKwh = annualUseFromInput(input.useKwh, input.usePeriod);
  const lossesFraction = lossesPercent / 100;
  const shareFraction = sharePercent / 100;
  const ypk = yieldPerKw(input.sunHours, lossesFraction);
  if (!Number.isFinite(ypk) || ypk <= 0) {
    return invalidResult("Yield per kW must be greater than zero.");
  }

  const neededKw = neededSystemKw(annualUseKwh, shareFraction, ypk);
  const panels = panelCountForKw(neededKw, panelWatts);
  const installedKw = installedKwFromPanels(panels, panelWatts);
  const annualProductionKwh = installedKw * ypk;
  const usedOnSiteKwh = Math.min(annualProductionKwh, annualUseKwh);
  const excessKwh = Math.max(0, annualProductionKwh - annualUseKwh);

  const hasPrice =
    input.pricePerKwh !== null && Number.isFinite(input.pricePerKwh);
  const hasCost =
    input.costPerWatt !== null && Number.isFinite(input.costPerWatt);

  const year1Savings = hasPrice
    ? usedOnSiteKwh * input.pricePerKwh! +
      excessKwh * input.pricePerKwh! * (excessValuePercent / 100)
    : null;

  const systemCost = hasCost
    ? installedKw * 1000 * input.costPerWatt!
    : null;

  const simplePaybackYears =
    year1Savings !== null &&
    systemCost !== null &&
    year1Savings > 0
      ? systemCost / year1Savings
      : null;

  const roofAreaM2 =
    panelAreaM2 !== null ? panels * panelAreaM2 : null;

  let yearRows: SolarYearRow[] = [];
  let lifetimeSavings: number | null = null;
  let lifetimeNet: number | null = null;
  let paybackYearInterpolated: number | null = null;

  if (year1Savings !== null) {
    const life = buildLifetimeView({
      year1Savings,
      systemCost,
      lifetimeYears,
      degradationFraction: degradationPercent / 100,
      priceIncreaseFraction: priceIncreasePercent / 100,
    });
    yearRows = life.rows;
    lifetimeSavings = life.lifetimeSavings;
    lifetimeNet = life.lifetimeNet;
    paybackYearInterpolated = life.paybackYearInterpolated;
  }

  const notes = collectNotes(sharePercent, lossesPercent);
  const working = `Yield ${formatNum(ypk, 2)} kWh/kW (= ${formatNum(input.sunHours, 2)} × 365 × (1 − ${formatNum(lossesPercent, 1)}%)). Need ${formatNum(neededKw, 4)} kW → ${panels} × ${formatNum(panelWatts, 0)} W = ${formatNum(installedKw, 2)} kW; production ${formatNum(annualProductionKwh, 0)} kWh/year.`;

  return {
    ok: true,
    mode: "size",
    annualUseKwh,
    sunHours: input.sunHours,
    lossesFraction,
    yieldPerKw: ypk,
    neededKw,
    panelCount: panels,
    panelWatts,
    installedKw,
    annualProductionKwh,
    monthlyAvgProductionKwh: annualProductionKwh / 12,
    usedOnSiteKwh,
    excessKwh,
    year1Savings,
    systemCost,
    simplePaybackYears,
    roofAreaM2,
    lifetimeYears,
    lifetimeSavings,
    lifetimeNet,
    paybackYearInterpolated,
    yearRows,
    working,
    notes,
  };
}

function calculateProduce(input: ProduceSystemInput): SolarResult {
  if (input.sunHours === null) {
    return emptyResult(
      "Enter peak sun hours and a system size to see production.",
    );
  }
  if (!Number.isFinite(input.sunHours) || input.sunHours < 0) {
    return {
      ok: false,
      error: input.sunHours < 0 ? "negative" : "nonfinite",
      message: "Sun hours cannot be negative.",
    };
  }
  if (input.sunHours === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Sun hours must be greater than zero.",
    };
  }

  const lossesPercent =
    input.lossesPercent === null || !Number.isFinite(input.lossesPercent)
      ? DEFAULT_LOSSES_PERCENT
      : input.lossesPercent;
  if (lossesPercent < 0 || lossesPercent >= 100) {
    return invalidResult("Losses must be between 0 and 100%.");
  }

  let installedKw: number;
  let panels: number;
  let panelWatts: number;

  if (input.sizeMode === "kw") {
    if (input.systemKw === null) {
      return emptyResult(
        "Enter system size in kW and peak sun hours to see production.",
      );
    }
    if (!Number.isFinite(input.systemKw) || input.systemKw < 0) {
      return {
        ok: false,
        error: input.systemKw < 0 ? "negative" : "nonfinite",
        message: "System size cannot be negative.",
      };
    }
    if (input.systemKw === 0) {
      return {
        ok: false,
        error: "zero",
        message: "System size must be greater than zero.",
      };
    }
    installedKw = input.systemKw;
    panelWatts =
      input.panelWatts === null || !Number.isFinite(input.panelWatts)
        ? DEFAULT_PANEL_WATTS
        : input.panelWatts;
    panels =
      panelWatts > 0
        ? Math.max(1, Math.round((installedKw * 1000) / panelWatts))
        : 0;
  } else {
    if (input.panelCount === null || input.panelWatts === null) {
      return emptyResult(
        "Enter panel count, wattage, and peak sun hours to see production.",
      );
    }
    if (
      !Number.isFinite(input.panelCount) ||
      !Number.isFinite(input.panelWatts) ||
      input.panelCount < 0 ||
      input.panelWatts < 0
    ) {
      return {
        ok: false,
        error:
          input.panelCount < 0 || input.panelWatts < 0
            ? "negative"
            : "nonfinite",
        message: "Panel count and wattage cannot be negative.",
      };
    }
    if (input.panelCount === 0 || input.panelWatts === 0) {
      return {
        ok: false,
        error: "zero",
        message: "Panel count and wattage must be greater than zero.",
      };
    }
    panels = Math.floor(input.panelCount);
    panelWatts = input.panelWatts;
    installedKw = installedKwFromPanels(panels, panelWatts);
  }

  const ypk = yieldPerKw(input.sunHours, lossesPercent / 100);
  const annualProductionKwh = installedKw * ypk;
  const hasPrice =
    input.pricePerKwh !== null && Number.isFinite(input.pricePerKwh);
  if (hasPrice && input.pricePerKwh! < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Electricity price cannot be negative.",
    };
  }
  const year1Savings = hasPrice
    ? annualProductionKwh * input.pricePerKwh!
    : null;

  const notes = collectNotes(DEFAULT_SHARE_PERCENT, lossesPercent);
  const working = `${formatNum(installedKw, 2)} kW × ${formatNum(ypk, 2)} kWh/kW (= ${formatNum(input.sunHours, 2)} × 365 × (1 − ${formatNum(lossesPercent, 1)}%)) = ${formatNum(annualProductionKwh, 0)} kWh/year (≈ ${formatNum(annualProductionKwh / 12, 0)} kWh/month).`;

  return {
    ok: true,
    mode: "produce",
    annualUseKwh: null,
    sunHours: input.sunHours,
    lossesFraction: lossesPercent / 100,
    yieldPerKw: ypk,
    neededKw: null,
    panelCount: panels,
    panelWatts,
    installedKw,
    annualProductionKwh,
    monthlyAvgProductionKwh: annualProductionKwh / 12,
    usedOnSiteKwh: null,
    excessKwh: null,
    year1Savings,
    systemCost: null,
    simplePaybackYears: null,
    roofAreaM2: null,
    lifetimeYears: DEFAULT_LIFETIME_YEARS,
    lifetimeSavings: null,
    lifetimeNet: null,
    paybackYearInterpolated: null,
    yearRows: [],
    working,
    notes,
  };
}

/** Build a reference production row for content tables (same yield math). */
export function productionReferenceRow(
  installedKw: number,
  sunHours: number,
  lossesPercent = DEFAULT_LOSSES_PERCENT,
): {
  installedKw: number;
  sunHours: number;
  annualProductionKwh: number;
} {
  const ypk = yieldPerKw(sunHours, lossesPercent / 100);
  return {
    installedKw,
    sunHours,
    annualProductionKwh: installedKw * ypk,
  };
}
