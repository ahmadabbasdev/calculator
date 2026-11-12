/**
 * BTU cooling / heating room-sizing estimates (rules of thumb).
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

/** Exact: 1 m² = 10.763910417 ft² */
export const SQFT_PER_SQM = 10.763910417;

/** Exact: 1 ft = 0.3048 m */
export const METERS_PER_FOOT = 0.3048;

/** Thermal: 1 BTU/h = 0.29307107 W */
export const WATTS_PER_BTU_H = 0.29307107;

/** 1 ton of cooling = 12,000 BTU/h */
export const BTU_H_PER_TON = 12_000;

export const DEFAULT_COOLING_BTU_PER_SQFT = 20;
export const DEFAULT_CEILING_FT = 8;
export const PEOPLE_BASELINE = 2;
export const DEFAULT_BTU_PER_EXTRA_PERSON = 600;
export const DEFAULT_KITCHEN_BTU = 4_000;

export const AREA_NOTE_SQFT = 10_000;
export const HEIGHT_MIN_FT = 6;
export const HEIGHT_MAX_FT = 20;

export type AreaUnit = "sqft" | "sqm";
export type HeightUnit = "ft" | "m";
export type SunExposure = "normal" | "very-sunny" | "heavily-shaded";
export type HeatingClimate = "mild" | "moderate" | "cold" | "custom";
export type BtuMode = "cooling" | "heating";

export const HEATING_PRESETS: Record<
  Exclude<HeatingClimate, "custom">,
  { btuPerSqFt: number; label: string }
> = {
  mild: { btuPerSqFt: 30, label: "Mild (30 BTU/h per ft²)" },
  moderate: { btuPerSqFt: 40, label: "Moderate (40 BTU/h per ft²)" },
  cold: { btuPerSqFt: 50, label: "Cold (50 BTU/h per ft²)" },
};

/** Typical packaged / window AC sizes (BTU/h) — editable in the UI. */
export const DEFAULT_COMMON_BTU_SIZES = [
  5000, 6000, 7000, 8000, 9000, 10000, 12000, 14000, 18000, 24000, 30000,
  36000,
] as const;

/** Typical tonnage steps for display / next-size helpers. */
export const DEFAULT_COMMON_TONS = [0.75, 1, 1.5, 2, 2.5, 3] as const;

export type BtuErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite";

export type BtuAdjustment = {
  id: string;
  label: string;
  btuPerHour: number;
  editable: boolean;
};

export type BtuSuccess = {
  ok: true;
  mode: BtuMode;
  areaSqFt: number;
  ceilingFt: number;
  /** Unrounded required capacity before nearest-100 rounding. */
  requiredBtuExact: number;
  /** Nearest 100 BTU/h. */
  requiredBtuRounded: number;
  /** Thermal kW from the rounded BTU/h. */
  kw: number;
  /** Cooling tons from the rounded BTU/h (cooling mode only meaningful). */
  tons: number;
  nextCommonBtu: number | null;
  nextCommonTon: number | null;
  adjustments: BtuAdjustment[];
  working: string;
  notes: string[];
};

export type BtuFailure = {
  ok: false;
  error: BtuErrorCode;
  message: string;
};

export type BtuResult = BtuSuccess | BtuFailure;

export type CoolingInput = {
  mode: "cooling";
  area: number | null;
  areaUnit: AreaUnit;
  ceiling: number | null;
  heightUnit: HeightUnit;
  btuPerSqFt: number | null;
  sun: SunExposure;
  /** Editable sun adjustment as a fraction of base (−0.1, 0, +0.1 by default). */
  sunFraction: number | null;
  people: number | null;
  btuPerExtraPerson: number | null;
  kitchen: boolean;
  kitchenBtu: number | null;
  commonBtuSizes: number[];
  commonTons: number[];
};

export type HeatingInput = {
  mode: "heating";
  area: number | null;
  areaUnit: AreaUnit;
  ceiling: number | null;
  heightUnit: HeightUnit;
  climate: HeatingClimate;
  btuPerSqFt: number | null;
  commonBtuSizes: number[];
  commonTons: number[];
};

export type BtuInput = CoolingInput | HeatingInput;

