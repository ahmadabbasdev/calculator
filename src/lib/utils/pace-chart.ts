/**
 * Pace charts and goal-time splits. Reuses pace.ts for constants and formatting.
 */

import {
  KM_PER_MILE,
  SECONDS_PER_HOUR,
  distanceToKm,
  formatDuration,
  formatPace,
  kmToMiles,
  roundHalfUp,
  type DistanceUnit,
  type SplitUnit,
} from "@/lib/utils/pace";

export const MAX_CHART_ROWS = 200;

export const MARATHON_KM = 42.195;
export const HALF_MARATHON_KM = 21.0975;

export type ChartRaceId = "5k" | "10k" | "half-marathon" | "marathon" | "custom";

export type PacePlan = "even" | "slower-first" | "faster-first";

export const CHART_RACE_PRESETS: {
  id: Exclude<ChartRaceId, "custom">;
  label: string;
  km: number;
  /** Default finish-time range in seconds (inclusive). */
  startSeconds: number;
  endSeconds: number;
  stepSeconds: number;
}[] = [
  {
    id: "5k",
    label: "5K",
    km: 5,
    startSeconds: 17 * 60,
    endSeconds: 45 * 60,
    stepSeconds: 60,
  },
  {
    id: "10k",
    label: "10K",
    km: 10,
    startSeconds: 35 * 60,
    endSeconds: 90 * 60,
    stepSeconds: 5 * 60,
  },
  {
    id: "half-marathon",
    label: "Half marathon",
    km: HALF_MARATHON_KM,
    startSeconds: 70 * 60,
    endSeconds: 180 * 60,
    stepSeconds: 5 * 60,
  },
  {
    id: "marathon",
    label: "Marathon",
    km: MARATHON_KM,
    startSeconds: 150 * 60,
    endSeconds: 390 * 60,
    stepSeconds: 10 * 60,
  },
];

export type PaceChartRow = {
  finishSeconds: number;
  secPerKm: number;
  secPerMile: number;
  kmh: number;
  mph: number;
};

export type PaceChartSuccess = {
  ok: true;
  distanceKm: number;
  rows: PaceChartRow[];
};

export type PaceChartFailure = {
  ok: false;
  error: "empty" | "invalid" | "negative" | "zero" | "range";
  message: string;
};

export type PaceChartResult = PaceChartSuccess | PaceChartFailure;

export type GoalSplit = {
  label: string;
  /** Distance marker in km. */
  distanceKm: number;
  /** True for trailing partial split. */
  partial: boolean;
  /** Time for this segment only (unrounded). */
  splitSeconds: number;
  /** Cumulative time (unrounded). */
  cumulativeSeconds: number;
  /** Checkpoint markers (5K, 10K, …) may also appear as rows. */
  isCheckpoint: boolean;
};

export type GoalSplitsSuccess = {
  ok: true;
  distanceKm: number;
  goalSeconds: number;
  plan: PacePlan;
  skewPercent: number;
  avgSecPerKm: number;
  firstHalfSeconds: number;
  secondHalfSeconds: number;
  halfDifferenceSeconds: number;
  splits: GoalSplit[];
  checkpoints: GoalSplit[];
  working: string;
};

export type GoalSplitsFailure = PaceChartFailure;
export type GoalSplitsResult = GoalSplitsSuccess | GoalSplitsFailure;

/** Finish time ÷ distance → pace and speed (exact seconds). */
export function rowFromFinishTime(
  distanceKm: number,
  finishSeconds: number,
): PaceChartRow {
  const secPerKm = finishSeconds / distanceKm;
  const secPerMile = secPerKm * KM_PER_MILE;
  const kmh = SECONDS_PER_HOUR / secPerKm;
  const mph = kmh / KM_PER_MILE;
  return { finishSeconds, secPerKm, secPerMile, kmh, mph };
}

