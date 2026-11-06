/**
 * Calendar-method ovulation and fertile-window estimates.
 * Local calendar dates only (date-fns) — no time-zone conversion math.
 */

import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

export const CYCLE_LENGTH_DEFAULT = 28;
export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 45;

export const LUTEAL_LENGTH_DEFAULT = 14;
export const LUTEAL_LENGTH_MIN = 10;
export const LUTEAL_LENGTH_MAX = 16;

/** Days before ovulation included in the fertile window (inclusive through ovulation). */
export const FERTILE_DAYS_BEFORE_OVULATION = 5;

export type CycleEstimate = {
  /** 0 = current cycle from LMP; 1..3 = following cycles. */
  cycleIndex: number;
  periodStart: Date;
  nextPeriod: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
};

export type OvulationSuccess = {
  ok: true;
  cycles: CycleEstimate[];
  cycleLength: number;
  lutealLength: number;
};

export type OvulationFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid_date"
    | "future_lmp"
    | "cycle_out_of_range"
    | "luteal_out_of_range";
  message: string;
};

export type OvulationResult = OvulationSuccess | OvulationFailure;

export function parseLocalDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = parseISO(value.trim());
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

export function formatDisplayDateWithWeekday(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function formatShortWeekdayDate(date: Date): string {
  return format(date, "EEE, MMM d, yyyy");
}

function estimateOneCycle(
  periodStart: Date,
  cycleLength: number,
  lutealLength: number,
  cycleIndex: number,
): CycleEstimate {
  const nextPeriod = addDays(periodStart, cycleLength);
  const ovulation = addDays(nextPeriod, -lutealLength);
  const fertileStart = addDays(ovulation, -FERTILE_DAYS_BEFORE_OVULATION);
  const fertileEnd = ovulation;
  return {
    cycleIndex,
    periodStart,
    nextPeriod,
    ovulation,
    fertileStart,
    fertileEnd,
  };
}

/**
 * Calendar method: next period = LMP + cycle length;
 * ovulation = next period − luteal length;
 * fertile window = ovulation − 5 days through ovulation day (6 days).
 * Returns the current cycle plus the next three cycles.
 */
export function calculateOvulation(input: {
  lmpDate: string;
  cycleLength: number | null;
  lutealLength: number | null;
  /** Client "today" after mount; null means date validity other than future LMP still runs. */
  today: Date | null;
}): OvulationResult {
  if (!input.lmpDate.trim()) {
    return {
      ok: false,
      error: "empty",
      message: "Enter the first day of your last period to see estimates.",
    };
  }

  const lmp = parseLocalDate(input.lmpDate);
  if (!lmp) {
    return {
      ok: false,
      error: "invalid_date",
      message: "Enter a valid calendar date for the first day of your last period.",
    };
  }

  if (input.today) {
    const today = startOfDay(input.today);
    if (isAfter(lmp, today)) {
      return {
        ok: false,
        error: "future_lmp",
        message:
          "The first day of the last period cannot be in the future.",
      };
    }
  }

  const cycleLength = input.cycleLength;
  const lutealLength = input.lutealLength;

  if (cycleLength === null || lutealLength === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter average cycle length and luteal phase length.",
    };
  }

  if (
    !Number.isInteger(cycleLength) ||
    cycleLength < CYCLE_LENGTH_MIN ||
    cycleLength > CYCLE_LENGTH_MAX
  ) {
    return {
      ok: false,
      error: "cycle_out_of_range",
      message: `Average cycle length should be between ${CYCLE_LENGTH_MIN} and ${CYCLE_LENGTH_MAX} days. Outside that range, talk with a healthcare professional — these calendar estimates are less reliable.`,
    };
  }

  if (
    !Number.isInteger(lutealLength) ||
    lutealLength < LUTEAL_LENGTH_MIN ||
    lutealLength > LUTEAL_LENGTH_MAX
  ) {
    return {
      ok: false,
      error: "luteal_out_of_range",
      message: `Luteal phase length should be between ${LUTEAL_LENGTH_MIN} and ${LUTEAL_LENGTH_MAX} days. Outside that range, talk with a healthcare professional.`,
    };
  }

  const cycles: CycleEstimate[] = [];
  for (let i = 0; i < 4; i++) {
    const periodStart = addDays(lmp, i * cycleLength);
    cycles.push(estimateOneCycle(periodStart, cycleLength, lutealLength, i));
  }

  return {
    ok: true,
    cycles,
    cycleLength,
    lutealLength,
  };
}

export type CalendarDayKind =
  | "outside"
  | "plain"
  | "ovulation"
  | "fertile"
  | "period-start";

export type CalendarDayCell = {
  date: Date;
  iso: string;
  dayOfMonth: number;
  kind: CalendarDayKind;
  /** Visible / SR text label when highlighted. */
  label: string | null;
  inCurrentMonth: boolean;
};

/** Build a month grid (Sun–Sat) with fertile window and ovulation labels. */
export function buildMonthCalendar(input: {
  month: Date;
  fertileStart: Date;
  fertileEnd: Date;
  ovulation: Date;
  periodStart?: Date;
}): CalendarDayCell[] {
  const monthStart = startOfMonth(input.month);
  const monthEnd = endOfMonth(input.month);
  const startPad = getDay(monthStart); // 0 = Sunday
  const gridStart = addDays(monthStart, -startPad);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalCells = Math.ceil((startPad + daysInMonth.length) / 7) * 7;
  const gridEnd = addDays(gridStart, totalCells - 1);

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const inCurrentMonth =
      !isBefore(date, monthStart) && !isAfter(date, monthEnd);
    const iso = toDateInputValue(date);
    let kind: CalendarDayKind = inCurrentMonth ? "plain" : "outside";
    let label: string | null = null;

    if (inCurrentMonth) {
      if (isSameDay(date, input.ovulation)) {
        kind = "ovulation";
        label = "Estimated ovulation";
      } else if (
        !isBefore(date, input.fertileStart) &&
        !isAfter(date, input.fertileEnd)
      ) {
        kind = "fertile";
        label = "Estimated fertile window";
      } else if (
        input.periodStart &&
        isSameDay(date, input.periodStart)
      ) {
        kind = "period-start";
        label = "Period start (entered or projected)";
      }
    }

    return {
      date,
      iso,
      dayOfMonth: date.getDate(),
      kind,
      label,
      inCurrentMonth,
    };
  });
}

export function parseWholeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