export function sqmToSqFt(sqm: number): number {
  return sqm * SQFT_PER_SQM;
}

export function sqFtToSqm(sqft: number): number {
  return sqft / SQFT_PER_SQM;
}

export function metersToFeet(m: number): number {
  return m / METERS_PER_FOOT;
}

export function feetToMeters(ft: number): number {
  return ft * METERS_PER_FOOT;
}

export function toAreaSqFt(area: number, unit: AreaUnit): number {
  return unit === "sqft" ? area : sqmToSqFt(area);
}

export function toCeilingFt(height: number, unit: HeightUnit): number {
  return unit === "ft" ? height : metersToFeet(height);
}

export function btuHToKw(btuPerHour: number): number {
  return (btuPerHour * WATTS_PER_BTU_H) / 1000;
}

export function btuHToTons(btuPerHour: number): number {
  return btuPerHour / BTU_H_PER_TON;
}

export function tonsToBtuH(tons: number): number {
  return tons * BTU_H_PER_TON;
}

/** Round BTU/h to the nearest 100 (half up via Math.round). */
export function roundBtuToNearest100(btuPerHour: number): number {
  return Math.round(btuPerHour / 100) * 100;
}

export function defaultSunFraction(sun: SunExposure): number {
  if (sun === "very-sunny") return 0.1;
  if (sun === "heavily-shaded") return -0.1;
  return 0;
}

/**
 * Next value in an ascending list that is ≥ required.
 * Exact match stays; otherwise the next larger entry. Null if above the list.
 */
export function nextCommonSize(
  required: number,
  sizesAscending: readonly number[],
): number | null {
  const sorted = [...sizesAscending]
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  for (const size of sorted) {
    if (size + 1e-12 >= required) return size;
  }
  return null;
}

