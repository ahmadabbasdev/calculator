/**
 * Running / walking pace helpers — find pace, time, distance, or convert
 * pace ↔ speed. Internal math uses exact seconds; round only for display.
 */

export const KM_PER_MILE = 1.609344;
export const METERS_PER_KM = 1000;
export const SECONDS_PER_HOUR = 3600;

/** Calm note threshold: faster than 2:00 per km. */
export const VERY_FAST_SEC_PER_KM = 120;
/** Calm note threshold: slower than 20:00 per km. */
export const VERY_SLOW_SEC_PER_KM = 1200;

export type DistanceUnit = "km" | "miles" | "meters";
export type PaceUnit = "min-per-km" | "min-per-mile";
export type SpeedUnit = "kmh" | "mph";
export type SplitUnit = "km" | "mile";

export type PaceMode =
  | "find-pace"
  | "find-time"
  | "find-distance"
  | "convert";

export type RacePresetId =
  | "1-mile"
  | "5k"
  | "10k"
  | "half-marathon"
  | "marathon";

export const RACE_PRESETS: {
  id: RacePresetId;
  label: string;
  km: number;
}[] = [
  { id: "1-mile", label: "1 mile", km: KM_PER_MILE },
  { id: "5k", label: "5K", km: 5 },
  { id: "10k", label: "10K", km: 10 },
  { id: "half-marathon", label: "Half marathon", km: 21.0975 },
  { id: "marathon", label: "Marathon", km: 42.195 },
];

export type PaceSplit = {
  /** 1-based split index. */
  index: number;
  /** Split distance in the selected split unit. */
  distance: number;
  /** True when this is a trailing partial split. */
  partial: boolean;
  /** Duration of this split in seconds (unrounded). */
  splitSeconds: number;
  /** Cumulative time in seconds (unrounded). */
  cumulativeSeconds: number;
};

export type PaceSuccess = {
  ok: true;
  mode: PaceMode;
  /** Seconds per kilometre (exact). */
  secPerKm: number;
  /** Seconds per mile (exact). */
  secPerMile: number;
  kmh: number;
  mph: number;
  /** Total time in seconds when applicable. */
  totalSeconds: number | null;
  /** Distance in km when applicable. */
  distanceKm: number | null;
  distanceMiles: number | null;
  splits: PaceSplit[];
  notes: string[];
  working: string;
};

export type PaceFailure = {
  ok: false;
  error: "empty" | "invalid" | "negative" | "zero";
  message: string;
};

export type PaceResult = PaceSuccess | PaceFailure;

/** Round half-up to nearest integer (seconds). */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  if (value >= 0) return Math.floor(value + 0.5);
  return -Math.floor(-value + 0.5);
}

/**
 * Format a non-negative duration in seconds as H:MM:SS or M:SS,
 * rounding half-up to the nearest second with correct carry (5:59.6 → 6:00).
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  let total = roundHalfUp(seconds);
  const hours = Math.floor(total / 3600);
  total -= hours * 3600;
  const minutes = Math.floor(total / 60);
  const secs = total - minutes * 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Format pace as M:SS (minutes may exceed 59 for very slow paces). */
