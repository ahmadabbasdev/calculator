/**
 * Watch-time arithmetic for views, hours and average view duration.
 * Pure math — no I/O. Does not encode platform programme rules.
 */

export const SECONDS_PER_HOUR = 3_600;
export const DEFAULT_TARGET_HOURS = 4_000;

export type WatchMode = "views" | "timeline" | "video";

export type WatchErrorCode =
  | "empty"
  | "invalid"
  | "negative"
  | "zero"
  | "nonfinite";

export type WatchFailure = {
  ok: false;
  error: WatchErrorCode;
  message: string;
};

export type ViewsNeededSuccess = {
  ok: true;
  mode: "views";
  targetHours: number;
  averageViewSeconds: number;
  viewsNeeded: number;
  working: string;
};

export type TimelineSuccess = {
  ok: true;
  mode: "timeline";
  currentHours: number;
  targetHours: number;
  remainingHours: number;
  monthlyHours: number;
  growthRate: number;
  /** Calendar month number in which the target is first reached (1-based). */
  monthReached: number;
  /** Interpolated months from now (e.g. 13.6 or 9.01). */
  interpolatedMonths: number;
  /** Cumulative hours gained after the last full month before the target. */
  cumulativeBefore: number;
  /** Hours gained in the month the target is reached. */
  monthGain: number;
  working: string;
};

export type OneVideoSuccess = {
  ok: true;
  mode: "video";
  averageViewSeconds: number;
  totalHours: number;
  working: string;
};

export type WatchResult =
  | ViewsNeededSuccess
  | TimelineSuccess
  | OneVideoSuccess
  | WatchFailure;

export type DurationParts = {
  minutes: number | null;
  seconds: number | null;
};

export type ViewsInput = {
  mode: "views";
  targetHours: number | null;
  /** Direct average view duration, or null when using length × percent. */
  averageMinutes: number | null;
  averageSeconds: number | null;
  videoMinutes: number | null;
  videoSeconds: number | null;
  percentViewed: number | null;
  usePercentOfLength: boolean;
};

export type TimelineInput = {
  mode: "timeline";
  currentHours: number | null;
  monthlyHours: number | null;
  growthPercent: number | null;
  targetHours: number | null;
};

export type OneVideoInput = {
  mode: "video";
  videoMinutes: number | null;
  videoSeconds: number | null;
  percentViewed: number | null;
  views: number | null;
};

export type WatchInput = ViewsInput | TimelineInput | OneVideoInput;

function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function rejectNegative(
  value: number,
  label: string,
): WatchFailure | null {
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

function rejectNonPositive(
  value: number,
  label: string,
): WatchFailure | null {
  const neg = rejectNegative(value, label);
  if (neg) return neg;
  if (value === 0) {
    return {
      ok: false,
      error: "zero",
      message: `${label} must be greater than zero.`,
    };
  }
  return null;
}

/** Convert minutes + seconds to total seconds. Missing parts count as 0. */
export function partsToSeconds(
  minutes: number | null,
  seconds: number | null,
): number | WatchFailure {
  if (minutes === null && seconds === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a duration in minutes and/or seconds.",
    };
  }
  const m = minutes ?? 0;
  const s = seconds ?? 0;
  const mErr = rejectNegative(m, "Minutes");
  if (mErr) return mErr;
  const sErr = rejectNegative(s, "Seconds");
  if (sErr) return sErr;
  const total = m * 60 + s;
  if (total === 0) {
    return {
      ok: false,
      error: "zero",
      message: "Duration must be greater than zero.",
    };
  }
  if (!Number.isFinite(total)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Duration must be a finite number.",
    };
  }
  return total;
}

export function averageViewSecondsFromPercent(
  lengthSeconds: number,
  percentViewed: number,
): number {
  return lengthSeconds * (percentViewed / 100);
}

/**
 * Views needed = ceil(targetHours × 3600 ÷ averageViewSeconds)
 */
export function viewsNeededForHours(
  targetHours: number,
  averageViewSeconds: number,
): number {
  return Math.ceil((targetHours * SECONDS_PER_HOUR) / averageViewSeconds);
}

