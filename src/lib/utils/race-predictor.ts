/**
 * Race time predictions via Peter Riegel's one-exponent model:
 * T2 = T1 × (D2 ÷ D1)^e
 *
 * Reuses distance/time formatting from pace.ts — do not duplicate constants.
 */

import {
  KM_PER_MILE,
  distanceToKm,
  formatDuration,
  formatPace,
  roundHalfUp,
  type DistanceUnit,
} from "@/lib/utils/pace";

export const DEFAULT_RIEGEL_EXPONENT = 1.06;
export const MIN_RIEGEL_EXPONENT = 1.0;
export const MAX_RIEGEL_EXPONENT = 1.15;

export const MIN_DISTANCE_KM = 1;
export const MAX_DISTANCE_KM = 100;

export type RacePredictorPresetId =
  | "1-mile"
  | "3k"
  | "5k"
  | "10k"
  | "15k"
  | "10-miles"
  | "half-marathon"
  | "marathon"
  | "custom";

export const RACE_PREDICTOR_PRESETS: {
  id: Exclude<RacePredictorPresetId, "custom">;
  label: string;
  km: number;
}[] = [
  { id: "1-mile", label: "1 mile", km: KM_PER_MILE },
  { id: "3k", label: "3K", km: 3 },
  { id: "5k", label: "5K", km: 5 },
  { id: "10k", label: "10K", km: 10 },
  { id: "15k", label: "15K", km: 15 },
  { id: "10-miles", label: "10 miles", km: 10 * KM_PER_MILE },
  { id: "half-marathon", label: "Half marathon", km: 21.0975 },
  { id: "marathon", label: "Marathon", km: 42.195 },
];

/** Standard prediction table distances (same set as presets without custom). */
export const PREDICTION_TARGETS = RACE_PREDICTOR_PRESETS;

export type PredictedRaceRow = {
  id: string;
  label: string;
  distanceKm: number;
  /** Unrounded predicted time in seconds. */
  timeSeconds: number;
  secPerKm: number;
  secPerMile: number;
  /** True when this row is the input race (same distance). */
  isInput: boolean;
};

export type RacePredictorSuccess = {
  ok: true;
  inputDistanceKm: number;
  inputTimeSeconds: number;
  exponent: number;
  rows: PredictedRaceRow[];
  /** One worked example for a non-input row when available. */
  working: string | null;
  notes: string[];
};

export type RacePredictorFailure = {
  ok: false;
  error: "empty" | "invalid" | "negative" | "zero" | "range";
  message: string;
};

export type RacePredictorResult = RacePredictorSuccess | RacePredictorFailure;

/**
 * Peter Riegel prediction: T2 = T1 × (D2 ÷ D1)^e
 * Distances must be in the same unit; times in seconds.
 */
export function predictRaceTime(
  t1Seconds: number,
  d1Km: number,
  d2Km: number,
  exponent: number = DEFAULT_RIEGEL_EXPONENT,
): number {
  if (!(d1Km > 0) || !(d2Km > 0) || !(t1Seconds > 0)) return NaN;
  if (d1Km === d2Km) return t1Seconds;
  return t1Seconds * (d2Km / d1Km) ** exponent;
}

function distancesMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

function formatKmLabel(km: number): string {
  if (Number.isInteger(km)) return String(km);
  return parseFloat(km.toFixed(4)).toString();
}

function buildWorking(
  t1: number,
  d1: number,
  d2: number,
  exponent: number,
  t2: number,
): string {
  return `${formatDuration(t1)} × (${formatKmLabel(d2)} ÷ ${formatKmLabel(d1)})^${exponent.toFixed(2)} = ${formatDuration(t2)}`;
}

export type RacePredictorInput = {
  distanceKm: number | null;
  timeSeconds: number | null;
  exponent?: number | null;
  /** Optional extra target distance in km. */
  customTargetKm?: number | null;
};

