"use client";

import { useEffect, useId, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { addMonths, format, startOfMonth } from "date-fns";
import {
  CYCLE_LENGTH_DEFAULT,
  CYCLE_LENGTH_MAX,
  CYCLE_LENGTH_MIN,
  LUTEAL_LENGTH_DEFAULT,
  LUTEAL_LENGTH_MAX,
  LUTEAL_LENGTH_MIN,
  buildMonthCalendar,
  calculateOvulation,
  formatDisplayDateWithWeekday,
  formatShortWeekdayDate,
  parseWholeNumber,
  toDateInputValue,
  type CycleEstimate,
} from "@/lib/utils/ovulation";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Calendar-method ovulation and fertile-window estimates.
 * "Today" is set after mount so the build date is never baked into HTML.
 * Inputs stay in component state only — never URL, storage, or analytics.
 */
export function OvulationCalculator() {
  const [today, setToday] = useState<Date | null>(null);
  const [lmpDate, setLmpDate] = useState("");
  const [cycleLength, setCycleLength] = useState(String(CYCLE_LENGTH_DEFAULT));
  const [lutealLength, setLutealLength] = useState(String(LUTEAL_LENGTH_DEFAULT));
  const [moreOpen, setMoreOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date | null>(null);

  const lmpId = useId();
  const cycleId = useId();
  const lutealId = useId();
  const moreId = useId();
  const resultsId = useId();

  useEffect(() => {
    setToday(new Date());
  }, []);

  const result = calculateOvulation({
    lmpDate,
    cycleLength: parseWholeNumber(cycleLength),
    lutealLength: parseWholeNumber(lutealLength),
    today,
  });

  const currentCycle = result.ok ? result.cycles[0]! : null;
  const ovulationIso = currentCycle
    ? toDateInputValue(currentCycle.ovulation)
    : null;

  useEffect(() => {
    if (ovulationIso) {
      const parsed = ovulationIso.split("-").map(Number);
      const y = parsed[0]!;
      const m = parsed[1]!;
      setCalendarMonth(startOfMonth(new Date(y, m - 1, 1)));
    }
  }, [ovulationIso]);

  function handleReset() {
    setLmpDate("");
    setCycleLength(String(CYCLE_LENGTH_DEFAULT));
    setLutealLength(String(LUTEAL_LENGTH_DEFAULT));
    setMoreOpen(false);
    setCalendarMonth(null);
    setToday(new Date());
  }

  const monthForGrid = calendarMonth ?? (currentCycle ? startOfMonth(currentCycle.ovulation) : null);
  const cells =
    currentCycle && monthForGrid
      ? buildMonthCalendar({
          month: monthForGrid,
          fertileStart: currentCycle.fertileStart,
          fertileEnd: currentCycle.fertileEnd,
          ovulation: currentCycle.ovulation,
          periodStart: currentCycle.periodStart,
        })
      : [];

  const labeledDays = cells.filter((c) => c.inCurrentMonth && c.label);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="ovulation-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="ovulation-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <CalendarDays
                className="size-5 text-zinc-800"
                aria-hidden="true"
              />
              Cycle details
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <p className="rounded-lg border border-zinc-200 bg-stone-50 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
            This is not birth control. Calendar estimates are not a reliable way
            to prevent pregnancy. Irregular cycles make these dates less
            reliable.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={lmpId}
              className="text-[12px] font-semibold text-muted"
            >
              First day of last period
            </label>
            <input
              id={lmpId}
              type="date"
              value={lmpDate}
              max={today ? toDateInputValue(today) : undefined}
              onChange={(event) => setLmpDate(event.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={cycleId}
              className="text-[12px] font-semibold text-muted"
            >
              Average cycle length (days)
            </label>
            <input
              id={cycleId}
              type="text"
              inputMode="numeric"
              value={cycleLength}
              onChange={(event) => setCycleLength(event.target.value)}
              aria-describedby={`${cycleId}-hint`}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800/20"
            />
            <p id={`${cycleId}-hint`} className="text-[12px] text-zinc-600">
              Typical range {CYCLE_LENGTH_MIN}–{CYCLE_LENGTH_MAX} days. Default{" "}
              {CYCLE_LENGTH_DEFAULT}.
            </p>
          </div>

          <div className="rounded-lg border border-border/60">
            <button
              type="button"
              id={moreId}
              aria-expanded={moreOpen}
              aria-controls={`${moreId}-panel`}
              onClick={() => setMoreOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-[13px] font-semibold text-foreground"
            >
              More options
              <ChevronDown
                className={`size-4 shrink-0 text-muted transition-transform ${
                  moreOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {moreOpen ? (
              <div
                id={`${moreId}-panel`}
                className="border-t border-border/60 px-3.5 pb-3.5 pt-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={lutealId}
                    className="text-[12px] font-semibold text-muted"
                  >
                    Luteal phase length (days)
                  </label>
                  <input
                    id={lutealId}
                    type="text"
                    inputMode="numeric"
                    value={lutealLength}
                    onChange={(event) => setLutealLength(event.target.value)}
                    aria-describedby={`${lutealId}-hint`}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800/20"
                  />
                  <p
                    id={`${lutealId}-hint`}
                    className="text-[12px] text-zinc-600"
                  >
                    Days from ovulation to the next period. Typical range{" "}
                    {LUTEAL_LENGTH_MIN}–{LUTEAL_LENGTH_MAX}. Default{" "}
                    {LUTEAL_LENGTH_DEFAULT}.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="ovulation-results-heading"
        aria-live="polite"
        className="flex flex-col gap-4 lg:col-span-7"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <h2
            id="ovulation-results-heading"
            className="border-b border-border pb-3 text-[15px] font-semibold text-foreground"
          >
            Estimated ovulation &amp; fertile window
          </h2>

          {!result.ok ? (
            <p
              id={resultsId}
              className="text-[15px] leading-relaxed text-zinc-700"
              role={
                result.error === "cycle_out_of_range" ||
                result.error === "luteal_out_of_range"
                  ? "status"
                  : undefined
              }
            >
              {result.message}
            </p>
          ) : (
            <>
              <CurrentCycleSummary cycle={result.cycles[0]!} />

              <p className="text-[13px] leading-relaxed text-zinc-600">
                Estimates use the calendar method only. They are not medical
                advice and are not a form of contraception. Talk with a
                healthcare professional about fertility questions or irregular
                cycles.
              </p>

              <CyclesTable cycles={result.cycles} />

              {monthForGrid ? (
                <MonthCalendar
                  month={monthForGrid}
                  cells={cells}
                  labeledDays={labeledDays}
                  onPrev={() => setCalendarMonth(addMonths(monthForGrid, -1))}
                  onNext={() => setCalendarMonth(addMonths(monthForGrid, 1))}
                />
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CurrentCycleSummary({ cycle }: { cycle: CycleEstimate }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-stone-50 px-4 py-4">
      <p className="ui-label text-[11px] font-semibold tracking-wide text-zinc-600">
        Current cycle
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[12px] font-semibold text-zinc-600">
            Estimated ovulation
          </dt>
          <dd className="mt-0.5 text-[15px] font-semibold text-foreground">
            {formatDisplayDateWithWeekday(cycle.ovulation)}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold text-zinc-600">
            Estimated fertile window
          </dt>
          <dd className="mt-0.5 text-[15px] font-semibold text-foreground">
            {formatShortWeekdayDate(cycle.fertileStart)}
            {" – "}
            {formatShortWeekdayDate(cycle.fertileEnd)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[12px] font-semibold text-zinc-600">
            Estimated next period
          </dt>
          <dd className="mt-0.5 text-[15px] font-medium text-zinc-800">
            {formatDisplayDateWithWeekday(cycle.nextPeriod)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function CyclesTable({ cycles }: { cycles: CycleEstimate[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="min-w-[36rem] w-full border-collapse text-left text-[14px]">
        <caption className="sr-only">
          Estimated ovulation and fertile window for the current cycle and the
          next three cycles
        </caption>
        <thead>
          <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              Cycle
            </th>
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              Ovulation
            </th>
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              Fertile window
            </th>
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              Next period
            </th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle) => (
            <tr
              key={cycle.cycleIndex}
              className="border-b border-border/70 last:border-0"
            >
              <th
                scope="row"
                className="px-3 py-2.5 font-medium text-foreground sm:px-4"
              >
                {cycle.cycleIndex === 0
                  ? "Current"
                  : `+${cycle.cycleIndex}`}
              </th>
              <td className="px-3 py-2.5 tabular-nums text-zinc-800 sm:px-4">
                {formatShortWeekdayDate(cycle.ovulation)}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-zinc-800 sm:px-4">
                {formatShortWeekdayDate(cycle.fertileStart)}
                {" – "}
                {formatShortWeekdayDate(cycle.fertileEnd)}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-zinc-800 sm:px-4">
                {formatShortWeekdayDate(cycle.nextPeriod)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthCalendar({
  month,
  cells,
  labeledDays,
  onPrev,
  onNext,
}: {
  month: Date;
  cells: ReturnType<typeof buildMonthCalendar>;
  labeledDays: ReturnType<typeof buildMonthCalendar>;
  onPrev: () => void;
  onNext: () => void;
}) {
  const monthLabel = format(month, "MMMM yyyy");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-foreground">
          Month view — {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 text-zinc-700 transition hover:bg-stone-50 focus:ring-2 focus:ring-zinc-800"
            aria-label={`Previous month from ${monthLabel}`}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 text-zinc-700 transition hover:bg-stone-50 focus:ring-2 focus:ring-zinc-800"
            aria-label={`Next month from ${monthLabel}`}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        role="grid"
        aria-label={`Calendar for ${monthLabel}`}
        className="overflow-hidden rounded-xl border border-border/80"
      >
        <div
          role="row"
          className="grid grid-cols-7 border-b border-border bg-stone-50 text-center text-[11px] font-semibold text-zinc-600"
        >
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" className="px-1 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const kindClass =
              cell.kind === "ovulation"
                ? "bg-zinc-900 text-white"
                : cell.kind === "fertile"
                  ? "bg-zinc-200 text-zinc-900"
                  : cell.kind === "period-start"
                    ? "bg-stone-100 text-zinc-800"
                    : cell.inCurrentMonth
                      ? "bg-panel text-foreground"
                      : "bg-panel text-zinc-400";

            return (
              <div
                key={cell.iso}
                role="gridcell"
                aria-label={
                  cell.label
                    ? `${formatDisplayDateWithWeekday(cell.date)}, ${cell.label}`
                    : formatDisplayDateWithWeekday(cell.date)
                }
                className={`min-h-[3.25rem] border-b border-r border-border/50 px-1 py-1.5 text-center ${kindClass}`}
              >
                <span className="block text-[13px] font-semibold tabular-nums">
                  {cell.dayOfMonth}
                </span>
                {cell.label ? (
                  <span className="mt-0.5 block text-[9px] font-medium leading-tight opacity-90">
                    {cell.kind === "ovulation"
                      ? "Ovulation"
                      : cell.kind === "fertile"
                        ? "Fertile"
                        : "Period"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="sr-only">
        {labeledDays.map((day) => (
          <li key={day.iso}>
            {formatDisplayDateWithWeekday(day.date)}: {day.label}
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-600">
        <li className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm bg-zinc-900"
            aria-hidden="true"
          />
          Estimated ovulation
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm bg-zinc-200"
            aria-hidden="true"
          />
          Estimated fertile window
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm bg-stone-100 ring-1 ring-zinc-300"
            aria-hidden="true"
          />
          Period start
        </li>
      </ul>
    </div>
  );
}