function formatBtu(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function formatKw(n: number): string {
  return n.toFixed(2);
}

function formatTons(n: number): string {
  return n.toFixed(2);
}

function emptyResult(message = "Enter a room area to see a sizing estimate."): BtuFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(message: string): BtuFailure {
  return { ok: false, error: "invalid", message };
}

function collectNotes(areaSqFt: number, ceilingFt: number): string[] {
  const notes: string[] = [];
  if (areaSqFt > AREA_NOTE_SQFT) {
    notes.push(
      "Areas above 10,000 ft² are uncommon for a single-room rule of thumb — treat this figure cautiously.",
    );
  }
  if (ceilingFt < HEIGHT_MIN_FT || ceilingFt > HEIGHT_MAX_FT) {
    notes.push(
      `Ceiling height outside ${HEIGHT_MIN_FT}–${HEIGHT_MAX_FT} ft is unusual for this estimate — double-check the input.`,
    );
  }
  return notes;
}

/**
 * Cooling / heating BTU/h estimate from area, ceiling, and adjustments.
 * Work stays in unrounded BTU/h; display uses nearest 100.
 */
export function calculateBtu(input: BtuInput): BtuResult {
  if (input.area === null || input.ceiling === null) {
    return emptyResult();
  }
  if (!Number.isFinite(input.area) || !Number.isFinite(input.ceiling)) {
    return { ok: false, error: "nonfinite", message: "Enter finite numbers." };
  }
  if (input.area < 0 || input.ceiling < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Area and ceiling height cannot be negative.",
    };
  }
  if (input.area === 0 || input.ceiling === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Area and ceiling height must be greater than zero.",
    };
  }

  const areaSqFt = toAreaSqFt(input.area, input.areaUnit);
  const ceilingFt = toCeilingFt(input.ceiling, input.heightUnit);
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(ceilingFt)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Converted area or height is not a finite number.",
    };
  }

  const heightFactor = ceilingFt / DEFAULT_CEILING_FT;
  const notes = collectNotes(areaSqFt, ceilingFt);
  const commonBtu = input.commonBtuSizes;
  const commonTons = input.commonTons;

  if (input.mode === "cooling") {
    const btuPerSqFt =
      input.btuPerSqFt === null || !Number.isFinite(input.btuPerSqFt)
        ? DEFAULT_COOLING_BTU_PER_SQFT
        : input.btuPerSqFt;
    if (btuPerSqFt <= 0) {
      return invalidResult("BTU per square foot must be greater than zero.");
    }

    const base = areaSqFt * btuPerSqFt * heightFactor;
    const sunFraction =
      input.sunFraction === null || !Number.isFinite(input.sunFraction)
        ? defaultSunFraction(input.sun)
        : input.sunFraction;
    const sunAdj = base * sunFraction;

    const people =
      input.people === null || !Number.isFinite(input.people)
        ? PEOPLE_BASELINE
        : input.people;
    if (people < 0) {
      return invalidResult("Number of people cannot be negative.");
    }
    const perExtra =
      input.btuPerExtraPerson === null ||
      !Number.isFinite(input.btuPerExtraPerson)
        ? DEFAULT_BTU_PER_EXTRA_PERSON
        : input.btuPerExtraPerson;
    const extraPeople = Math.max(0, people - PEOPLE_BASELINE);
    const peopleAdj = extraPeople * perExtra;

    const kitchenBtu =
      input.kitchenBtu === null || !Number.isFinite(input.kitchenBtu)
        ? DEFAULT_KITCHEN_BTU
        : input.kitchenBtu;
    const kitchenAdj = input.kitchen ? kitchenBtu : 0;

    const adjustments: BtuAdjustment[] = [
      {
        id: "base",
        label: `Base (${formatBtu(areaSqFt)} ft² × ${btuPerSqFt} BTU/h per ft² × ceiling ${ceilingFt.toFixed(2)} ft ÷ 8)`,
        btuPerHour: base,
        editable: false,
      },
      {
        id: "sun",
        label:
          sunFraction === 0
            ? "Sun exposure (normal)"
            : sunFraction > 0
              ? `Sun exposure (+${(sunFraction * 100).toFixed(0)}% of base)`
              : `Sun exposure (${(sunFraction * 100).toFixed(0)}% of base)`,
        btuPerHour: sunAdj,
        editable: true,
      },
      {
        id: "people",
        label:
          extraPeople === 0
            ? `People (${people} — no extra beyond ${PEOPLE_BASELINE})`
            : `People (+${extraPeople} beyond ${PEOPLE_BASELINE} × ${perExtra} BTU/h)`,
        btuPerHour: peopleAdj,
        editable: true,
      },
      {
        id: "kitchen",
        label: input.kitchen
          ? `Kitchen (+${formatBtu(kitchenBtu)} BTU/h)`
          : "Kitchen (off)",
        btuPerHour: kitchenAdj,
        editable: true,
      },
    ];

    const requiredBtuExact = base + sunAdj + peopleAdj + kitchenAdj;
    if (!Number.isFinite(requiredBtuExact)) {
      return {
        ok: false,
        error: "nonfinite",
        message: "Result is not a finite number.",
      };
    }

    const requiredBtuRounded = roundBtuToNearest100(requiredBtuExact);
    const kw = btuHToKw(requiredBtuRounded);
    const tons = btuHToTons(requiredBtuRounded);
    const nextCommonBtu = nextCommonSize(requiredBtuRounded, commonBtu);
    const nextCommonTon = nextCommonSize(tons, commonTons);

    const working = `${formatBtu(areaSqFt)} ft² × ${btuPerSqFt} × (${ceilingFt.toFixed(2)}÷8) ${sunAdj >= 0 ? "+" : "−"} ${formatBtu(Math.abs(sunAdj))} sun ${peopleAdj > 0 ? `+ ${formatBtu(peopleAdj)} people ` : ""}${kitchenAdj > 0 ? `+ ${formatBtu(kitchenAdj)} kitchen ` : ""}= ${formatBtu(requiredBtuExact)} → ${formatBtu(requiredBtuRounded)} BTU/h (${formatTons(tons)} ton, ${formatKw(kw)} kW).`;

    return {
      ok: true,
      mode: "cooling",
      areaSqFt,
      ceilingFt,
      requiredBtuExact,
      requiredBtuRounded,
      kw,
      tons,
      nextCommonBtu,
      nextCommonTon,
      adjustments,
      working,
      notes,
    };
  }

  // Heating
  let btuPerSqFt: number;
  if (input.climate === "custom") {
    if (input.btuPerSqFt === null || !Number.isFinite(input.btuPerSqFt)) {
      return emptyResult("Enter a custom BTU/h per ft² value.");
    }
    btuPerSqFt = input.btuPerSqFt;
  } else {
    btuPerSqFt =
      input.btuPerSqFt === null || !Number.isFinite(input.btuPerSqFt)
        ? HEATING_PRESETS[input.climate].btuPerSqFt
        : input.btuPerSqFt;
  }
  if (btuPerSqFt <= 0) {
    return invalidResult("BTU per square foot must be greater than zero.");
  }

  const base = areaSqFt * btuPerSqFt * heightFactor;
  if (!Number.isFinite(base)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Result is not a finite number.",
    };
  }

  const adjustments: BtuAdjustment[] = [
    {
      id: "base",
      label: `Base (${formatBtu(areaSqFt)} ft² × ${btuPerSqFt} BTU/h per ft² × ceiling ${ceilingFt.toFixed(2)} ft ÷ 8)`,
      btuPerHour: base,
      editable: false,
    },
  ];

  const requiredBtuExact = base;
  const requiredBtuRounded = roundBtuToNearest100(requiredBtuExact);
  const kw = btuHToKw(requiredBtuRounded);
  const tons = btuHToTons(requiredBtuRounded);
  const nextCommonBtu = nextCommonSize(requiredBtuRounded, commonBtu);
  const nextCommonTon = nextCommonSize(tons, commonTons);

  const working = `${formatBtu(areaSqFt)} ft² × ${btuPerSqFt} × (${ceilingFt.toFixed(2)}÷8) = ${formatBtu(requiredBtuExact)} → ${formatBtu(requiredBtuRounded)} BTU/h (${formatKw(kw)} kW thermal). Insulation, windows, and climate change the real load.`;

  return {
    ok: true,
    mode: "heating",
    areaSqFt,
    ceilingFt,
    requiredBtuExact,
    requiredBtuRounded,
    kw,
    tons,
    nextCommonBtu,
    nextCommonTon,
    adjustments,
    working,
    notes,
  };
}