export function buildPaceChart(input: {
  distanceKm: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  stepSeconds: number | null;
}): PaceChartResult {
  const { distanceKm, startSeconds, endSeconds, stepSeconds } = input;
  if (
    distanceKm === null ||
    startSeconds === null ||
    endSeconds === null ||
    stepSeconds === null
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Choose a race distance and a finish-time range to see the chart.",
    };
  }
  if (
    ![distanceKm, startSeconds, endSeconds, stepSeconds].every((v) =>
      Number.isFinite(v),
    )
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for distance and the time range.",
    };
  }
  if (distanceKm < 0 || startSeconds < 0 || endSeconds < 0 || stepSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Distance and times cannot be negative.",
    };
  }
  if (distanceKm === 0 || startSeconds === 0 || endSeconds === 0 || stepSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Distance and times must be greater than zero.",
    };
  }
  if (endSeconds < startSeconds) {
    return {
      ok: false,
      error: "range",
      message: "End time must be at or after the start time.",
    };
  }
  const span = endSeconds - startSeconds;
  const count = Math.floor(span / stepSeconds) + 1;
  if (count > MAX_CHART_ROWS) {
    return {
      ok: false,
      error: "range",
      message: `That range would create more than ${MAX_CHART_ROWS} rows. Widen the step or narrow the range.`,
    };
  }

  const rows: PaceChartRow[] = [];
  for (let t = startSeconds; t <= endSeconds + 1e-9; t += stepSeconds) {
    const finish = Math.min(t, endSeconds);
    const row = rowFromFinishTime(distanceKm, finish);
    if (
      !Number.isFinite(row.secPerKm) ||
      !Number.isFinite(row.kmh) ||
      !Number.isFinite(row.mph)
    ) {
      return {
        ok: false,
        error: "invalid",
        message: "That combination does not produce usable pace values.",
      };
    }
    rows.push(row);
    if (finish === endSeconds) break;
  }
  return { ok: true, distanceKm, rows };
}

/**
 * Symmetric half adjustment so total time is unchanged:
 * firstHalfPace = avg × (1 + s), secondHalfPace = avg × (1 − s)
 * for slower-first; signs flip for faster-first. s = percent/100.
 */
export function halfPaces(
  avgSecPerKm: number,
  plan: PacePlan,
  skewPercent: number,
): { firstSecPerKm: number; secondSecPerKm: number; s: number } {
  const raw = Math.max(0, Math.min(5, skewPercent)) / 100;
  let s = 0;
  if (plan === "slower-first") s = raw;
  if (plan === "faster-first") s = -raw;
  return {
    firstSecPerKm: avgSecPerKm * (1 + s),
    secondSecPerKm: avgSecPerKm * (1 - s),
    s,
  };
}

function marathonCheckpoints(distanceKm: number): number[] {
  const markers = [5, 10, HALF_MARATHON_KM, 30, 40];
  return markers.filter((m) => m < distanceKm - 1e-9);
}

function labelForKm(km: number): string {
  if (Math.abs(km - HALF_MARATHON_KM) < 1e-9) return "Half marathon";
  if (Number.isInteger(km)) return `${km} km`;
  return `${parseFloat(km.toFixed(4))} km`;
}

/**
 * Build even or skewed splits for a goal finish.
 * Halves split at exactly half the distance.
 */