export function hoursFromViews(
  views: number,
  averageViewSeconds: number,
): number {
  return (views * averageViewSeconds) / SECONDS_PER_HOUR;
}

/**
 * Month-by-month growth: gained in month n = monthly × (1 + growth)^(n − 1).
 * Returns when cumulative gained hours cover the remaining hours.
 */
export function monthsToTarget(options: {
  remainingHours: number;
  monthlyHours: number;
  growthRate: number;
}): {
  monthReached: number;
  interpolatedMonths: number;
  cumulativeBefore: number;
  monthGain: number;
} {
  const { remainingHours, monthlyHours, growthRate } = options;
  if (remainingHours <= 0) {
    return {
      monthReached: 0,
      interpolatedMonths: 0,
      cumulativeBefore: 0,
      monthGain: 0,
    };
  }

  let cumulative = 0;
  let month = 0;
  const maxMonths = 10_000;

  while (month < maxMonths) {
    month += 1;
    const gain = monthlyHours * Math.pow(1 + growthRate, month - 1);
    if (!Number.isFinite(gain) || gain <= 0) {
      break;
    }
    if (cumulative + gain >= remainingHours) {
      const fraction = (remainingHours - cumulative) / gain;
      return {
        monthReached: month,
        interpolatedMonths: month - 1 + fraction,
        cumulativeBefore: cumulative,
        monthGain: gain,
      };
    }
    cumulative += gain;
  }

  return {
    monthReached: month,
    interpolatedMonths: month,
    cumulativeBefore: cumulative,
    monthGain: 0,
  };
}

export function calculateWatchTime(input: WatchInput): WatchResult {
  if (input.mode === "views") return calculateViewsNeeded(input);
  if (input.mode === "timeline") return calculateTimeline(input);
  return calculateOneVideo(input);
}

function calculateViewsNeeded(input: ViewsInput): WatchResult {
  if (input.targetHours === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a target in watch hours.",
    };
  }
  const tErr = rejectNonPositive(input.targetHours, "Target watch hours");
  if (tErr) return tErr;

  let averageViewSeconds: number;

  if (input.usePercentOfLength) {
    const length = partsToSeconds(input.videoMinutes, input.videoSeconds);
    if (typeof length !== "number") return length;
    if (input.percentViewed === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter the average percentage of the video that is viewed.",
      };
    }
    const pErr = rejectNonPositive(
      input.percentViewed,
      "Average percentage viewed",
    );
    if (pErr) return pErr;
    if (input.percentViewed > 100) {
      return {
        ok: false,
        error: "invalid",
        message: "Average percentage viewed cannot be more than 100.",
      };
    }
    averageViewSeconds = averageViewSecondsFromPercent(
      length,
      input.percentViewed,
    );
  } else {
    const avg = partsToSeconds(input.averageMinutes, input.averageSeconds);
    if (typeof avg !== "number") return avg;
    averageViewSeconds = avg;
  }

  if (!Number.isFinite(averageViewSeconds) || averageViewSeconds <= 0) {
    return {
      ok: false,
      error: "zero",
      message: "Average view duration must be greater than zero.",
    };
  }

  const views = viewsNeededForHours(input.targetHours, averageViewSeconds);
  if (!Number.isFinite(views)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Views needed is not a finite number.",
    };
  }

  return {
    ok: true,
    mode: "views",
    targetHours: input.targetHours,
    averageViewSeconds,
    viewsNeeded: views,
    working: `${formatNum(input.targetHours, 2)} hours × ${SECONDS_PER_HOUR.toLocaleString("en-US")} ÷ ${formatNum(averageViewSeconds, 2)} s (${formatDuration(averageViewSeconds)}) = ${formatNum(views, 0)} views (rounded up).`,
  };
}