export function formatPace(secondsPerUnit: number): string {
  if (!Number.isFinite(secondsPerUnit) || secondsPerUnit < 0) return "—";
  const total = roundHalfUp(secondsPerUnit);
  const minutes = Math.floor(total / 60);
  const secs = total - minutes * 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function parseHms(
  hours: number | null,
  minutes: number | null,
  seconds: number | null,
): number | null {
  const h = hours ?? 0;
  const m = minutes ?? 0;
  const s = seconds ?? 0;
  if (hours === null && minutes === null && seconds === null) return null;
  if (![h, m, s].every((v) => Number.isFinite(v))) return null;
  return h * 3600 + m * 60 + s;
}

export function parsePaceMs(
  minutes: number | null,
  seconds: number | null,
): number | null {
  if (minutes === null && seconds === null) return null;
  const m = minutes ?? 0;
  const s = seconds ?? 0;
  if (![m, s].every((v) => Number.isFinite(v))) return null;
  return m * 60 + s;
}

export function distanceToKm(value: number, unit: DistanceUnit): number {
  switch (unit) {
    case "km":
      return value;
    case "miles":
      return value * KM_PER_MILE;
    case "meters":
      return value / METERS_PER_KM;
  }
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function secPerKmFromPace(sec: number, unit: PaceUnit): number {
  return unit === "min-per-km" ? sec : sec / KM_PER_MILE;
}

export function secPerKmFromSpeed(speed: number, unit: SpeedUnit): number {
  if (unit === "kmh") return SECONDS_PER_HOUR / speed;
  return SECONDS_PER_HOUR / (speed * KM_PER_MILE);
}

function paceNotes(secPerKm: number): string[] {
  const notes: string[] = [];
  if (secPerKm > 0 && secPerKm < VERY_FAST_SEC_PER_KM) {
    notes.push(
      "That pace is faster than 2:00 per km — double-check the numbers if this was unexpected.",
    );
  }
  if (secPerKm > VERY_SLOW_SEC_PER_KM) {
    notes.push(
      "That pace is slower than 20:00 per km — double-check the numbers if this was unexpected.",
    );
  }
  return notes;
}

function buildSplits(
  distanceKm: number,
  secPerKm: number,
  splitUnit: SplitUnit,
): PaceSplit[] {
  if (!(distanceKm > 0) || !(secPerKm > 0)) return [];
  const unitKm = splitUnit === "km" ? 1 : KM_PER_MILE;
  const fullSplits = Math.floor(distanceKm / unitKm + 1e-12);
  const remainderKm = distanceKm - fullSplits * unitKm;
  const splits: PaceSplit[] = [];
  let cumulative = 0;
  for (let i = 1; i <= fullSplits; i += 1) {
    const splitSeconds = secPerKm * unitKm;
    cumulative += splitSeconds;
    splits.push({
      index: i,
      distance: 1,
      partial: false,
      splitSeconds,
      cumulativeSeconds: cumulative,
    });
  }
  if (remainderKm > 1e-9) {
    const splitSeconds = secPerKm * remainderKm;
    cumulative += splitSeconds;
    splits.push({
      index: splits.length + 1,
      distance: remainderKm / unitKm,
      partial: true,
      splitSeconds,
      cumulativeSeconds: cumulative,
    });
  }
  return splits;
}

function successFromSecPerKm(
  mode: PaceMode,
  secPerKm: number,
  opts: {
    totalSeconds?: number | null;
    distanceKm?: number | null;
    splitUnit?: SplitUnit;
    working: string;
  },
): PaceSuccess {
  const secPerMile = secPerKm * KM_PER_MILE;
  const kmh = SECONDS_PER_HOUR / secPerKm;
  const mph = kmh / KM_PER_MILE;
  const distanceKm = opts.distanceKm ?? null;
  const totalSeconds =
    opts.totalSeconds ??
    (distanceKm !== null ? distanceKm * secPerKm : null);
  const splits =
    distanceKm !== null && opts.splitUnit
      ? buildSplits(distanceKm, secPerKm, opts.splitUnit)
      : [];

  return {
    ok: true,
    mode,
    secPerKm,
    secPerMile,
    kmh,
    mph,
    totalSeconds,
    distanceKm,
    distanceMiles: distanceKm === null ? null : kmToMiles(distanceKm),
    splits,
    notes: paceNotes(secPerKm),
    working: opts.working,
  };
}

/**
 * Mode 1: distance + time → pace and speed.
 */
export function findPace(input: {
  distance: number | null;
  distanceUnit: DistanceUnit;
  timeSeconds: number | null;
  splitUnit?: SplitUnit;
}): PaceResult {
  const { distance, distanceUnit, timeSeconds } = input;
  if (distance === null || timeSeconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a distance and a time to see pace and speed.",
    };
  }
  if (!Number.isFinite(distance) || !Number.isFinite(timeSeconds)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for distance and time.",
    };
  }
  if (distance < 0 || timeSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Distance and time cannot be negative.",
    };
  }
  if (distance === 0 || timeSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Distance and time must be greater than zero.",
    };
  }
  const distanceKm = distanceToKm(distance, distanceUnit);
  const secPerKm = timeSeconds / distanceKm;
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination does not produce a usable pace.",
    };
  }
  return successFromSecPerKm("find-pace", secPerKm, {
    totalSeconds: timeSeconds,
    distanceKm,
    splitUnit: input.splitUnit ?? "km",
    working: `${formatDuration(timeSeconds)} over ${roundDisplayDistance(distanceKm)} km → ${formatPace(secPerKm)}/km (${formatPace(secPerKm * KM_PER_MILE)}/mi)`,
  });
}

/**
 * Mode 2: distance + pace → time.
 */
export function findTime(input: {
  distance: number | null;
  distanceUnit: DistanceUnit;
  paceSeconds: number | null;
  paceUnit: PaceUnit;
  splitUnit?: SplitUnit;
}): PaceResult {
  const { distance, distanceUnit, paceSeconds, paceUnit } = input;
  if (distance === null || paceSeconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a distance and a pace to see total time.",
    };
  }
  if (!Number.isFinite(distance) || !Number.isFinite(paceSeconds)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for distance and pace.",
    };
  }
  if (distance < 0 || paceSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Distance and pace cannot be negative.",
    };
  }
  if (distance === 0 || paceSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Distance and pace must be greater than zero.",
    };
  }
  const distanceKm = distanceToKm(distance, distanceUnit);
  const secPerKm = secPerKmFromPace(paceSeconds, paceUnit);
  const totalSeconds = distanceKm * secPerKm;
  return successFromSecPerKm("find-time", secPerKm, {
    totalSeconds,
    distanceKm,
    splitUnit: input.splitUnit ?? "km",
    working: `${roundDisplayDistance(distanceKm)} km × ${formatPace(secPerKm)}/km = ${formatDuration(totalSeconds)}`,
  });
}

