/**
 * Steps ↔ distance helpers, plus walk-time from cadence.
 * Work in metres / whole steps; round only for display or step counts.
 */

export const METERS_PER_MILE = 1609.344;
export const METERS_PER_FOOT = 0.3048;
export const CM_PER_INCH = 2.54;
export const DEFAULT_HEIGHT_STEP_PERCENT = 41.5;

/** Calm note when step length is outside this band (cm). */
export const UNUSUAL_STEP_CM_MIN = 20;
export const UNUSUAL_STEP_CM_MAX = 200;

/** Hard calculate window (cm) — outside this returns an error. */
export const CALC_STEP_CM_MIN = 5;
export const CALC_STEP_CM_MAX = 300;

export const STEP_LENGTH_PRESETS_CM = [60, 70, 76.2, 80] as const;

export type StepLengthUnit = "cm" | "inches";
export type DistanceUnit = "km" | "miles" | "meters" | "feet";
export type StepLengthMode = "known" | "from-height";
export type StepsMode = "steps-to-distance" | "distance-to-steps" | "time-to-walk";

export type StepsSuccess = {
  ok: true;
  mode: StepsMode;
  steps: number;
  /** Exact distance in metres (unrounded). */
  meters: number;
  km: number;
  miles: number;
  feet: number;
  /** Step length used, in metres. */
  stepLengthM: number;
  stepLengthCm: number;
  /** Walk time in total minutes when applicable. */
  totalMinutes: number | null;
  hours: number | null;
  minutesPart: number | null;
  notes: string[];
  working: string;
};

export type StepsFailure = {
  ok: false;
  error: "empty" | "invalid" | "negative" | "zero" | "step-length";
  message: string;
};

export type StepsResult = StepsSuccess | StepsFailure;

export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  if (value >= 0) return Math.floor(value + 0.5);
  return -Math.floor(-value + 0.5);
}

export function cmToMeters(cm: number): number {
  return cm / 100;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function toCm(value: number, unit: StepLengthUnit): number {
  return unit === "cm" ? value : inchesToCm(value);
}

export function distanceToMeters(value: number, unit: DistanceUnit): number {
  switch (unit) {
    case "meters":
      return value;
    case "km":
      return value * 1000;
    case "miles":
      return value * METERS_PER_MILE;
    case "feet":
      return value * METERS_PER_FOOT;
  }
}

export function metersToDistance(meters: number) {
  return {
    meters,
    km: meters / 1000,
    miles: meters / METERS_PER_MILE,
    feet: meters / METERS_PER_FOOT,
  };
}

export function estimateStepLengthCm(
  height: number,
  heightUnit: StepLengthUnit,
  percent: number = DEFAULT_HEIGHT_STEP_PERCENT,
): number {
  const heightCm = toCm(height, heightUnit);
  return heightCm * (percent / 100);
}

function formatNumber(value: number, digits: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatWhole(value: number): string {
  return roundHalfUp(value).toLocaleString("en-US");
}

function stepLengthNotes(stepLengthCm: number): string[] {
  const notes: string[] = [];
  if (
    stepLengthCm < UNUSUAL_STEP_CM_MIN ||
    stepLengthCm > UNUSUAL_STEP_CM_MAX
  ) {
    notes.push(
      "That step length is unusual for most adults — double-check the value if this was unexpected.",
    );
  }
  return notes;
}

function resolveStepLengthCm(input: {
  stepLength: number | null;
  stepLengthUnit: StepLengthUnit;
  stepLengthMode: StepLengthMode;
  height: number | null;
  heightUnit: StepLengthUnit;
  heightPercent: number | null;
}): { ok: true; cm: number } | StepsFailure {
  const { stepLengthMode, stepLengthUnit, stepLength } = input;

  if (stepLengthMode === "from-height") {
    if (input.height === null || input.heightPercent === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter height and a percentage to estimate step length.",
      };
    }
    if (!Number.isFinite(input.height) || !Number.isFinite(input.heightPercent)) {
      return {
        ok: false,
        error: "invalid",
        message: "Enter valid numbers for height and percentage.",
      };
    }
    if (input.height < 0 || input.heightPercent < 0) {
      return {
        ok: false,
        error: "negative",
        message: "Height and percentage cannot be negative.",
      };
    }
    if (input.height === 0 || input.heightPercent === 0) {
      return {
        ok: false,
        error: "zero",
        message: "Height and percentage must be greater than zero.",
      };
    }
    const cm = estimateStepLengthCm(
      input.height,
      input.heightUnit,
      input.heightPercent,
    );
    if (!(cm >= CALC_STEP_CM_MIN && cm <= CALC_STEP_CM_MAX)) {
      return {
        ok: false,
        error: "step-length",
        message: `Estimated step length must be between ${CALC_STEP_CM_MIN} and ${CALC_STEP_CM_MAX} cm.`,
      };
    }
    return { ok: true, cm };
  }

  if (stepLength === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a step length to continue.",
    };
  }
  if (!Number.isFinite(stepLength)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a valid step length.",
    };
  }
  if (stepLength < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Step length cannot be negative.",
    };
  }
  if (stepLength === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Step length must be greater than zero.",
    };
  }
  const cm = toCm(stepLength, stepLengthUnit);
  if (!(cm >= CALC_STEP_CM_MIN && cm <= CALC_STEP_CM_MAX)) {
    return {
      ok: false,
      error: "step-length",
      message: `Step length must be between ${CALC_STEP_CM_MIN} and ${CALC_STEP_CM_MAX} cm (or the inch equivalent).`,
    };
  }
  return { ok: true, cm };
}

