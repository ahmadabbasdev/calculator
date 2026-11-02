"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Clock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  calculateAddSubtract,
  calculateTimeBetween,
  calculateTimecard,
  formatClockTime,
  formatDecimalHours,
  formatDurationCompact,
  formatDurationLong,
  formatExactFraction,
  parseNonNegativeInt,
  parseTimeInput,
  type AddSubtractOp,
  type HourDisplay,
  type TimeDurationMode,
  type TimecardRowInput,
} from "@/lib/utils/time-duration";

const dateTheme = CATEGORY_THEME[getCategoryTheme("date-time")];

const MODES: {
  id: TimeDurationMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "between",
    label: "Time between two times",
    shortLabel: "Hours and minutes between",
  },
  {
    id: "add-subtract",
    label: "Add or subtract time",
    shortLabel: "Shift a clock time",
  },
  {
    id: "timecard",
    label: "Total hours worked",
    shortLabel: "Timecard / shift total",
  },
];

const MAX_TIMECARD_ROWS = 31;
const INITIAL_TIMECARD_ROWS = 5;

function newRow(): TimecardRowInput {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    startTime: "",
    endTime: "",
    breakMinutes: 0,
  };
}

function emptyTimecardRows(count: number): TimecardRowInput[] {
  return Array.from({ length: count }, () => newRow());
}

