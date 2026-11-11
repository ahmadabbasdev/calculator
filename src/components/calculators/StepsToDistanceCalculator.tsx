"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Footprints, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  DEFAULT_HEIGHT_STEP_PERCENT,
  STEP_LENGTH_PRESETS_CM,
  calculateSteps,
  formatWalkTime,
  type DistanceUnit,
  type StepLengthMode,
  type StepLengthUnit,
  type StepsMode,
} from "@/lib/utils/steps";

const healthTheme = CATEGORY_THEME[getCategoryTheme("health")];

const MODES: {
  id: StepsMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "steps-to-distance",
    label: "Steps to distance",
    shortLabel: "Steps → km, miles, meters, feet",
  },
  {
    id: "distance-to-steps",
    label: "Distance to steps",
    shortLabel: "Distance → step count",
  },
  {
    id: "time-to-walk",
    label: "Time to walk",
    shortLabel: "Steps + cadence → hours & minutes",
  },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatDisplay(value: number, digits: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Steps ↔ distance calculator with optional walk-time from cadence.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function StepsToDistanceCalculator() {
  const [mode, setMode] = useState<StepsMode>("steps-to-distance");
  const [stepsRaw, setStepsRaw] = useState("");
  const [distanceRaw, setDistanceRaw] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [cadenceRaw, setCadenceRaw] = useState("100");
  const [stepLengthMode, setStepLengthMode] =
    useState<StepLengthMode>("known");
  const [stepLengthUnit, setStepLengthUnit] = useState<StepLengthUnit>("cm");
  const [stepLengthRaw, setStepLengthRaw] = useState("76.2");
  const [heightRaw, setHeightRaw] = useState("");
  const [heightUnit, setHeightUnit] = useState<StepLengthUnit>("cm");
  const [heightPercentRaw, setHeightPercentRaw] = useState(
    String(DEFAULT_HEIGHT_STEP_PERCENT),
  );

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: StepsMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("steps-to-distance");
    setStepsRaw("");
    setDistanceRaw("");
    setDistanceUnit("km");
    setCadenceRaw("100");
    setStepLengthMode("known");
    setStepLengthUnit("cm");
    setStepLengthRaw("76.2");
    setHeightRaw("");
    setHeightUnit("cm");
    setHeightPercentRaw(String(DEFAULT_HEIGHT_STEP_PERCENT));
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

  function applyStepPreset(cm: number) {
    setStepLengthMode("known");
    if (stepLengthUnit === "cm") {
      setStepLengthRaw(String(cm));
    } else {
      setStepLengthRaw(String(Number((cm / 2.54).toFixed(4))));
    }
  }

  const result = calculateSteps({
    mode,
    steps: parseOptionalNumber(stepsRaw),
    distance: parseOptionalNumber(distanceRaw),
    distanceUnit,
    cadence: parseOptionalNumber(cadenceRaw),
    stepLength: parseOptionalNumber(stepLengthRaw),
    stepLengthUnit,
    stepLengthMode,
    height: parseOptionalNumber(heightRaw),
    heightUnit,
    heightPercent: parseOptionalNumber(heightPercentRaw),
  });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="steps-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="steps-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Footprints
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
            aria-label="Steps calculation modes"
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
            {(mode === "steps-to-distance" || mode === "time-to-walk") && (
              <NumberField
                id={`${uid}-steps`}
                label="Steps"
                value={stepsRaw}
                onChange={setStepsRaw}
              />
            )}

            {mode === "distance-to-steps" && (
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
                    <option value="feet">feet</option>
                  </select>
                </div>
              </div>
            )}

            {mode === "time-to-walk" && (
              <div className="flex flex-col gap-1.5">
                <NumberField
                  id={`${uid}-cadence`}
                  label="Cadence (steps per minute)"
                  value={cadenceRaw}
                  onChange={setCadenceRaw}
                  suffix="spm"
                />
                <p className="text-[12px] leading-relaxed text-muted">
                  100 steps per minute is shown as an example only — adjust to
                  match your usual walking rate.
                </p>
              </div>
            )}

            <StepLengthPanel
              uid={uid}
              stepLengthMode={stepLengthMode}
              setStepLengthMode={setStepLengthMode}
              stepLengthUnit={stepLengthUnit}
              setStepLengthUnit={setStepLengthUnit}
              stepLengthRaw={stepLengthRaw}
              setStepLengthRaw={setStepLengthRaw}
              heightRaw={heightRaw}
              setHeightRaw={setHeightRaw}
              heightUnit={heightUnit}
              setHeightUnit={setHeightUnit}
              heightPercentRaw={heightPercentRaw}
              setHeightPercentRaw={setHeightPercentRaw}
              onPreset={applyStepPreset}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="steps-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="steps-outcome-heading"
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
              {mode === "steps-to-distance" && (
                <>
                  <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                    {formatDisplay(result.km, 2)} km
                  </p>
                  <ResultGrid
                    items={[
                      {
                        label: "Miles",
                        value: formatDisplay(result.miles, 2),
                      },
                      {
                        label: "Meters",
                        value: formatDisplay(result.meters, 1),
                      },
                      {
                        label: "Feet",
                        value: formatDisplay(result.feet, 0),
                      },
                    ]}
                  />
                </>
              )}

              {mode === "distance-to-steps" && (
                <>
                  <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                    {formatDisplay(result.steps, 0)} steps
                  </p>
                  <p className="text-[13px] text-muted tabular-nums">
                    Step length {formatDisplay(result.stepLengthCm, 2)} cm (
                    {formatDisplay(result.stepLengthM, 3)} m)
                  </p>
                </>
              )}

              {mode === "time-to-walk" && result.totalMinutes !== null && (
                <>
                  <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                    {formatWalkTime(result.totalMinutes)}
                  </p>
                  <ResultGrid
                    items={[
                      {
                        label: "Distance",
                        value: `${formatDisplay(result.km, 2)} km`,
                      },
                      {
                        label: "Miles",
                        value: formatDisplay(result.miles, 2),
                      },
                    ]}
                  />
                </>
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
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:bg-panel focus:ring-2 focus:ring-cat-health/20 ${suffix ? "pr-12" : ""}`}
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

function StepLengthPanel({
  uid,
  stepLengthMode,
  setStepLengthMode,
  stepLengthUnit,
  setStepLengthUnit,
  stepLengthRaw,
  setStepLengthRaw,
  heightRaw,
  setHeightRaw,
  heightUnit,
  setHeightUnit,
  heightPercentRaw,
  setHeightPercentRaw,
  onPreset,
}: {
  uid: string;
  stepLengthMode: StepLengthMode;
  setStepLengthMode: (m: StepLengthMode) => void;
  stepLengthUnit: StepLengthUnit;
  setStepLengthUnit: (u: StepLengthUnit) => void;
  stepLengthRaw: string;
  setStepLengthRaw: (v: string) => void;
  heightRaw: string;
  setHeightRaw: (v: string) => void;
  heightUnit: StepLengthUnit;
  setHeightUnit: (u: StepLengthUnit) => void;
  heightPercentRaw: string;
  setHeightPercentRaw: (v: string) => void;
  onPreset: (cm: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
      <span className="text-[12px] font-semibold text-muted">Step length</span>

      <div
        role="group"
        aria-label="How to set step length"
        className="flex flex-col gap-1.5"
      >
        {(
          [
            { id: "known" as const, label: "I know my step length" },
            { id: "from-height" as const, label: "Estimate from my height" },
          ] as const
        ).map((opt) => {
          const selected = stepLengthMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setStepLengthMode(opt.id)}
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

      {stepLengthMode === "known" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id={`${uid}-step-length`}
              label="Step length"
              value={stepLengthRaw}
              onChange={setStepLengthRaw}
            />
            <div
              role="group"
              aria-label="Step length unit"
              className="flex flex-col gap-1"
            >
              <span className="text-[12px] font-semibold text-muted">Unit</span>
              <div className="flex gap-1.5">
                {(["cm", "inches"] as const).map((unit) => {
                  const selected = stepLengthUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setStepLengthUnit(unit)}
                      className={`flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                        selected
                          ? `${healthTheme.solid} text-white`
                          : "bg-background text-foreground hover:bg-cat-health-soft"
                      }`}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-muted">
              Quick presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STEP_LENGTH_PRESETS_CM.map((cm) => (
                <button
                  key={cm}
                  type="button"
                  onClick={() => onPreset(cm)}
                  className="rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition hover:border-cat-health/40 hover:bg-cat-health-soft hover:text-cat-health"
                >
                  {cm} cm
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id={`${uid}-height`}
              label="Height"
              value={heightRaw}
              onChange={setHeightRaw}
            />
            <div
              role="group"
              aria-label="Height unit"
              className="flex flex-col gap-1"
            >
              <span className="text-[12px] font-semibold text-muted">Unit</span>
              <div className="flex gap-1.5">
                {(["cm", "inches"] as const).map((unit) => {
                  const selected = heightUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setHeightUnit(unit)}
                      className={`flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                        selected
                          ? `${healthTheme.solid} text-white`
                          : "bg-background text-foreground hover:bg-cat-health-soft"
                      }`}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <NumberField
            id={`${uid}-height-percent`}
            label="Step length as % of height"
            value={heightPercentRaw}
            onChange={setHeightPercentRaw}
            suffix="%"
          />
          <p className="text-[12px] leading-relaxed text-muted">
            Default {DEFAULT_HEIGHT_STEP_PERCENT}% is a rough rule of thumb.
            Real step length varies between people, walking speed, and terrain.
          </p>
        </>
      )}

      <details className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
        <summary className="cursor-pointer text-[13px] font-semibold text-foreground">
          How to measure your own step length
        </summary>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Take 10 normal walking steps in a straight line. Measure the distance
          from the first toe-off to the tenth landing, then divide by 10. Enter
          that average as your step length above.
        </p>
      </details>
    </div>
  );
}