export function buildGoalSplits(input: {
  distanceKm: number | null;
  goalSeconds: number | null;
  splitUnit?: SplitUnit;
  plan?: PacePlan;
  skewPercent?: number | null;
}): GoalSplitsResult {
  const distanceKm = input.distanceKm;
  const goalSeconds = input.goalSeconds;
  const splitUnit = input.splitUnit ?? "km";
  const plan = input.plan ?? "even";
  const skewPercent = input.skewPercent ?? 0;

  if (distanceKm === null || goalSeconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a distance and a goal finish time to see splits.",
    };
  }
  if (!Number.isFinite(distanceKm) || !Number.isFinite(goalSeconds)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for distance and goal time.",
    };
  }
  if (distanceKm < 0 || goalSeconds < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Distance and goal time cannot be negative.",
    };
  }
  if (distanceKm === 0 || goalSeconds === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Distance and goal time must be greater than zero.",
    };
  }
  if (plan !== "even" && (skewPercent < 1 || skewPercent > 5)) {
    return {
      ok: false,
      error: "range",
      message: "Choose a first-half difference between 1% and 5%.",
    };
  }

  const avgSecPerKm = goalSeconds / distanceKm;
  const { firstSecPerKm, secondSecPerKm, s } = halfPaces(
    avgSecPerKm,
    plan,
    plan === "even" ? 0 : skewPercent,
  );
  const halfDistance = distanceKm / 2;
  const firstHalfSeconds = firstSecPerKm * halfDistance;
  const secondHalfSeconds = secondSecPerKm * halfDistance;

  function cumulativeTo(markerKm: number): number {
    if (markerKm <= halfDistance) {
      return firstSecPerKm * markerKm;
    }
    return firstHalfSeconds + secondSecPerKm * (markerKm - halfDistance);
  }

  const unitKm = splitUnit === "km" ? 1 : KM_PER_MILE;
  const fullSplits = Math.floor(distanceKm / unitKm + 1e-12);
  const remainderKm = distanceKm - fullSplits * unitKm;
  const splits: GoalSplit[] = [];
  let prevMarker = 0;
  for (let i = 1; i <= fullSplits; i += 1) {
    const marker = i * unitKm;
    const cumulative = cumulativeTo(marker);
    const prevCum = cumulativeTo(prevMarker);
    splits.push({
      label: splitUnit === "km" ? `${i} km` : `${i} mi`,
      distanceKm: marker,
      partial: false,
      splitSeconds: cumulative - prevCum,
      cumulativeSeconds: cumulative,
      isCheckpoint: false,
    });
    prevMarker = marker;
  }
  if (remainderKm > 1e-9) {
    const cumulative = goalSeconds;
    const prevCum = cumulativeTo(prevMarker);
    splits.push({
      label: `Final ${parseFloat((remainderKm / unitKm).toFixed(3))} ${splitUnit === "km" ? "km" : "mi"}`,
      distanceKm,
      partial: true,
      splitSeconds: cumulative - prevCum,
      cumulativeSeconds: cumulative,
      isCheckpoint: false,
    });
  }

  const checkpoints: GoalSplit[] = marathonCheckpoints(distanceKm).map((km) => {
    const cumulative = cumulativeTo(km);
    return {
      label: labelForKm(km),
      distanceKm: km,
      partial: false,
      splitSeconds: cumulative,
      cumulativeSeconds: cumulative,
      isCheckpoint: true,
    };
  });

  for (const row of [...splits, ...checkpoints]) {
    if (
      !Number.isFinite(row.splitSeconds) ||
      !Number.isFinite(row.cumulativeSeconds)
    ) {
      return {
        ok: false,
        error: "invalid",
        message: "That combination does not produce usable splits.",
      };
    }
  }

  const planNote =
    plan === "even"
      ? "even splits"
      : plan === "slower-first"
        ? `first half ${skewPercent}% slower`
        : `first half ${skewPercent}% faster`;

  return {
    ok: true,
    distanceKm,
    goalSeconds,
    plan,
    skewPercent: plan === "even" ? 0 : skewPercent,
    avgSecPerKm,
    firstHalfSeconds,
    secondHalfSeconds,
    halfDifferenceSeconds: firstHalfSeconds - secondHalfSeconds,
    splits,
    checkpoints,
    working: `${formatDuration(goalSeconds)} over ${parseFloat(distanceKm.toFixed(4))} km · ${planNote} · halves ${formatDuration(firstHalfSeconds)} + ${formatDuration(secondHalfSeconds)}`,
  };
}

/** Escape a CSV cell; prefix formula-like values with an apostrophe. */
export function csvEscape(value: string): string {
  let cell = value;
  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function paceChartToCsv(
  rows: PaceChartRow[],
  distanceKm: number,
): string {
  const header = [
    "finish_time",
    "pace_per_km",
    "pace_per_mile",
    "kmh",
    "mph",
    "distance_km",
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        formatDuration(row.finishSeconds),
        formatPace(row.secPerKm),
        formatPace(row.secPerMile),
        row.kmh.toFixed(2),
        row.mph.toFixed(2),
        String(distanceKm),
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function resolveChartDistance(
  raceId: ChartRaceId,
  customValue: number | null,
  customUnit: DistanceUnit,
): number | null {
  if (raceId === "custom") {
    if (customValue === null) return null;
    return distanceToKm(customValue, customUnit);
  }
  return CHART_RACE_PRESETS.find((p) => p.id === raceId)?.km ?? null;
}

export function defaultRangeForRace(raceId: ChartRaceId): {
  startSeconds: number;
  endSeconds: number;
  stepSeconds: number;
} {
  const preset = CHART_RACE_PRESETS.find((p) => p.id === raceId);
  if (preset) {
    return {
      startSeconds: preset.startSeconds,
      endSeconds: preset.endSeconds,
      stepSeconds: preset.stepSeconds,
    };
  }
  return {
    startSeconds: 30 * 60,
    endSeconds: 90 * 60,
    stepSeconds: 5 * 60,
  };
}

/** Build-time sample tables for page content. */
export function buildStaticPaceChart(
  raceId: Exclude<ChartRaceId, "custom">,
): PaceChartSuccess {
  const preset = CHART_RACE_PRESETS.find((p) => p.id === raceId)!;
  const result = buildPaceChart({
    distanceKm: preset.km,
    startSeconds: preset.startSeconds,
    endSeconds: preset.endSeconds,
    stepSeconds: preset.stepSeconds,
  });
  if (!result.ok) {
    throw new Error(`Failed to build static chart for ${raceId}`);
  }
  return result;
}

export {
  KM_PER_MILE,
  formatDuration,
  formatPace,
  kmToMiles,
  roundHalfUp,
  distanceToKm,
};