function successBase(
  mode: StepsMode,
  steps: number,
  meters: number,
  stepLengthCm: number,
  working: string,
  totalMinutes: number | null = null,
): StepsSuccess {
  const dist = metersToDistance(meters);
  const hours =
    totalMinutes === null ? null : Math.floor(totalMinutes / 60);
  const minutesPart =
    totalMinutes === null ? null : roundHalfUp(totalMinutes - hours! * 60);
  return {
    ok: true,
    mode,
    steps,
    meters: dist.meters,
    km: dist.km,
    miles: dist.miles,
    feet: dist.feet,
    stepLengthM: cmToMeters(stepLengthCm),
    stepLengthCm,
    totalMinutes,
    hours,
    minutesPart,
    notes: stepLengthNotes(stepLengthCm),
    working,
  };
}

export type StepsInput = {
  mode: StepsMode;
  steps?: number | null;
  distance?: number | null;
  distanceUnit?: DistanceUnit;
  cadence?: number | null;
  stepLength?: number | null;
  stepLengthUnit?: StepLengthUnit;
  stepLengthMode?: StepLengthMode;
  height?: number | null;
  heightUnit?: StepLengthUnit;
  heightPercent?: number | null;
};

/** Convert steps → distance in metres (exact product). */
export function stepsToMeters(steps: number, stepLengthM: number): number {
  return steps * stepLengthM;
}

/** Convert distance → steps, rounded to nearest whole step. */
export function metersToSteps(meters: number, stepLengthM: number): number {
  return roundHalfUp(meters / stepLengthM);
}

export function walkMinutes(steps: number, cadence: number): number {
  return steps / cadence;
}

