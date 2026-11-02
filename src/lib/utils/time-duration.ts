/**
 * Pure clock-time arithmetic for the Time Duration Calculator.
 * All math uses integer minutes and Date.UTC day ordinals so the browser
 * time zone and daylight saving never change results.
 */

export type TimeDurationMode = "between" | "add-subtract" | "timecard";

export type AddSubtractOp = "add" | "subtract";

export type HourDisplay = "24h" | "12h";

/** Maximum duration days accepted in add/subtract mode. */
export const MAX_DURATION_DAYS = 3650;

/** Minutes in one calendar day (wall clock, no DST). */
export const MINUTES_PER_DAY = 24 * 60;

export type ParsedTime = {
  /** Minutes from midnight, 0–1439. */
  minutesFromMidnight: number;
  hours: number;
  minutes: number;
};

export type DurationParts = {
  totalMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
};

export type BetweenInput = {
  startTime: string;
  endTime: string;
  /** YYYY-MM-DD or empty */
  startDate: string;
  endDate: string;
  breakMinutes: number | null;
  /**
   * When no dates are set: treat the end clock as the next calendar day.
   * Auto-suggested when end &lt; start; also used for same start/end → 24 hours.
   * Unchecking when end &lt; start returns an end-before-start error instead.
   */
  treatEndAsNextDay: boolean;
};

export type BetweenSuccess = {
  ok: true;
  duration: DurationParts;
  overnight: boolean;
  nextDayNote: string | null;
  working: string;
};

export type BetweenFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid_time"
    | "invalid_date"
    | "break_range"
    | "break_exceeds"
    | "end_before_start";
  message: string;
};

export type BetweenResult = BetweenSuccess | BetweenFailure;

export type AddSubtractInput = {
  startTime: string;
  startDate: string;
  days: number | null;
  hours: number | null;
  minutes: number | null;
  operation: AddSubtractOp;
};

export type AddSubtractSuccess = {
  ok: true;
  resultTime: ParsedTime;
  /** Absolute day offset from the start calendar day (negative = earlier). */
  dayOffset: number;
  /** YYYY-MM-DD when a start date was provided. */
  resultDate: string | null;
  dayLabel: string | null;
  working: string;
};

export type AddSubtractFailure = {
  ok: false;
  error: "empty" | "invalid_time" | "invalid_date" | "invalid_duration" | "days_cap";
  message: string;
};

export type AddSubtractResult = AddSubtractSuccess | AddSubtractFailure;

export type TimecardRowInput = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  breakMinutes: number | null;
};

export type TimecardRowResult = {
  id: string;
  label: string;
  ok: boolean;
  overnight: boolean;
  duration: DurationParts | null;
  error: string | null;
};

export type TimecardSuccess = {
  ok: true;
  rows: TimecardRowResult[];
  total: DurationParts;
  average: DurationParts;
  filledRowCount: number;
  working: string;
};

export type TimecardFailure = {
  ok: false;
  error: "empty" | "row_error";
  message: string;
  rows: TimecardRowResult[];
};

export type TimecardResult = TimecardSuccess | TimecardFailure;

/** Parse HTML time input "HH:MM" or "HH:MM:SS" into minutes from midnight. */
export function parseTimeInput(raw: string): ParsedTime | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return {
    hours,
    minutes,
    minutesFromMidnight: hours * 60 + minutes,
  };
}

/**
 * Parse YYYY-MM-DD into a day ordinal (UTC days since epoch).
 * Returns null for empty or invalid calendar dates.
 */
export function parseDateInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return utc / (MINUTES_PER_DAY * 60 * 1000);
}