/** Convert a typed BTU/h value to kW and tons (standalone converter). */
export function convertBtuH(btuPerHour: number | null): {
  ok: true;
  kw: number;
  tons: number;
} | {
  ok: false;
  error: BtuErrorCode;
  message: string;
} {
  if (btuPerHour === null) {
    return emptyResult("Enter BTU/h to convert.");
  }
  if (!Number.isFinite(btuPerHour)) {
    return { ok: false, error: "nonfinite", message: "Enter a finite number." };
  }
  if (btuPerHour < 0) {
    return {
      ok: false,
      error: "negative",
      message: "BTU/h cannot be negative.",
    };
  }
  return {
    ok: true,
    kw: btuHToKw(btuPerHour),
    tons: btuHToTons(btuPerHour),
  };
}

/** Build a reference row for content tables (cooling, normal sun, 2 people, no kitchen). */
export function coolingReferenceRow(areaSqFt: number): {
  areaSqFt: number;
  btuPerHour: number;
  tons: number;
  kw: number;
} {
  const result = calculateBtu({
    mode: "cooling",
    area: areaSqFt,
    areaUnit: "sqft",
    ceiling: DEFAULT_CEILING_FT,
    heightUnit: "ft",
    btuPerSqFt: DEFAULT_COOLING_BTU_PER_SQFT,
    sun: "normal",
    sunFraction: 0,
    people: PEOPLE_BASELINE,
    btuPerExtraPerson: DEFAULT_BTU_PER_EXTRA_PERSON,
    kitchen: false,
    kitchenBtu: DEFAULT_KITCHEN_BTU,
    commonBtuSizes: [...DEFAULT_COMMON_BTU_SIZES],
    commonTons: [...DEFAULT_COMMON_TONS],
  });
  if (!result.ok) {
    return { areaSqFt, btuPerHour: 0, tons: 0, kw: 0 };
  }
  return {
    areaSqFt,
    btuPerHour: result.requiredBtuRounded,
    tons: result.tons,
    kw: result.kw,
  };
}