export function formatWalkTime(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "—";
  const rounded = roundHalfUp(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded - hours * 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function calculateSteps(input: StepsInput): StepsResult {
  const stepResolved = resolveStepLengthCm({
    stepLength: input.stepLength ?? null,
    stepLengthUnit: input.stepLengthUnit ?? "cm",
    stepLengthMode: input.stepLengthMode ?? "known",
    height: input.height ?? null,
    heightUnit: input.heightUnit ?? "cm",
    heightPercent: input.heightPercent ?? DEFAULT_HEIGHT_STEP_PERCENT,
  });
  if (!stepResolved.ok) return stepResolved;

  const stepLengthCm = stepResolved.cm;
  const stepLengthM = cmToMeters(stepLengthCm);

  switch (input.mode) {
    case "steps-to-distance": {
      const steps = input.steps ?? null;
      if (steps === null) {
        return {
          ok: false,
          error: "empty",
          message: "Enter a number of steps to see distance.",
        };
      }
      if (!Number.isFinite(steps)) {
        return {
          ok: false,
          error: "invalid",
          message: "Enter a valid number of steps.",
        };
      }
      if (steps < 0) {
        return {
          ok: false,
          error: "negative",
          message: "Steps cannot be negative.",
        };
      }
      if (steps === 0) {
        return {
          ok: false,
          error: "zero",
          message: "Steps must be greater than zero.",
        };
      }
      const meters = stepsToMeters(steps, stepLengthM);
      if (!Number.isFinite(meters)) {
        return {
          ok: false,
          error: "invalid",
          message: "That combination does not produce a usable distance.",
        };
      }
      return successBase(
        "steps-to-distance",
        steps,
        meters,
        stepLengthCm,
        `${formatWhole(steps)} × ${formatNumber(stepLengthM, 3)} m = ${formatNumber(meters, 1)} m`,
      );
    }
    case "distance-to-steps": {
      const distance = input.distance ?? null;
      const unit = input.distanceUnit ?? "km";
      if (distance === null) {
        return {
          ok: false,
          error: "empty",
          message: "Enter a distance to see the number of steps.",
        };
      }
      if (!Number.isFinite(distance)) {
        return {
          ok: false,
          error: "invalid",
          message: "Enter a valid distance.",
        };
      }
      if (distance < 0) {
        return {
          ok: false,
          error: "negative",
          message: "Distance cannot be negative.",
        };
      }
      if (distance === 0) {
        return {
          ok: false,
          error: "zero",
          message: "Distance must be greater than zero.",
        };
      }
      const meters = distanceToMeters(distance, unit);
      const steps = metersToSteps(meters, stepLengthM);
      if (!Number.isFinite(steps)) {
        return {
          ok: false,
          error: "invalid",
          message: "That combination does not produce a usable step count.",
        };
      }
      return successBase(
        "distance-to-steps",
        steps,
        meters,
        stepLengthCm,
        `${formatNumber(meters, 1)} m ÷ ${formatNumber(stepLengthM, 3)} m ≈ ${formatWhole(steps)} steps`,
      );
    }
    case "time-to-walk": {
      const steps = input.steps ?? null;
      const cadence = input.cadence ?? null;
      if (steps === null || cadence === null) {
        return {
          ok: false,
          error: "empty",
          message: "Enter steps and a cadence (steps per minute).",
        };
      }
      if (!Number.isFinite(steps) || !Number.isFinite(cadence)) {
        return {
          ok: false,
          error: "invalid",
          message: "Enter valid numbers for steps and cadence.",
        };
      }
      if (steps < 0 || cadence < 0) {
        return {
          ok: false,
          error: "negative",
          message: "Steps and cadence cannot be negative.",
        };
      }
      if (steps === 0 || cadence === 0) {
        return {
          ok: false,
          error: "zero",
          message: "Steps and cadence must be greater than zero.",
        };
      }
      const totalMinutes = walkMinutes(steps, cadence);
      if (!Number.isFinite(totalMinutes)) {
        return {
          ok: false,
          error: "invalid",
          message: "That combination does not produce a usable time.",
        };
      }
      const meters = stepsToMeters(steps, stepLengthM);
      return successBase(
        "time-to-walk",
        steps,
        meters,
        stepLengthCm,
        `${formatWhole(steps)} steps ÷ ${formatNumber(cadence, 0)} steps/min = ${formatWalkTime(totalMinutes)}`,
        totalMinutes,
      );
    }
  }
}

/**
 * Build a reference row for the content table (used at build time).
 */
export function stepsReferenceRow(
  steps: number,
  stepLengthCm: number,
): {
  steps: number;
  stepLengthCm: number;
  km: string;
  miles: string;
} {
  const meters = stepsToMeters(steps, cmToMeters(stepLengthCm));
  const dist = metersToDistance(meters);
  return {
    steps,
    stepLengthCm,
    km: dist.km.toFixed(2),
    miles: dist.miles.toFixed(2),
  };
}

/** Reference table: 1,000–20,000 steps at a few step lengths. */
export function buildStepsReferenceTable(): {
  stepLengthsCm: number[];
  stepCounts: number[];
  rows: ReturnType<typeof stepsReferenceRow>[];
} {
  const stepLengthsCm = [60, 70, 76.2, 80];
  const stepCounts = [1000, 5000, 10000, 15000, 20000];
  const rows: ReturnType<typeof stepsReferenceRow>[] = [];
  for (const steps of stepCounts) {
    for (const cm of stepLengthsCm) {
      rows.push(stepsReferenceRow(steps, cm));
    }
  }
  return { stepLengthsCm, stepCounts, rows };
}