function calculateTimeline(input: TimelineInput): WatchResult {
  if (
    input.currentHours === null ||
    input.monthlyHours === null ||
    input.targetHours === null
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Enter current hours, monthly hours gained, and a target.",
    };
  }

  const cErr = rejectNegative(input.currentHours, "Current watch hours");
  if (cErr) return cErr;
  const mErr = rejectNonPositive(input.monthlyHours, "Hours gained per month");
  if (mErr) return mErr;
  const tErr = rejectNonPositive(input.targetHours, "Target watch hours");
  if (tErr) return tErr;

  const growthPercent = input.growthPercent ?? 0;
  const gErr = rejectNegative(growthPercent, "Monthly growth percent");
  if (gErr) return gErr;

  const remaining = input.targetHours - input.currentHours;
  if (remaining <= 0) {
    return {
      ok: true,
      mode: "timeline",
      currentHours: input.currentHours,
      targetHours: input.targetHours,
      remainingHours: 0,
      monthlyHours: input.monthlyHours,
      growthRate: growthPercent / 100,
      monthReached: 0,
      interpolatedMonths: 0,
      cumulativeBefore: 0,
      monthGain: 0,
      working: "Current hours already meet or exceed the target.",
    };
  }

  const growthRate = growthPercent / 100;
  const result = monthsToTarget({
    remainingHours: remaining,
    monthlyHours: input.monthlyHours,
    growthRate,
  });

  if (!Number.isFinite(result.interpolatedMonths)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Timeline calculation produced a non-finite result.",
    };
  }

  return {
    ok: true,
    mode: "timeline",
    currentHours: input.currentHours,
    targetHours: input.targetHours,
    remainingHours: remaining,
    monthlyHours: input.monthlyHours,
    growthRate,
    monthReached: result.monthReached,
    interpolatedMonths: result.interpolatedMonths,
    cumulativeBefore: result.cumulativeBefore,
    monthGain: result.monthGain,
    working:
      growthRate === 0
        ? `${formatNum(remaining, 2)} hours remaining ÷ ${formatNum(input.monthlyHours, 2)} per month = ${formatNum(result.interpolatedMonths, 2)} months.`
        : `With ${formatNum(growthPercent, 2)}% monthly growth, cumulative gained hours reach the remaining ${formatNum(remaining, 2)} in month ${result.monthReached} (about ${formatNum(result.interpolatedMonths, 2)} months interpolated).`,
  };
}

function calculateOneVideo(input: OneVideoInput): WatchResult {
  const length = partsToSeconds(input.videoMinutes, input.videoSeconds);
  if (typeof length !== "number") return length;

  if (input.percentViewed === null || input.views === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter average percentage viewed and the number of views.",
    };
  }

  const pErr = rejectNonPositive(
    input.percentViewed,
    "Average percentage viewed",
  );
  if (pErr) return pErr;
  if (input.percentViewed > 100) {
    return {
      ok: false,
      error: "invalid",
      message: "Average percentage viewed cannot be more than 100.",
    };
  }
  const vErr = rejectNonPositive(input.views, "Views");
  if (vErr) return vErr;

  const averageViewSeconds = averageViewSecondsFromPercent(
    length,
    input.percentViewed,
  );
  const totalHours = hoursFromViews(input.views, averageViewSeconds);

  if (!Number.isFinite(averageViewSeconds) || !Number.isFinite(totalHours)) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Video calculation produced a non-finite result.",
    };
  }

  return {
    ok: true,
    mode: "video",
    averageViewSeconds,
    totalHours,
    working: `${formatDuration(length)} at ${formatNum(input.percentViewed, 2)}% viewed = ${formatDuration(averageViewSeconds)} average; × ${formatNum(input.views, 0)} views = ${formatNum(totalHours, 2)} hours.`,
  };
}

/** Reference row: views needed for a target and average duration (seconds). */
export function viewsNeededReferenceRow(
  targetHours: number,
  averageViewSeconds: number,
): {
  targetHours: number;
  averageViewSeconds: number;
  viewsNeeded: number;
} {
  return {
    targetHours,
    averageViewSeconds,
    viewsNeeded: viewsNeededForHours(targetHours, averageViewSeconds),
  };
}