export function calculateRacePredictions(
  input: RacePredictorInput,
): RacePredictorResult {
  const { distanceKm, timeSeconds } = input;
  const exponent =
    input.exponent === null || input.exponent === undefined
      ? DEFAULT_RIEGEL_EXPONENT
      : input.exponent;

  if (distanceKm === null || timeSeconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a recent race distance and finish time to see predictions.",
    };
  }
  if (!Number.isFinite(distanceKm) || !Number.isFinite(timeSeconds)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for distance and time.",
    };
  }
  if (distanceKm < 0 || timeSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Distance and time cannot be negative.",
    };
  }
  if (distanceKm === 0 || timeSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Distance and time must be greater than zero.",
    };
  }
  if (distanceKm < MIN_DISTANCE_KM || distanceKm > MAX_DISTANCE_KM) {
    return {
      ok: false,
      error: "range",
      message: `Race distance must be between ${MIN_DISTANCE_KM} km and ${MAX_DISTANCE_KM} km.`,
    };
  }
  if (
    !Number.isFinite(exponent) ||
    exponent < MIN_RIEGEL_EXPONENT ||
    exponent > MAX_RIEGEL_EXPONENT
  ) {
    return {
      ok: false,
      error: "range",
      message: `Exponent must be between ${MIN_RIEGEL_EXPONENT.toFixed(2)} and ${MAX_RIEGEL_EXPONENT.toFixed(2)}.`,
    };
  }

  const targets: { id: string; label: string; km: number }[] = [
    ...PREDICTION_TARGETS.map((t) => ({
      id: t.id,
      label: t.label,
      km: t.km,
    })),
  ];

  const customTargetKm = input.customTargetKm ?? null;
  if (customTargetKm !== null) {
    if (!Number.isFinite(customTargetKm) || customTargetKm <= 0) {
      return {
        ok: false,
        error: "invalid",
        message: "Enter a valid custom target distance.",
      };
    }
    if (customTargetKm < MIN_DISTANCE_KM || customTargetKm > MAX_DISTANCE_KM) {
      return {
        ok: false,
        error: "range",
        message: `Custom target must be between ${MIN_DISTANCE_KM} km and ${MAX_DISTANCE_KM} km.`,
      };
    }
    const alreadyListed = targets.some((t) => distancesMatch(t.km, customTargetKm));
    if (!alreadyListed) {
      targets.push({
        id: "custom-target",
        label: `${customTargetKm.toFixed(2).replace(/\.?0+$/, "")} km (custom)`,
        km: customTargetKm,
      });
      targets.sort((a, b) => a.km - b.km);
    }
  }

  const rows: PredictedRaceRow[] = targets.map((target) => {
    const timeSecondsPred = predictRaceTime(
      timeSeconds,
      distanceKm,
      target.km,
      exponent,
    );
    const secPerKm = timeSecondsPred / target.km;
    const secPerMile = secPerKm * KM_PER_MILE;
    return {
      id: target.id,
      label: target.label,
      distanceKm: target.km,
      timeSeconds: timeSecondsPred,
      secPerKm,
      secPerMile,
      isInput: distancesMatch(target.km, distanceKm),
    };
  });

  // If input distance is not a standard target, still mark matching custom or none.
  if (!rows.some((r) => r.isInput)) {
    // Inject input row so the table can show the entered race.
    const secPerKm = timeSeconds / distanceKm;
    rows.push({
      id: "input-race",
      label: `${distanceKm.toFixed(2).replace(/\.?0+$/, "")} km (your race)`,
      distanceKm,
      timeSeconds,
      secPerKm,
      secPerMile: secPerKm * KM_PER_MILE,
      isInput: true,
    });
    rows.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  for (const row of rows) {
    if (
      !Number.isFinite(row.timeSeconds) ||
      !Number.isFinite(row.secPerKm) ||
      !Number.isFinite(row.secPerMile)
    ) {
      return {
        ok: false,
        error: "invalid",
        message: "That combination does not produce usable predictions.",
      };
    }
  }

  const exampleRow =
    rows.find((r) => !r.isInput && r.distanceKm > distanceKm) ??
    rows.find((r) => !r.isInput);

  const working = exampleRow
    ? buildWorking(
        timeSeconds,
        distanceKm,
        exampleRow.distanceKm,
        exponent,
        exampleRow.timeSeconds,
      )
    : null;

  return {
    ok: true,
    inputDistanceKm: distanceKm,
    inputTimeSeconds: timeSeconds,
    exponent,
    rows,
    working,
    notes: [
      "Predictions become less reliable the farther the target distance is from the race you entered. They do not account for training, course, weather, pacing, or fatigue.",
    ],
  };
}

export function resolveInputDistanceKm(
  value: number | null,
  unit: DistanceUnit,
): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  return distanceToKm(value, unit);
}

/** Round half-up helper re-exported for tests that compare displayed seconds. */
export { roundHalfUp, formatDuration, formatPace, KM_PER_MILE };