/**
 * Mode 3: time + pace → distance.
 */
export function findDistance(input: {
  timeSeconds: number | null;
  paceSeconds: number | null;
  paceUnit: PaceUnit;
  splitUnit?: SplitUnit;
}): PaceResult {
  const { timeSeconds, paceSeconds, paceUnit } = input;
  if (timeSeconds === null || paceSeconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a time and a pace to see distance.",
    };
  }
  if (!Number.isFinite(timeSeconds) || !Number.isFinite(paceSeconds)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for time and pace.",
    };
  }
  if (timeSeconds < 0 || paceSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Time and pace cannot be negative.",
    };
  }
  if (timeSeconds === 0 || paceSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Time and pace must be greater than zero.",
    };
  }
  const secPerKm = secPerKmFromPace(paceSeconds, paceUnit);
  const distanceKm = timeSeconds / secPerKm;
  return successFromSecPerKm("find-distance", secPerKm, {
    totalSeconds: timeSeconds,
    distanceKm,
    splitUnit: input.splitUnit ?? "km",
    working: `${formatDuration(timeSeconds)} ÷ ${formatPace(secPerKm)}/km = ${roundDisplayDistance(distanceKm)} km (${roundDisplayDistance(kmToMiles(distanceKm))} mi)`,
  });
}

/**
 * Mode 4: convert any one of min/km, min/mile, km/h, mph into all four.
 */
export function convertPaceSpeed(input: {
  value: number | null;
  kind: PaceUnit | SpeedUnit;
}): PaceResult {
  const { value, kind } = input;
  if (value === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a pace or speed to convert.",
    };
  }
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a valid pace or speed.",
    };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Pace and speed cannot be negative.",
    };
  }
  if (value === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Pace and speed must be greater than zero.",
    };
  }

  let secPerKm: number;
  if (kind === "min-per-km" || kind === "min-per-mile") {
    // For convert mode, value is already total seconds per unit when kind is pace.
    secPerKm = secPerKmFromPace(value, kind);
  } else {
    secPerKm = secPerKmFromSpeed(value, kind);
  }
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "That value does not produce a usable conversion.",
    };
  }
  return successFromSecPerKm("convert", secPerKm, {
    working: `${formatPace(secPerKm)}/km · ${formatPace(secPerKm * KM_PER_MILE)}/mi · ${(SECONDS_PER_HOUR / secPerKm).toFixed(2)} km/h · ${((SECONDS_PER_HOUR / secPerKm) / KM_PER_MILE).toFixed(2)} mph`,
  });
}

export function calculatePace(input: {
  mode: PaceMode;
  distance?: number | null;
  distanceUnit?: DistanceUnit;
  timeSeconds?: number | null;
  paceSeconds?: number | null;
  paceUnit?: PaceUnit;
  convertValue?: number | null;
  convertKind?: PaceUnit | SpeedUnit;
  splitUnit?: SplitUnit;
}): PaceResult {
  switch (input.mode) {
    case "find-pace":
      return findPace({
        distance: input.distance ?? null,
        distanceUnit: input.distanceUnit ?? "km",
        timeSeconds: input.timeSeconds ?? null,
        splitUnit: input.splitUnit,
      });
    case "find-time":
      return findTime({
        distance: input.distance ?? null,
        distanceUnit: input.distanceUnit ?? "km",
        paceSeconds: input.paceSeconds ?? null,
        paceUnit: input.paceUnit ?? "min-per-km",
        splitUnit: input.splitUnit,
      });
    case "find-distance":
      return findDistance({
        timeSeconds: input.timeSeconds ?? null,
        paceSeconds: input.paceSeconds ?? null,
        paceUnit: input.paceUnit ?? "min-per-km",
        splitUnit: input.splitUnit,
      });
    case "convert":
      return convertPaceSpeed({
        value: input.convertValue ?? null,
        kind: input.convertKind ?? "min-per-km",
      });
  }
}

function roundDisplayDistance(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/**
 * Build a reference row for common paces (used by the page at build time).
 */
export function paceReferenceRow(minPerKm: number): {
  minPerKm: string;
  minPerMile: string;
  kmh: string;
  mph: string;
} {
  const secPerKm = minPerKm * 60;
  const result = successFromSecPerKm("convert", secPerKm, { working: "" });
  return {
    minPerKm: formatPace(result.secPerKm),
    minPerMile: formatPace(result.secPerMile),
    kmh: result.kmh.toFixed(2),
    mph: result.mph.toFixed(2),
  };
}

/** Common paces from 4:00 to 9:00 per km (inclusive), step 1 minute. */
export function buildCommonPaceTable(): ReturnType<typeof paceReferenceRow>[] {
  const rows: ReturnType<typeof paceReferenceRow>[] = [];
  for (let m = 4; m <= 9; m += 1) {
    rows.push(paceReferenceRow(m));
  }
  return rows;
}