/**
 * Interactive time duration calculator — between times, add/subtract, timecard.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function TimeDurationCalculator() {
  const [mode, setMode] = useState<TimeDurationMode>("between");
  const [hourDisplay, setHourDisplay] = useState<HourDisplay>("24h");

  // Mode 1
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [breakMinutesRaw, setBreakMinutesRaw] = useState("0");
  const [treatEndAsNextDay, setTreatEndAsNextDay] = useState(false);
  const nextDayTouchedRef = useRef(false);

  // Mode 2
  const [shiftStartTime, setShiftStartTime] = useState("");
  const [shiftStartDate, setShiftStartDate] = useState("");
  const [shiftDaysRaw, setShiftDaysRaw] = useState("0");
  const [shiftHoursRaw, setShiftHoursRaw] = useState("0");
  const [shiftMinutesRaw, setShiftMinutesRaw] = useState("0");
  const [shiftOp, setShiftOp] = useState<AddSubtractOp>("add");

  // Mode 3
  const [rows, setRows] = useState<TimecardRowInput[]>(() =>
    emptyTimecardRows(INITIAL_TIMECARD_ROWS),
  );

  const tablistId = useId();
  const displayGroupId = useId();
  const opGroupId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: TimeDurationMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setStartTime("");
    setEndTime("");
    setStartDate("");
    setEndDate("");
    setShowDates(false);
    setBreakMinutesRaw("0");
    setTreatEndAsNextDay(false);
    nextDayTouchedRef.current = false;
    setShiftStartTime("");
    setShiftStartDate("");
    setShiftDaysRaw("0");
    setShiftHoursRaw("0");
    setShiftMinutesRaw("0");
    setShiftOp("add");
    setRows(emptyTimecardRows(INITIAL_TIMECARD_ROWS));
    setMode("between");
    setHourDisplay("24h");
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = MODES.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectMode(MODES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const startParsed = parseTimeInput(startTime);
  const endParsed = parseTimeInput(endTime);
  const endBeforeStartSuggested =
    !showDates &&
    Boolean(startParsed && endParsed) &&
    endParsed!.minutesFromMidnight < startParsed!.minutesFromMidnight;
  const sameTimeSuggested =
    !showDates &&
    Boolean(startParsed && endParsed) &&
    endParsed!.minutesFromMidnight === startParsed!.minutesFromMidnight;

  useEffect(() => {
    if (showDates || nextDayTouchedRef.current) return;
    if (endBeforeStartSuggested) {
      setTreatEndAsNextDay(true);
    } else if (!sameTimeSuggested) {
      setTreatEndAsNextDay(false);
    }
  }, [endBeforeStartSuggested, sameTimeSuggested, showDates]);

  const breakMinutes = parseNonNegativeInt(breakMinutesRaw);
  const betweenResult = calculateTimeBetween({
    startTime,
    endTime,
    startDate: showDates ? startDate : "",
    endDate: showDates ? endDate : "",
    breakMinutes: breakMinutes ?? 0,
    treatEndAsNextDay: showDates ? false : treatEndAsNextDay,
  });

  const addSubtractResult = calculateAddSubtract({
    startTime: shiftStartTime,
    startDate: shiftStartDate,
    days: parseNonNegativeInt(shiftDaysRaw) ?? 0,
    hours: parseNonNegativeInt(shiftHoursRaw) ?? 0,
    minutes: parseNonNegativeInt(shiftMinutesRaw) ?? 0,
    operation: shiftOp,
  });

  const timecardResult = calculateTimecard(rows);

  function updateRow(id: string, patch: Partial<TimecardRowInput>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) =>
      prev.length >= MAX_TIMECARD_ROWS ? prev : [...prev, newRow()],
    );
  }

  function removeRow(id: string, index: number) {
    setRows((prev) => {
      if (prev.length <= 1) {
        return emptyTimecardRows(1);
      }
      return prev.filter((row) => row.id !== id);
    });
    void index;
  }

  const showNextDayCheckbox =
    mode === "between" &&
    !showDates &&
    Boolean(startParsed && endParsed) &&
    (endBeforeStartSuggested || sameTimeSuggested || treatEndAsNextDay);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="time-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="time-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Clock
                className={`size-5 ${dateTheme.text}`}
                aria-hidden="true"
              />
              Choose a calculation
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Time duration calculation modes"
            className="flex flex-col gap-1.5"
          >
            {MODES.map((item, index) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${tablistId}-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${tablistId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectMode(item.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    selected
                      ? `${dateTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-date-soft hover:text-cat-date"
                  }`}
                >
                  <span className="block">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] font-medium ${
                      selected ? "text-white/80" : "text-muted"
                    }`}
                  >
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${tablistId}-panel`}
            aria-labelledby={`${tablistId}-${mode}`}
            className="flex flex-col gap-4"
          >
            {mode === "between" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TimeField
                    id="between-start-time"
                    label="Start time"
                    value={startTime}
                    onChange={setStartTime}
                  />
                  <TimeField
                    id="between-end-time"
                    label="End time"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>

                <details
                  open={showDates}
                  onToggle={(event) =>
                    setShowDates((event.target as HTMLDetailsElement).open)
                  }
                  className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                >
                  <summary className="cursor-pointer text-[13px] font-semibold text-foreground">
                    Add dates for multi-day spans
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DateField
                      id="between-start-date"
                      label="Start date"
                      value={startDate}
                      onChange={setStartDate}
                    />
                    <DateField
                      id="between-end-date"
                      label="End date"
                      value={endDate}
                      onChange={setEndDate}
                    />
                  </div>
                </details>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="between-break"
                    className="text-[12px] font-semibold text-muted"
                  >
                    Unpaid break (minutes)
                  </label>
                  <input
                    id="between-break"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={breakMinutesRaw}
                    onChange={(event) => setBreakMinutesRaw(event.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
                  />
                </div>

                {showNextDayCheckbox ? (
                  <label className="flex items-start gap-2 text-[13px] leading-relaxed text-zinc-700">
                    <input
                      type="checkbox"
                      checked={treatEndAsNextDay}
                      onChange={(event) => {
                        nextDayTouchedRef.current = true;
                        setTreatEndAsNextDay(event.target.checked);
                      }}
                      className="mt-0.5 size-4 rounded border-border"
                    />
                    <span>
                      End time is on the next day
                      {endBeforeStartSuggested
                        ? " (suggested because the end is earlier than the start — uncheck to turn this off)"
                        : null}
                    </span>
                  </label>
                ) : null}
              </>
            ) : null}

            {mode === "add-subtract" ? (
              <>
                <TimeField
                  id="shift-start-time"
                  label="Start time"
                  value={shiftStartTime}
                  onChange={setShiftStartTime}
                />
                <DateField
                  id="shift-start-date"
                  label="Start date (optional)"
                  value={shiftStartDate}
                  onChange={setShiftStartDate}
                />
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <legend className="mb-2 text-[12px] font-semibold text-muted">
                    Duration to apply
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    <NumberField
                      id="shift-days"
                      label="Days"
                      value={shiftDaysRaw}
                      onChange={setShiftDaysRaw}
                    />
                    <NumberField
                      id="shift-hours"
                      label="Hours"
                      value={shiftHoursRaw}
                      onChange={setShiftHoursRaw}
                    />
                    <NumberField
                      id="shift-minutes"
                      label="Minutes"
                      value={shiftMinutesRaw}
                      onChange={setShiftMinutesRaw}
                    />
                  </div>
                </fieldset>
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <legend className="mb-2 text-[12px] font-semibold text-muted">
                    Operation
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Add or subtract"
                    className="grid grid-cols-2 gap-1.5"
                  >
                    {(
                      [
                        { id: "add", label: "Add" },
                        { id: "subtract", label: "Subtract" },
                      ] as const
                    ).map((option) => {
                      const selected = shiftOp === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[13px] font-semibold transition ${
                            selected
                              ? `${dateTheme.solid} text-white shadow-sm`
                              : "bg-background text-foreground hover:bg-cat-date-soft"
                          }`}
                        >
                          <input
                            type="radio"
                            name={opGroupId}
                            value={option.id}
                            checked={selected}
                            onChange={() => setShiftOp(option.id)}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            ) : null}

            {mode === "timecard" ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  Enter each shift. Rows where the end is earlier than the start
                  count as overnight. Up to {MAX_TIMECARD_ROWS} rows.
                </p>
                <div className="-mx-1 overflow-x-auto">
                  <table className="min-w-[28rem] w-full border-collapse text-left text-[13px]">
                    <caption className="sr-only">
                      Timecard rows with start time, end time, and break
                    </caption>
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold text-zinc-700">
                        <th scope="col" className="px-1 py-2">
                          Label
                        </th>
                        <th scope="col" className="px-1 py-2">
                          Start
                        </th>
                        <th scope="col" className="px-1 py-2">
                          End
                        </th>
                        <th scope="col" className="px-1 py-2">
                          Break
                        </th>
                        <th scope="col" className="px-1 py-2">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.id} className="border-b border-border/60">
                          <td className="px-1 py-1.5 align-middle">
                            <input
                              type="text"
                              aria-label={`Label for row ${index + 1}`}
                              value={row.label}
                              onChange={(event) =>
                                updateRow(row.id, {
                                  label: event.target.value,
                                })
                              }
                              className="w-full min-w-[4.5rem] rounded-md border border-border/80 bg-background px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-cat-date focus:ring-1 focus:ring-cat-date/20"
                            />
                          </td>
                          <td className="px-1 py-1.5 align-middle">
                            <input
                              type="time"
                              aria-label={`Start time for row ${index + 1}`}
                              value={row.startTime}
                              onChange={(event) =>
                                updateRow(row.id, {
                                  startTime: event.target.value,
                                })
                              }
                              className="w-full min-w-[6.5rem] rounded-md border border-border/80 bg-background px-1.5 py-1.5 text-[13px] tabular-nums text-foreground outline-none focus:border-cat-date focus:ring-1 focus:ring-cat-date/20"
                            />
                          </td>
                          <td className="px-1 py-1.5 align-middle">
                            <input
                              type="time"
                              aria-label={`End time for row ${index + 1}`}
                              value={row.endTime}
                              onChange={(event) =>
                                updateRow(row.id, {
                                  endTime: event.target.value,
                                })
                              }
                              className="w-full min-w-[6.5rem] rounded-md border border-border/80 bg-background px-1.5 py-1.5 text-[13px] tabular-nums text-foreground outline-none focus:border-cat-date focus:ring-1 focus:ring-cat-date/20"
                            />
                          </td>
                          <td className="px-1 py-1.5 align-middle">
                            <input
                              type="text"
                              inputMode="numeric"
                              aria-label={`Break minutes for row ${index + 1}`}
                              value={
                                row.breakMinutes === null
                                  ? ""
                                  : String(row.breakMinutes)
                              }
                              onChange={(event) => {
                                const raw = event.target.value.trim();
                                if (!raw) {
                                  updateRow(row.id, { breakMinutes: 0 });
                                  return;
                                }
                                const n = parseNonNegativeInt(raw);
                                updateRow(row.id, {
                                  breakMinutes: n ?? row.breakMinutes,
                                });
                              }}
                              className="w-full min-w-[3rem] rounded-md border border-border/80 bg-background px-2 py-1.5 text-[13px] tabular-nums text-foreground outline-none focus:border-cat-date focus:ring-1 focus:ring-cat-date/20"
                            />
                          </td>
                          <td className="px-1 py-1.5 align-middle">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id, index)}
                              aria-label={`Remove row ${index + 1}`}
                              className="inline-flex rounded-md p-1.5 text-zinc-600 transition hover:bg-stone-100 hover:text-foreground"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  disabled={rows.length >= MAX_TIMECARD_ROWS}
                  className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-border/80 bg-background px-3 py-2 text-[13px] font-semibold text-foreground transition hover:border-cat-date/45 hover:bg-cat-date-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add row
                </button>
              </div>
            ) : null}
          </div>

          <fieldset className="m-0 min-w-0 border-0 border-t border-border/70 p-0 pt-4">
            <legend className="mb-2 text-[12px] font-semibold text-muted">
              Result time format
            </legend>
            <div
              role="radiogroup"
              aria-label="12-hour or 24-hour display for results"
              className="grid grid-cols-2 gap-1.5"
            >
              {(
                [
                  { id: "24h", label: "24-hour" },
                  { id: "12h", label: "12-hour" },
                ] as const
              ).map((option) => {
                const selected = hourDisplay === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-center text-[12px] font-semibold transition ${
                      selected
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-background text-foreground hover:bg-stone-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={displayGroupId}
                      value={option.id}
                      checked={selected}
                      onChange={() => setHourDisplay(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
              Applies to results only. Time inputs use your browser’s own
              format. Arithmetic is wall-clock only — no time zones or daylight
              saving.
            </p>
          </fieldset>
        </div>
      </section>

      <section
        aria-labelledby="time-result-heading"
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-[18rem] flex-col gap-4 lg:col-span-7"
      >
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="time-result-heading"
              className="text-[15px] font-semibold text-foreground"
            >
              Result
            </h2>
            <span className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white">
              {MODES.find((item) => item.id === mode)?.shortLabel}
            </span>
          </div>

          {mode === "between" ? (
            <BetweenResultPanel result={betweenResult} />
          ) : null}
          {mode === "add-subtract" ? (
            <AddSubtractResultPanel
              result={addSubtractResult}
              hourDisplay={hourDisplay}
            />
          ) : null}
          {mode === "timecard" ? (
            <TimecardResultPanel result={timecardResult} />
          ) : null}

          <p className="mt-auto text-[12px] leading-relaxed text-zinc-600">
            Your inputs stay in your browser. They are never sent to our servers,
            stored, put in the URL, or included in analytics.
          </p>
        </div>
      </section>
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
      />
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
      />
    </div>
  );
}

function BetweenResultPanel({
  result,
}: {
  result: ReturnType<typeof calculateTimeBetween>;
}) {
  if (!result.ok) {
    if (result.error === "empty") {
      return (
        <p className="text-[15px] leading-relaxed text-muted">
          Enter a start time and end time to see the duration.
        </p>
      );
    }
    return (
      <p className="text-[15px] leading-relaxed text-zinc-700">{result.message}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {result.nextDayNote ? (
        <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2 text-[13px] text-zinc-700">
          {result.nextDayNote}
        </p>
      ) : null}
      <div>
        <p className="text-[12px] font-semibold text-muted">Duration</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
          {formatDurationLong(result.duration)}
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5">
          <dt className="text-[12px] font-semibold text-muted">Total minutes</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {result.duration.totalMinutes.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5">
          <dt className="text-[12px] font-semibold text-muted">Decimal hours</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {formatDecimalHours(result.duration)}{" "}
            <span className="text-[13px] font-medium text-zinc-600">
              ({formatExactFraction(result.duration.totalMinutes)})
            </span>
          </dd>
        </div>
      </dl>
      <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
        {result.working}
      </p>
    </div>
  );
}

function AddSubtractResultPanel({
  result,
  hourDisplay,
}: {
  result: ReturnType<typeof calculateAddSubtract>;
  hourDisplay: HourDisplay;
}) {
  if (!result.ok) {
    if (result.error === "empty") {
      return (
        <p className="text-[15px] leading-relaxed text-muted">
          Enter a start time and a duration to add or subtract.
        </p>
      );
    }
    return (
      <p className="text-[15px] leading-relaxed text-zinc-700">{result.message}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-semibold text-muted">Resulting time</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
          {formatClockTime(result.resultTime, hourDisplay)}
        </p>
      </div>
      {result.resultDate ? (
        <p className="text-[15px] font-semibold tabular-nums text-foreground">
          Date: {result.resultDate}
          {result.dayLabel ? (
            <span className="ml-2 text-[13px] font-medium text-zinc-600">
              ({result.dayLabel})
            </span>
          ) : null}
        </p>
      ) : result.dayLabel ? (
        <p className="text-[15px] font-semibold text-foreground">
          {result.dayLabel}
        </p>
      ) : null}
      <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
        {result.working}
      </p>
    </div>
  );
}

function TimecardResultPanel({
  result,
}: {
  result: ReturnType<typeof calculateTimecard>;
}) {
  if (!result.ok && result.error === "empty") {
    return (
      <p className="text-[15px] leading-relaxed text-muted">
        Fill in at least one row with a start and end time.
      </p>
    );
  }

  const rows = result.rows;

  return (
    <div className="flex flex-col gap-4">
      {result.ok ? (
        <>
          <div>
            <p className="text-[12px] font-semibold text-muted">Total time</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {formatDurationLong(result.total)}
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5">
              <dt className="text-[12px] font-semibold text-muted">
                Decimal hours
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {formatDecimalHours(result.total)}
              </dd>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5">
              <dt className="text-[12px] font-semibold text-muted">
                Average per row ({result.filledRowCount})
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {formatDurationCompact(result.average)}
              </dd>
            </div>
          </dl>
          <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
            {result.working}
          </p>
        </>
      ) : (
        <p className="text-[15px] leading-relaxed text-zinc-700">
          {result.message}
        </p>
      )}

      <div className="-mx-1 overflow-x-auto">
        <table className="min-w-[20rem] w-full border-collapse text-left text-[13px]">
          <caption className="sr-only">Duration for each timecard row</caption>
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-zinc-700">
              <th scope="col" className="px-2 py-2">
                Row
              </th>
              <th scope="col" className="px-2 py-2">
                Duration
              </th>
              <th scope="col" className="px-2 py-2">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-border/60">
                <td className="px-2 py-2 text-foreground">
                  {row.label.trim() || `Row ${index + 1}`}
                </td>
                <td className="px-2 py-2 tabular-nums text-foreground">
                  {row.duration
                    ? formatDurationCompact(row.duration)
                    : row.ok
                      ? "—"
                      : "—"}
                </td>
                <td className="px-2 py-2 text-zinc-600">
                  {!row.ok && row.error
                    ? row.error
                    : row.overnight
                      ? "overnight"
                      : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
