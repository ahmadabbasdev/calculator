"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Download, Printer, RefreshCw, Table2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  formatDuration,
  formatPace,
  parseHms,
  type DistanceUnit,
  type SplitUnit,
} from "@/lib/utils/pace";
import {
  CHART_RACE_PRESETS,
  buildGoalSplits,
  buildPaceChart,
  defaultRangeForRace,
  paceChartToCsv,
  resolveChartDistance,
  type ChartRaceId,
  type PacePlan,
} from "@/lib/utils/pace-chart";

const healthTheme = CATEGORY_THEME[getCategoryTheme("health")];

type Mode = "pace-chart" | "goal-splits";

const MODES: { id: Mode; label: string; shortLabel: string }[] = [
  {
    id: "pace-chart",
    label: "Pace chart",
    shortLabel: "Finish times → pace & speed",
  },
  {
    id: "goal-splits",
    label: "Splits for my goal",
    shortLabel: "Goal time → km/mile splits",
  },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function secondsToHms(total: number): { h: string; m: string; s: string } {
  const t = Math.max(0, Math.round(total));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return {
    h: h > 0 ? String(h) : "",
    m: String(m),
    s: String(s),
  };
}

/**
 * Pace chart and goal-time splits. Inputs stay in React state only.
 */
export function PaceChartCalculator() {
  const [mode, setMode] = useState<Mode>("pace-chart");
  const [raceId, setRaceId] = useState<ChartRaceId>("marathon");
  const [customDistanceRaw, setCustomDistanceRaw] = useState("");
  const [customUnit, setCustomUnit] = useState<DistanceUnit>("km");
  const [displayUnit, setDisplayUnit] = useState<"km" | "mile">("km");

  const defaultRange = defaultRangeForRace("marathon");
  const startHms = secondsToHms(defaultRange.startSeconds);
  const endHms = secondsToHms(defaultRange.endSeconds);
  const [startH, setStartH] = useState(startHms.h);
  const [startM, setStartM] = useState(startHms.m);
  const [startS, setStartS] = useState(startHms.s);
  const [endH, setEndH] = useState(endHms.h);
  const [endM, setEndM] = useState(endHms.m);
  const [endS, setEndS] = useState(endHms.s);
  const [stepMinRaw, setStepMinRaw] = useState(
    String(defaultRange.stepSeconds / 60),
  );

  const [goalDistanceRace, setGoalDistanceRace] =
    useState<ChartRaceId>("marathon");
  const [goalCustomRaw, setGoalCustomRaw] = useState("");
  const [goalCustomUnit, setGoalCustomUnit] = useState<DistanceUnit>("km");
  const [goalH, setGoalH] = useState("4");
  const [goalM, setGoalM] = useState("0");
  const [goalS, setGoalS] = useState("0");
  const [splitUnit, setSplitUnit] = useState<SplitUnit>("km");
  const [plan, setPlan] = useState<PacePlan>("even");
  const [skewRaw, setSkewRaw] = useState("2");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: Mode) => setMode(next), []);

  function applyRaceDefaults(id: ChartRaceId) {
    const range = defaultRangeForRace(id);
    const a = secondsToHms(range.startSeconds);
    const b = secondsToHms(range.endSeconds);
    setStartH(a.h);
    setStartM(a.m);
    setStartS(a.s);
    setEndH(b.h);
    setEndM(b.m);
    setEndS(b.s);
    setStepMinRaw(String(range.stepSeconds / 60));
  }

  useEffect(() => {
    if (raceId !== "custom") applyRaceDefaults(raceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when race preset changes
  }, [raceId]);

  function handleReset() {
    setMode("pace-chart");
    setRaceId("marathon");
    setCustomDistanceRaw("");
    setCustomUnit("km");
    setDisplayUnit("km");
    applyRaceDefaults("marathon");
    setGoalDistanceRace("marathon");
    setGoalCustomRaw("");
    setGoalCustomUnit("km");
    setGoalH("4");
    setGoalM("0");
    setGoalS("0");
    setSplitUnit("km");
    setPlan("even");
    setSkewRaw("2");
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

  const distanceKm = resolveChartDistance(
    raceId,
    parseOptionalNumber(customDistanceRaw),
    customUnit,
  );
  const startSeconds = parseHms(
    parseOptionalNumber(startH),
    parseOptionalNumber(startM),
    parseOptionalNumber(startS),
  );
  const endSeconds = parseHms(
    parseOptionalNumber(endH),
    parseOptionalNumber(endM),
    parseOptionalNumber(endS),
  );
  const stepMinutes = parseOptionalNumber(stepMinRaw);
  const stepSeconds =
    stepMinutes === null ? null : stepMinutes * 60;

  const chartResult = buildPaceChart({
    distanceKm,
    startSeconds,
    endSeconds,
    stepSeconds,
  });

  const goalDistanceKm = resolveChartDistance(
    goalDistanceRace,
    parseOptionalNumber(goalCustomRaw),
    goalCustomUnit,
  );
  const goalSeconds = parseHms(
    parseOptionalNumber(goalH),
    parseOptionalNumber(goalM),
    parseOptionalNumber(goalS),
  );
  const skewPercent = parseOptionalNumber(skewRaw) ?? 2;

  const splitsResult = buildGoalSplits({
    distanceKm: goalDistanceKm,
    goalSeconds,
    splitUnit,
    plan,
    skewPercent: plan === "even" ? 0 : skewPercent,
  });

  function handlePrint() {
    window.print();
  }

  function handleDownloadCsv() {
    if (!chartResult.ok) return;
    const csv = paceChartToCsv(chartResult.rows, chartResult.distanceKm);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pace-chart.csv";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="pace-chart-input-heading"
        className="flex flex-col gap-4 lg:col-span-4 no-print"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="pace-chart-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Table2
                className={`size-5 ${healthTheme.text}`}
                aria-hidden="true"
              />
              Choose a view
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
            aria-label="Pace chart modes"
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
                      : "bg-background text-foreground hover:bg-cat-health-soft"
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
            {mode === "pace-chart" ? (
              <ChartInputs
                uid={uid}
                raceId={raceId}
                setRaceId={setRaceId}
                customDistanceRaw={customDistanceRaw}
                setCustomDistanceRaw={setCustomDistanceRaw}
                customUnit={customUnit}
                setCustomUnit={setCustomUnit}
                displayUnit={displayUnit}
                setDisplayUnit={setDisplayUnit}
                startH={startH}
                setStartH={setStartH}
                startM={startM}
                setStartM={setStartM}
                startS={startS}
                setStartS={setStartS}
                endH={endH}
                setEndH={setEndH}
                endM={endM}
                setEndM={setEndM}
                endS={endS}
                setEndS={setEndS}
                stepMinRaw={stepMinRaw}
                setStepMinRaw={setStepMinRaw}
              />
            ) : (
              <SplitsInputs
                uid={uid}
                goalDistanceRace={goalDistanceRace}
                setGoalDistanceRace={setGoalDistanceRace}
                goalCustomRaw={goalCustomRaw}
                setGoalCustomRaw={setGoalCustomRaw}
                goalCustomUnit={goalCustomUnit}
                setGoalCustomUnit={setGoalCustomUnit}
                goalH={goalH}
                setGoalH={setGoalH}
                goalM={goalM}
                setGoalM={setGoalM}
                goalS={goalS}
                setGoalS={setGoalS}
                splitUnit={splitUnit}
                setSplitUnit={setSplitUnit}
                plan={plan}
                setPlan={setPlan}
                skewRaw={skewRaw}
                setSkewRaw={setSkewRaw}
              />
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="pace-chart-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-8 print-only-block"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="pace-chart-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              {mode === "pace-chart" ? "Pace chart" : "Splits"}
            </span>
            {mode === "pace-chart" && chartResult.ok ? (
              <div className="no-print flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition hover:bg-cat-health-soft"
                >
                  <Printer className="size-3.5" aria-hidden="true" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition hover:bg-cat-health-soft"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Download CSV
                </button>
              </div>
            ) : null}
          </div>

          {mode === "pace-chart" ? (
            chartResult.ok ? (
              <div className="animate-fade-in overflow-x-auto">
                <table className="w-full min-w-[32rem] border-collapse text-left text-[13px]">
                  <caption className="sr-only">
                    Finish times with pace and speed for{" "}
                    {chartResult.distanceKm} km
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Finish
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        {displayUnit === "km" ? "Pace /km" : "Pace /mi"}
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        {displayUnit === "km" ? "Pace /mi" : "Pace /km"}
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        km/h
                      </th>
                      <th
                        scope="col"
                        className="py-2 font-semibold tabular-nums"
                      >
                        mph
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartResult.rows.map((row) => (
                      <tr
                        key={row.finishSeconds}
                        className="border-b border-border/60 text-foreground"
                      >
                        <th
                          scope="row"
                          className="py-2 pr-3 text-left font-medium tabular-nums"
                        >
                          {formatDuration(row.finishSeconds)}
                        </th>
                        <td className="py-2 pr-3 tabular-nums">
                          {formatPace(
                            displayUnit === "km"
                              ? row.secPerKm
                              : row.secPerMile,
                          )}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {formatPace(
                            displayUnit === "km"
                              ? row.secPerMile
                              : row.secPerKm,
                          )}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {row.kmh.toFixed(2)}
                        </td>
                        <td className="py-2 tabular-nums">
                          {row.mph.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : chartResult.error === "empty" ? (
              <p className="text-[15px] text-muted">{chartResult.message}</p>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
                {chartResult.message}
              </p>
            )
          ) : splitsResult.ok ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${healthTheme.borderSoft} ${healthTheme.soft} ${healthTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Worked step
                </span>
                {splitsResult.working}
              </p>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    First half
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums">
                    {formatDuration(splitsResult.firstHalfSeconds)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Second half
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums">
                    {formatDuration(splitsResult.secondHalfSeconds)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Half difference
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums">
                    {splitsResult.halfDifferenceSeconds === 0
                      ? "0:00 (even)"
                      : `${splitsResult.halfDifferenceSeconds > 0 ? "First half longer by " : "Second half longer by "}${formatDuration(Math.abs(splitsResult.halfDifferenceSeconds))}`}
                  </dd>
                </div>
              </dl>

              {splitsResult.checkpoints.length > 0 ? (
                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-[13px] font-semibold text-foreground">
                    Checkpoints
                  </h3>
                  <table className="w-full min-w-[18rem] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 pr-3">
                          Marker
                        </th>
                        <th scope="col" className="py-2 tabular-nums">
                          Cumulative
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitsResult.checkpoints.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-border/60"
                        >
                          <th
                            scope="row"
                            className="py-2 pr-3 text-left font-medium"
                          >
                            {row.label}
                          </th>
                          <td className="py-2 tabular-nums">
                            {formatDuration(row.cumulativeSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">
                  Splits ({splitUnit === "km" ? "per km" : "per mile"})
                </h3>
                <table className="w-full min-w-[22rem] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="py-2 pr-3">
                        Split
                      </th>
                      <th scope="col" className="py-2 pr-3 tabular-nums">
                        Split time
                      </th>
                      <th scope="col" className="py-2 tabular-nums">
                        Cumulative
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitsResult.splits.map((row) => (
                      <tr
                        key={`${row.label}-${row.distanceKm}`}
                        className="border-b border-border/60"
                      >
                        <th
                          scope="row"
                          className="py-2 pr-3 text-left font-medium"
                        >
                          {row.label}
                        </th>
                        <td className="py-2 pr-3 tabular-nums">
                          {formatDuration(row.splitSeconds)}
                        </td>
                        <td className="py-2 tabular-nums">
                          {formatDuration(row.cumulativeSeconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : splitsResult.error === "empty" ? (
            <p className="text-[15px] text-muted">{splitsResult.message}</p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
              {splitsResult.message}
            </p>
          )}
        </div>
      </section>
    </div>
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
  onChange: (v: string) => void;
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
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:bg-panel focus:ring-2 focus:ring-cat-health/20 ${suffix ? "pr-12" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] font-medium text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RacePresetButtons({
  raceId,
  setRaceId,
}: {
  raceId: ChartRaceId;
  setRaceId: (id: ChartRaceId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CHART_RACE_PRESETS.map((p) => {
        const selected = raceId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setRaceId(p.id)}
            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
              selected
                ? `${healthTheme.solid} text-white`
                : "border border-border/80 bg-background text-foreground hover:bg-cat-health-soft"
            }`}
          >
            {p.label}
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={raceId === "custom"}
        onClick={() => setRaceId("custom")}
        className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
          raceId === "custom"
            ? `${healthTheme.solid} text-white`
            : "border border-border/80 bg-background text-foreground hover:bg-cat-health-soft"
        }`}
      >
        Custom
      </button>
    </div>
  );
}

function ChartInputs(props: {
  uid: string;
  raceId: ChartRaceId;
  setRaceId: (id: ChartRaceId) => void;
  customDistanceRaw: string;
  setCustomDistanceRaw: (v: string) => void;
  customUnit: DistanceUnit;
  setCustomUnit: (u: DistanceUnit) => void;
  displayUnit: "km" | "mile";
  setDisplayUnit: (u: "km" | "mile") => void;
  startH: string;
  setStartH: (v: string) => void;
  startM: string;
  setStartM: (v: string) => void;
  startS: string;
  setStartS: (v: string) => void;
  endH: string;
  setEndH: (v: string) => void;
  endM: string;
  setEndM: (v: string) => void;
  endS: string;
  setEndS: (v: string) => void;
  stepMinRaw: string;
  setStepMinRaw: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">Distance</span>
        <RacePresetButtons raceId={props.raceId} setRaceId={props.setRaceId} />
      </div>
      {props.raceId === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${props.uid}-custom-d`}
            label="Custom distance"
            value={props.customDistanceRaw}
            onChange={props.setCustomDistanceRaw}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`${props.uid}-custom-unit`}
              className="text-[12px] font-semibold text-muted"
            >
              Unit
            </label>
            <select
              id={`${props.uid}-custom-unit`}
              value={props.customUnit}
              onChange={(e) =>
                props.setCustomUnit(e.target.value as DistanceUnit)
              }
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] outline-none focus:border-cat-health focus:ring-2 focus:ring-cat-health/20"
            >
              <option value="km">km</option>
              <option value="miles">miles</option>
            </select>
          </div>
        </div>
      ) : null}
      <div
        role="group"
        aria-label="Primary pace display"
        className="flex gap-1.5"
      >
        {(["km", "mile"] as const).map((u) => {
          const selected = props.displayUnit === u;
          return (
            <button
              key={u}
              type="button"
              aria-pressed={selected}
              onClick={() => props.setDisplayUnit(u)}
              className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                selected
                  ? `${healthTheme.solid} text-white`
                  : "bg-background text-foreground hover:bg-cat-health-soft"
              }`}
            >
              Show {u === "km" ? "min/km" : "min/mile"} first
            </button>
          );
        })}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold text-muted">
          Finish time range
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            id={`${props.uid}-sh`}
            label="Start hours"
            value={props.startH}
            onChange={props.setStartH}
          />
          <NumberField
            id={`${props.uid}-sm`}
            label="Start min"
            value={props.startM}
            onChange={props.setStartM}
          />
          <NumberField
            id={`${props.uid}-ss`}
            label="Start sec"
            value={props.startS}
            onChange={props.setStartS}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            id={`${props.uid}-eh`}
            label="End hours"
            value={props.endH}
            onChange={props.setEndH}
          />
          <NumberField
            id={`${props.uid}-em`}
            label="End min"
            value={props.endM}
            onChange={props.setEndM}
          />
          <NumberField
            id={`${props.uid}-es`}
            label="End sec"
            value={props.endS}
            onChange={props.setEndS}
          />
        </div>
        <NumberField
          id={`${props.uid}-step`}
          label="Step"
          value={props.stepMinRaw}
          onChange={props.setStepMinRaw}
          suffix="min"
        />
      </fieldset>
    </div>
  );
}

function SplitsInputs(props: {
  uid: string;
  goalDistanceRace: ChartRaceId;
  setGoalDistanceRace: (id: ChartRaceId) => void;
  goalCustomRaw: string;
  setGoalCustomRaw: (v: string) => void;
  goalCustomUnit: DistanceUnit;
  setGoalCustomUnit: (u: DistanceUnit) => void;
  goalH: string;
  setGoalH: (v: string) => void;
  goalM: string;
  setGoalM: (v: string) => void;
  goalS: string;
  setGoalS: (v: string) => void;
  splitUnit: SplitUnit;
  setSplitUnit: (u: SplitUnit) => void;
  plan: PacePlan;
  setPlan: (p: PacePlan) => void;
  skewRaw: string;
  setSkewRaw: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">Distance</span>
        <RacePresetButtons
          raceId={props.goalDistanceRace}
          setRaceId={props.setGoalDistanceRace}
        />
      </div>
      {props.goalDistanceRace === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${props.uid}-gd`}
            label="Custom distance"
            value={props.goalCustomRaw}
            onChange={props.setGoalCustomRaw}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`${props.uid}-gu`}
              className="text-[12px] font-semibold text-muted"
            >
              Unit
            </label>
            <select
              id={`${props.uid}-gu`}
              value={props.goalCustomUnit}
              onChange={(e) =>
                props.setGoalCustomUnit(e.target.value as DistanceUnit)
              }
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] outline-none focus:border-cat-health focus:ring-2 focus:ring-cat-health/20"
            >
              <option value="km">km</option>
              <option value="miles">miles</option>
            </select>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">
          Goal finish time
        </span>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            id={`${props.uid}-gh`}
            label="Hours"
            value={props.goalH}
            onChange={props.setGoalH}
          />
          <NumberField
            id={`${props.uid}-gm`}
            label="Minutes"
            value={props.goalM}
            onChange={props.setGoalM}
          />
          <NumberField
            id={`${props.uid}-gs`}
            label="Seconds"
            value={props.goalS}
            onChange={props.setGoalS}
          />
        </div>
      </div>
      <div role="group" aria-label="Split unit" className="flex gap-1.5">
        {(
          [
            { id: "km" as const, label: "Per km" },
            { id: "mile" as const, label: "Per mile" },
          ] as const
        ).map((opt) => {
          const selected = props.splitUnit === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => props.setSplitUnit(opt.id)}
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
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-muted">
          Pacing plan
        </span>
        <div className="flex flex-col gap-1.5">
          {(
            [
              { id: "even" as const, label: "Even splits" },
              { id: "slower-first" as const, label: "Slower first half" },
              { id: "faster-first" as const, label: "Faster first half" },
            ] as const
          ).map((opt) => {
            const selected = props.plan === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => props.setPlan(opt.id)}
                className={`rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition ${
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
      {props.plan !== "even" ? (
        <NumberField
          id={`${props.uid}-skew`}
          label="First-half difference (1–5%)"
          value={props.skewRaw}
          onChange={props.setSkewRaw}
          suffix="%"
        />
      ) : null}
      <p className="text-[12px] leading-relaxed text-muted">
        Plans adjust first- and second-half pace symmetrically so the total
        finish time stays the same. This tool does not recommend a plan.
      </p>
    </div>
  );
}
