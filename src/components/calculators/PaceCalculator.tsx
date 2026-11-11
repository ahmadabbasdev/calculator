"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { RefreshCw, Timer } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  RACE_PRESETS,
  calculatePace,
  formatDuration,
  formatPace,
  parseHms,
  parsePaceMs,
  type DistanceUnit,
  type PaceMode,
  type PaceUnit,
  type SplitUnit,
  type SpeedUnit,
} from "@/lib/utils/pace";

const healthTheme = CATEGORY_THEME[getCategoryTheme("health")];

const MODES: {
  id: PaceMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "find-pace",
    label: "Find pace",
    shortLabel: "Distance + time → pace & speed",
  },
  {
    id: "find-time",
    label: "Find time",
    shortLabel: "Distance + pace → total time",
  },
  {
    id: "find-distance",
    label: "Find distance",
    shortLabel: "Time + pace → distance",
  },
  {
    id: "convert",
    label: "Convert pace or speed",
    shortLabel: "min/km ↔ min/mi ↔ km/h ↔ mph",
  },
];

type ConvertKind = PaceUnit | SpeedUnit;

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Running / walking pace calculator — find pace, time, distance, or convert.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function PaceCalculator() {
  const [mode, setMode] = useState<PaceMode>("find-pace");
  const [distanceRaw, setDistanceRaw] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [hoursRaw, setHoursRaw] = useState("");
  const [minutesRaw, setMinutesRaw] = useState("");
  const [secondsRaw, setSecondsRaw] = useState("");
  const [paceMinRaw, setPaceMinRaw] = useState("");
  const [paceSecRaw, setPaceSecRaw] = useState("");
  const [paceUnit, setPaceUnit] = useState<PaceUnit>("min-per-km");
  const [splitUnit, setSplitUnit] = useState<SplitUnit>("km");
  const [convertKind, setConvertKind] = useState<ConvertKind>("min-per-km");
  const [convertPaceMinRaw, setConvertPaceMinRaw] = useState("");
  const [convertPaceSecRaw, setConvertPaceSecRaw] = useState("");
  const [convertSpeedRaw, setConvertSpeedRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: PaceMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("find-pace");
    setDistanceRaw("");
    setDistanceUnit("km");
    setHoursRaw("");
    setMinutesRaw("");
    setSecondsRaw("");
    setPaceMinRaw("");
    setPaceSecRaw("");
    setPaceUnit("min-per-km");
    setSplitUnit("km");
    setConvertKind("min-per-km");
    setConvertPaceMinRaw("");
    setConvertPaceSecRaw("");
    setConvertSpeedRaw("");
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

  function applyPreset(km: number) {
    setDistanceUnit("km");
    setDistanceRaw(String(km));
  }

  const distance = parseOptionalNumber(distanceRaw);
  const timeSeconds = parseHms(
    parseOptionalNumber(hoursRaw),
    parseOptionalNumber(minutesRaw),
    parseOptionalNumber(secondsRaw),
  );
  const paceSeconds = parsePaceMs(
    parseOptionalNumber(paceMinRaw),
    parseOptionalNumber(paceSecRaw),
  );

  const isPaceConvert =
    convertKind === "min-per-km" || convertKind === "min-per-mile";
  const convertValue = isPaceConvert
    ? parsePaceMs(
        parseOptionalNumber(convertPaceMinRaw),
        parseOptionalNumber(convertPaceSecRaw),
      )
    : parseOptionalNumber(convertSpeedRaw);

  const result = calculatePace({
    mode,
    distance,
    distanceUnit,
    timeSeconds,
    paceSeconds,
    paceUnit,
    convertValue,
    convertKind,
    splitUnit,
  });

  const showSplits =
    result.ok &&
    (mode === "find-pace" || mode === "find-time" || mode === "find-distance") &&
    result.splits.length > 0;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="pace-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="pace-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Timer
                className={`size-5 ${healthTheme.text}`}
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
            aria-label="Pace calculation modes"
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
                      ? `${healthTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-health-soft hover:text-cat-health"
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
            className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {mode !== "convert" && mode !== "find-distance" && (
              <DistanceFields
                uid={uid}
                distanceRaw={distanceRaw}
                setDistanceRaw={setDistanceRaw}
                distanceUnit={distanceUnit}
                setDistanceUnit={setDistanceUnit}
                onPreset={applyPreset}
              />
            )}

            {(mode === "find-pace" || mode === "find-distance") && (
              <TimeFields
                uid={uid}
                hoursRaw={hoursRaw}
                setHoursRaw={setHoursRaw}
                minutesRaw={minutesRaw}
                setMinutesRaw={setMinutesRaw}
                secondsRaw={secondsRaw}
                setSecondsRaw={setSecondsRaw}
              />
            )}

            {(mode === "find-time" || mode === "find-distance") && (
              <PaceFields
                uid={uid}
                paceMinRaw={paceMinRaw}
                setPaceMinRaw={setPaceMinRaw}
                paceSecRaw={paceSecRaw}
                setPaceSecRaw={setPaceSecRaw}
                paceUnit={paceUnit}
                setPaceUnit={setPaceUnit}
              />
            )}

            {mode === "convert" && (
              <ConvertFields
                uid={uid}
                convertKind={convertKind}
                setConvertKind={setConvertKind}
                convertPaceMinRaw={convertPaceMinRaw}
                setConvertPaceMinRaw={setConvertPaceMinRaw}
                convertPaceSecRaw={convertPaceSecRaw}
                setConvertPaceSecRaw={setConvertPaceSecRaw}
                convertSpeedRaw={convertSpeedRaw}
                setConvertSpeedRaw={setConvertSpeedRaw}
              />
            )}

            {mode !== "convert" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-muted">
                  Splits by
                </span>
                <div
                  role="group"
                  aria-label="Split distance unit"
                  className="flex gap-1.5"
                >
                  {([
                    { id: "km" as const, label: "Per km" },
                    { id: "mile" as const, label: "Per mile" },
                  ]).map((opt) => {
                    const selected = splitUnit === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSplitUnit(opt.id)}
                        className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                          selected
                            ? `${healthTheme.solid} text-white`
                            : "bg-background text-foreground hover:bg-cat-health-soft"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="pace-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="pace-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
            </span>
            <span className="text-[12px] text-muted">
              {MODES.find((m) => m.id === mode)?.label}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-4">
              {mode === "find-pace" && (
                <>
                  <ResultGrid
                    items={[
                      {
                        label: "Pace per km",
                        value: `${formatPace(result.secPerKm)} /km`,
                      },
                      {
                        label: "Pace per mile",
                        value: `${formatPace(result.secPerMile)} /mi`,
                      },
                      {
                        label: "km/h",
                        value: result.kmh.toFixed(2),
                      },
                      {
                        label: "mph",
                        value: result.mph.toFixed(2),
                      },
                    ]}
                  />
                </>
              )}

              {mode === "find-time" && result.totalSeconds !== null && (
                <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {formatDuration(result.totalSeconds)}
                </p>
              )}

              {mode === "find-distance" &&
                result.distanceKm !== null &&
                result.distanceMiles !== null && (
                  <ResultGrid
                    items={[
                      {
                        label: "Distance",
                        value: `${result.distanceKm.toFixed(2)} km`,
                      },
                      {
                        label: "Distance",
                        value: `${result.distanceMiles.toFixed(2)} mi`,
                      },
                    ]}
                  />
                )}

              {mode === "convert" && (
                <ResultGrid
                  items={[
                    {
                      label: "min/km",
                      value: formatPace(result.secPerKm),
                    },
                    {
                      label: "min/mile",
                      value: formatPace(result.secPerMile),
                    },
                    {
                      label: "km/h",
                      value: result.kmh.toFixed(2),
                    },
                    {
                      label: "mph",
                      value: result.mph.toFixed(2),
                    },
                  ]}
                />
              )}

              {(mode === "find-time" || mode === "find-pace") && (
                <p className="text-[13px] text-muted tabular-nums">
                  {formatPace(result.secPerKm)}/km ·{" "}
                  {formatPace(result.secPerMile)}/mi · {result.kmh.toFixed(2)}{" "}
                  km/h · {result.mph.toFixed(2)} mph
                </p>
              )}

              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${healthTheme.borderSoft} ${healthTheme.soft} ${healthTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Worked step
                </span>
                {result.working}
              </p>

              {result.notes.map((note) => (
                <p
                  key={note}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] text-amber-900"
                >
                  {note}
                </p>
              ))}

              {showSplits && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[18rem] border-collapse text-left text-[13px]">
                    <caption className="sr-only">
                      Split times {splitUnit === "km" ? "per kilometre" : "per mile"}
                    </caption>
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 pr-3 font-semibold">
                          Split
                        </th>
                        <th scope="col" className="py-2 pr-3 font-semibold">
                          Distance
                        </th>
                        <th scope="col" className="py-2 pr-3 font-semibold tabular-nums">
                          Split time
                        </th>
                        <th scope="col" className="py-2 font-semibold tabular-nums">
                          Cumulative
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.splits.map((split) => (
                        <tr
                          key={split.index}
                          className="border-b border-border/60 text-foreground"
                        >
                          <td className="py-2 pr-3 tabular-nums">
                            {split.index}
                            {split.partial ? " (final)" : ""}
                          </td>
                          <td className="py-2 pr-3 tabular-nums">
                            {split.partial
                              ? `${split.distance.toFixed(2)} ${splitUnit === "km" ? "km" : "mi"}`
                              : `1 ${splitUnit === "km" ? "km" : "mi"}`}
                          </td>
                          <td className="py-2 pr-3 tabular-nums">
                            {formatDuration(split.splitSeconds)}
                          </td>
                          <td className="py-2 tabular-nums">
                            {formatDuration(split.cumulativeSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : result.error === "empty" ? (
            <p className="text-[15px] text-muted">{result.message}</p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
              {result.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ResultGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:bg-panel focus:ring-2 focus:ring-cat-health/20 ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function DistanceFields({
  uid,
  distanceRaw,
  setDistanceRaw,
  distanceUnit,
  setDistanceUnit,
  onPreset,
}: {
  uid: string;
  distanceRaw: string;
  setDistanceRaw: (v: string) => void;
  distanceUnit: DistanceUnit;
  setDistanceUnit: (u: DistanceUnit) => void;
  onPreset: (km: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id={`${uid}-distance`}
          label="Distance"
          value={distanceRaw}
          onChange={setDistanceRaw}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor={`${uid}-distance-unit`}
            className="text-[12px] font-semibold text-muted"
          >
            Unit
          </label>
          <select
            id={`${uid}-distance-unit`}
            value={distanceUnit}
            onChange={(event) =>
              setDistanceUnit(event.target.value as DistanceUnit)
            }
            className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:ring-2 focus:ring-cat-health/20"
          >
            <option value="km">km</option>
            <option value="miles">miles</option>
            <option value="meters">meters</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">
          Race presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          {RACE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset.km)}
              className="rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition hover:border-cat-health/40 hover:bg-cat-health-soft hover:text-cat-health"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeFields({
  uid,
  hoursRaw,
  setHoursRaw,
  minutesRaw,
  setMinutesRaw,
  secondsRaw,
  setSecondsRaw,
}: {
  uid: string;
  hoursRaw: string;
  setHoursRaw: (v: string) => void;
  minutesRaw: string;
  setMinutesRaw: (v: string) => void;
  secondsRaw: string;
  setSecondsRaw: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-muted">Time</span>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          id={`${uid}-hours`}
          label="Hours"
          value={hoursRaw}
          onChange={setHoursRaw}
        />
        <NumberField
          id={`${uid}-minutes`}
          label="Minutes"
          value={minutesRaw}
          onChange={setMinutesRaw}
        />
        <NumberField
          id={`${uid}-seconds`}
          label="Seconds"
          value={secondsRaw}
          onChange={setSecondsRaw}
        />
      </div>
    </div>
  );
}

function PaceFields({
  uid,
  paceMinRaw,
  setPaceMinRaw,
  paceSecRaw,
  setPaceSecRaw,
  paceUnit,
  setPaceUnit,
}: {
  uid: string;
  paceMinRaw: string;
  setPaceMinRaw: (v: string) => void;
  paceSecRaw: string;
  setPaceSecRaw: (v: string) => void;
  paceUnit: PaceUnit;
  setPaceUnit: (u: PaceUnit) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">Pace</span>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id={`${uid}-pace-min`}
            label="Minutes"
            value={paceMinRaw}
            onChange={setPaceMinRaw}
          />
          <NumberField
            id={`${uid}-pace-sec`}
            label="Seconds"
            value={paceSecRaw}
            onChange={setPaceSecRaw}
          />
        </div>
      </div>
      <div
        role="group"
        aria-label="Pace unit"
        className="flex gap-1.5"
      >
        {(
          [
            { id: "min-per-km" as const, label: "min/km" },
            { id: "min-per-mile" as const, label: "min/mile" },
          ] as const
        ).map((opt) => {
          const selected = paceUnit === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPaceUnit(opt.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                selected
                  ? `${healthTheme.solid} text-white`
                  : "bg-background text-foreground hover:bg-cat-health-soft"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConvertFields({
  uid,
  convertKind,
  setConvertKind,
  convertPaceMinRaw,
  setConvertPaceMinRaw,
  convertPaceSecRaw,
  setConvertPaceSecRaw,
  convertSpeedRaw,
  setConvertSpeedRaw,
}: {
  uid: string;
  convertKind: ConvertKind;
  setConvertKind: (k: ConvertKind) => void;
  convertPaceMinRaw: string;
  setConvertPaceMinRaw: (v: string) => void;
  convertPaceSecRaw: string;
  setConvertPaceSecRaw: (v: string) => void;
  convertSpeedRaw: string;
  setConvertSpeedRaw: (v: string) => void;
}) {
  const isPace =
    convertKind === "min-per-km" || convertKind === "min-per-mile";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <label
          htmlFor={`${uid}-convert-kind`}
          className="text-[12px] font-semibold text-muted"
        >
          Enter as
        </label>
        <select
          id={`${uid}-convert-kind`}
          value={convertKind}
          onChange={(event) =>
            setConvertKind(event.target.value as ConvertKind)
          }
          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:ring-2 focus:ring-cat-health/20"
        >
          <option value="min-per-km">min per km</option>
          <option value="min-per-mile">min per mile</option>
          <option value="kmh">km/h</option>
          <option value="mph">mph</option>
        </select>
      </div>
      {isPace ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id={`${uid}-convert-pace-min`}
            label="Minutes"
            value={convertPaceMinRaw}
            onChange={setConvertPaceMinRaw}
          />
          <NumberField
            id={`${uid}-convert-pace-sec`}
            label="Seconds"
            value={convertPaceSecRaw}
            onChange={setConvertPaceSecRaw}
          />
        </div>
      ) : (
        <NumberField
          id={`${uid}-convert-speed`}
          label={convertKind === "kmh" ? "Speed (km/h)" : "Speed (mph)"}
          value={convertSpeedRaw}
          onChange={setConvertSpeedRaw}
          suffix={convertKind === "kmh" ? "km/h" : "mph"}
        />
      )}
    </div>
  );
}