export function formatDateFromDayOrdinal(dayOrdinal: number): string {
  const ms = dayOrdinal * MINUTES_PER_DAY * 60 * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function durationFromMinutes(totalMinutes: number): DurationParts {
  const safe = Math.max(0, Math.floor(totalMinutes));
  return {
    totalMinutes: safe,
    hours: Math.floor(safe / 60),
    minutes: safe % 60,
    decimalHours: safe / 60,
  };
}

/** Display "H hours M minutes" (singular/plural). */
export function formatDurationLong(parts: DurationParts): string {
  const hLabel = parts.hours === 1 ? "hour" : "hours";
  const mLabel = parts.minutes === 1 ? "minute" : "minutes";
  return `${parts.hours} ${hLabel} ${parts.minutes} ${mLabel}`;
}

/** Compact "8 h 30 min". */
export function formatDurationCompact(parts: DurationParts): string {
  return `${parts.hours} h ${String(parts.minutes).padStart(2, "0")} min`;
}

/** Decimal hours to 2 places for display. */
export function formatDecimalHours(parts: DurationParts): string {
  return parts.decimalHours.toFixed(2);
}

/** Exact fraction string for working lines, e.g. "510/60". */
export function formatExactFraction(totalMinutes: number): string {
  return `${totalMinutes}/60`;
}

export function formatClockTime(
  time: ParsedTime,
  display: HourDisplay = "24h",
): string {
  if (display === "24h") {
    return `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
  }
  const period = time.hours >= 12 ? "PM" : "AM";
  let hour12 = time.hours % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(time.minutes).padStart(2, "0")} ${period}`;
}

export function minutesToParsedTime(totalMinutesFromMidnight: number): ParsedTime {
  const normalized =
    ((totalMinutesFromMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return { hours, minutes, minutesFromMidnight: normalized };
}

export function parseNonNegativeInt(
  raw: string | number | null | undefined,
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return Math.floor(raw);
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function dayOffsetLabel(offset: number): string {
  if (offset === 0) return "same day";
  if (offset === 1) return "next day";
  if (offset === -1) return "previous day";
  if (offset > 1) return `+${offset} days`;
  return `${offset} days`;
}

/**
 * Duration between two wall-clock times.
 * With no dates: if end < start, treat end as next day (overnight).
 * Same start/end → 0 unless forceNextDay → 24 hours.
 */
export function calculateTimeBetween(input: BetweenInput): BetweenResult {
  const start = parseTimeInput(input.startTime);
  const end = parseTimeInput(input.endTime);
  if (!start && !end) {
    return { ok: false, error: "empty", message: "" };
  }
  if (!start || !end) {
    return {
      ok: false,
      error: "invalid_time",
      message: "Enter a valid start time and end time.",
    };
  }

  const hasStartDate = Boolean(input.startDate.trim());
  const hasEndDate = Boolean(input.endDate.trim());
  if (hasStartDate !== hasEndDate) {
    return {
      ok: false,
      error: "invalid_date",
      message: "Enter both a start date and an end date, or leave both blank.",
    };
  }

  let startTotal: number;
  let endTotal: number;
  let overnight = false;
  let nextDayNote: string | null = null;

  if (hasStartDate && hasEndDate) {
    const startDay = parseDateInput(input.startDate);
    const endDay = parseDateInput(input.endDate);
    if (startDay === null || endDay === null) {
      return {
        ok: false,
        error: "invalid_date",
        message: "Enter valid start and end dates.",
      };
    }
    startTotal = startDay * MINUTES_PER_DAY + start.minutesFromMidnight;
    endTotal = endDay * MINUTES_PER_DAY + end.minutesFromMidnight;
    if (endTotal < startTotal) {
      return {
        ok: false,
        error: "end_before_start",
        message: "The end date and time is before the start. Check the dates.",
      };
    }
    if (endDay > startDay) {
      overnight = endDay === startDay + 1;
      if (endDay > startDay) {
        nextDayNote =
          endDay === startDay + 1
            ? "End time is on the next day"
            : `End is ${endDay - startDay} days after the start`;
      }
    }
  } else {
    startTotal = start.minutesFromMidnight;
    endTotal = end.minutesFromMidnight;
    if (endTotal < startTotal) {
      if (input.treatEndAsNextDay) {
        endTotal += MINUTES_PER_DAY;
        overnight = true;
        nextDayNote = "End time is on the next day";
      } else {
        return {
          ok: false,
          error: "end_before_start",
          message:
            "The end time is earlier than the start. Tick “End time is on the next day”, or add dates.",
        };
      }
    } else if (endTotal === startTotal && input.treatEndAsNextDay) {
      endTotal += MINUTES_PER_DAY;
      overnight = true;
      nextDayNote = "End time is on the next day";
    }
  }

  let span = endTotal - startTotal;
  if (span < 0) {
    return {
      ok: false,
      error: "end_before_start",
      message: "The end is before the start. Check the times.",
    };
  }

  const breakRaw = input.breakMinutes;
  if (breakRaw === null) {
    // Treat missing break as 0 when times are present.
  }
  const breakMinutes =
    breakRaw === null || breakRaw === undefined ? 0 : breakRaw;
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    return {
      ok: false,
      error: "break_range",
      message: "Break minutes cannot be negative.",
    };
  }
  const breakFloor = Math.floor(breakMinutes);
  if (breakFloor > span) {
    return {
      ok: false,
      error: "break_exceeds",
      message:
        "The unpaid break is longer than the time span. Shorten the break or check the times.",
    };
  }

  const net = span - breakFloor;
  const duration = durationFromMinutes(net);

  const startLabel = formatClockTime(start, "24h");
  const endLabel = formatClockTime(end, "24h");
  const gross = durationFromMinutes(span);
  let working = `${endLabel} − ${startLabel} = ${formatDurationCompact(gross)}`;
  if (breakFloor > 0) {
    working += `; minus ${breakFloor} min break = ${formatDurationCompact(duration)}`;
  }

  return {
    ok: true,
    duration,
    overnight,
    nextDayNote,
    working,
  };
}

export function calculateAddSubtract(input: AddSubtractInput): AddSubtractResult {
  const start = parseTimeInput(input.startTime);
  if (!start) {
    if (!input.startTime.trim()) {
      return { ok: false, error: "empty", message: "" };
    }
    return {
      ok: false,
      error: "invalid_time",
      message: "Enter a valid start time.",
    };
  }

  const days = input.days ?? 0;
  const hours = input.hours ?? 0;
  const minutes = input.minutes ?? 0;

  if (
    !Number.isFinite(days) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    days < 0 ||
    hours < 0 ||
    minutes < 0
  ) {
    return {
      ok: false,
      error: "invalid_duration",
      message: "Days, hours, and minutes must be zero or positive whole numbers.",
    };
  }

  const daysFloor = Math.floor(days);
  const hoursFloor = Math.floor(hours);
  const minutesFloor = Math.floor(minutes);

  if (daysFloor > MAX_DURATION_DAYS) {
    return {
      ok: false,
      error: "days_cap",
      message: `Keep the day amount at ${MAX_DURATION_DAYS.toLocaleString()} or fewer.`,
    };
  }

  if (daysFloor === 0 && hoursFloor === 0 && minutesFloor === 0) {
    // Zero shift is allowed — result equals start.
  }

  const delta =
    daysFloor * MINUTES_PER_DAY + hoursFloor * 60 + minutesFloor;
  const signed = input.operation === "add" ? delta : -delta;

  const startDayOrdinal = input.startDate.trim()
    ? parseDateInput(input.startDate)
    : 0;
  if (input.startDate.trim() && startDayOrdinal === null) {
    return {
      ok: false,
      error: "invalid_date",
      message: "Enter a valid start date, or leave the date blank.",
    };
  }

  const baseDay = startDayOrdinal ?? 0;
  const absoluteStart = baseDay * MINUTES_PER_DAY + start.minutesFromMidnight;
  const absoluteEnd = absoluteStart + signed;
  // Handle negative absolute minutes carefully for floor division.
  let dayOrdinal: number;
  let minuteOfDay: number;
  if (absoluteEnd >= 0) {
    dayOrdinal = Math.floor(absoluteEnd / MINUTES_PER_DAY);
    minuteOfDay = absoluteEnd % MINUTES_PER_DAY;
  } else {
    const rem = ((absoluteEnd % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    dayOrdinal = (absoluteEnd - rem) / MINUTES_PER_DAY;
    minuteOfDay = rem;
  }

  const resultTime = minutesToParsedTime(minuteOfDay);
  const dayOffset = dayOrdinal - baseDay;
  const hasDate = Boolean(input.startDate.trim());
  const resultDate = hasDate ? formatDateFromDayOrdinal(dayOrdinal) : null;
  const dayLabel = dayOffset === 0 && hasDate ? null : dayOffsetLabel(dayOffset);

  const opWord = input.operation === "add" ? "+" : "−";
  const parts: string[] = [];
  if (daysFloor) parts.push(`${daysFloor}d`);
  if (hoursFloor) parts.push(`${hoursFloor}h`);
  if (minutesFloor) parts.push(`${minutesFloor}min`);
  const durationLabel = parts.length ? parts.join(" ") : "0 min";
  const startLabel = formatClockTime(start, "24h");
  const resultLabel = formatClockTime(resultTime, "24h");
  let working = `${startLabel} ${opWord} ${durationLabel} = ${resultLabel}`;
  if (dayOffset !== 0) {
    working += ` (${dayOffsetLabel(dayOffset)})`;
  } else {
    working += " (same day)";
  }

  return {
    ok: true,
    resultTime,
    dayOffset,
    resultDate,
    dayLabel: dayOffset === 0 ? (hasDate ? "same day" : "same day") : dayLabel,
    working,
  };
}

export function calculateTimecard(rows: TimecardRowInput[]): TimecardResult {
  const rowResults: TimecardRowResult[] = rows.map((row) => {
    const startEmpty = !row.startTime.trim();
    const endEmpty = !row.endTime.trim();
    if (startEmpty && endEmpty) {
      return {
        id: row.id,
        label: row.label,
        ok: true,
        overnight: false,
        duration: null,
        error: null,
      };
    }
    if (startEmpty || endEmpty) {
      return {
        id: row.id,
        label: row.label,
        ok: false,
        overnight: false,
        duration: null,
        error: "Enter both start and end times, or leave the row blank.",
      };
    }

    const startParsed = parseTimeInput(row.startTime);
    const endParsed = parseTimeInput(row.endTime);
    const overnightSuggested =
      Boolean(startParsed && endParsed) &&
      endParsed!.minutesFromMidnight < startParsed!.minutesFromMidnight;

    const between = calculateTimeBetween({
      startTime: row.startTime,
      endTime: row.endTime,
      startDate: "",
      endDate: "",
      breakMinutes: row.breakMinutes ?? 0,
      treatEndAsNextDay: overnightSuggested,
    });

    if (!between.ok) {
      return {
        id: row.id,
        label: row.label,
        ok: false,
        overnight: false,
        duration: null,
        error: between.message || "Could not calculate this row.",
      };
    }

    return {
      id: row.id,
      label: row.label,
      ok: true,
      overnight: between.overnight,
      duration: between.duration,
      error: null,
    };
  });

  const filled = rowResults.filter((r) => r.duration !== null);
  const failed = rowResults.filter((r) => !r.ok);

  if (filled.length === 0 && failed.length === 0) {
    return {
      ok: false,
      error: "empty",
      message: "",
      rows: rowResults,
    };
  }

  if (failed.length > 0 && filled.length === 0) {
    return {
      ok: false,
      error: "row_error",
      message: failed[0]?.error ?? "Check the times in each row.",
      rows: rowResults,
    };
  }

  if (failed.length > 0) {
    return {
      ok: false,
      error: "row_error",
      message: "Fix the highlighted rows to see a total.",
      rows: rowResults,
    };
  }

  const totalMinutes = filled.reduce(
    (sum, row) => sum + (row.duration?.totalMinutes ?? 0),
    0,
  );
  const total = durationFromMinutes(totalMinutes);
  const average = durationFromMinutes(
    Math.floor(totalMinutes / filled.length),
  );

  const working = filled
    .map((row) => formatDurationCompact(row.duration!))
    .join(" + ");

  return {
    ok: true,
    rows: rowResults,
    total,
    average,
    filledRowCount: filled.length,
    working: `${working} = ${formatDurationCompact(total)}`,
  };
}
