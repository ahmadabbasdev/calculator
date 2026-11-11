"use client";

import { useId, useState } from "react";
import { Flag, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  formatDuration,
  formatPace,
  parseHms,
  type DistanceUnit,
} from "@/lib/utils/pace";
import {
  DEFAULT_RIEGEL_EXPONENT,
  MAX_RIEGEL_EXPONENT,
  MIN_RIEGEL_EXPONENT,
  RACE_PREDICTOR_PRESETS,
  calculateRacePredictions,
  resolveInputDistanceKm,
  type RacePredictorPresetId,
} from "@/lib/utils/race-predictor";

const healthTheme = CATEGORY_THEME[getCategoryTheme("health")];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Race time predictor using Peter Riegel's formula.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function RaceTimePredictor() {
  const [presetId, setPresetId] = useState<RacePredictorPresetId>("5k");
  const [customDistanceRaw, setCustomDistanceRaw] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [hoursRaw, setHoursRaw] = useState("");
  const [minutesRaw, setMinutesRaw] = useState("");
  const [secondsRaw, setSecondsRaw] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [exponentRaw, setExponentRaw] = useState(String(DEFAULT_RIEGEL_EXPONENT));
  const [customTargetRaw, setCustomTargetRaw] = useState("");
  const [customTargetUnit, setCustomTargetUnit] =
    useState<DistanceUnit>("km");

  const uid = useId();

  function handleReset() {
    setPresetId("5k");
    setCustomDistanceRaw("");
    setDistanceUnit("km");
    setHoursRaw("");
    setMinutesRaw("");
    setSecondsRaw("");
    setShowMore(false);
    setExponentRaw(String(DEFAULT_RIEGEL_EXPONENT));
    setCustomTargetRaw("");
    setCustomTargetUnit("km");
  }

  const preset = RACE_PREDICTOR_PRESETS.find((p) => p.id === presetId);
  const distanceKm =
    presetId === "custom"
      ? resolveInputDistanceKm(
          parseOptionalNumber(customDistanceRaw),
          distanceUnit,
        )
      : (preset?.km ?? null);

  const timeSeconds = parseHms(
    parseOptionalNumber(hoursRaw),
    parseOptionalNumber(minutesRaw),
    parseOptionalNumber(secondsRaw),
  );

  const customTargetKm = resolveInputDistanceKm(
    parseOptionalNumber(customTargetRaw),
    customTargetUnit,
  );

  const result = calculateRacePredictions({
    distanceKm,
    timeSeconds,
    exponent: parseOptionalNumber(exponentRaw),
    customTargetKm:
      parseOptionalNumber(customTargetRaw) === null ? null : customTargetKm,
  });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="race-pred-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="race-pred-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Flag
                className={`size-5 ${healthTheme.text}`}
                aria-hidden="true"
              />
              Recent race
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

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-muted">
                Race distance
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RACE_PREDICTOR_PRESETS.map((item) => {
                  const selected = presetId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPresetId(item.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
                        selected
                          ? `${healthTheme.solid} text-white`
                          : "border border-border/80 bg-background text-foreground hover:border-cat-health/40 hover:bg-cat-health-soft hover:text-cat-health"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={presetId === "custom"}
                  onClick={() => setPresetId("custom")}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
                    presetId === "custom"
                      ? `${healthTheme.solid} text-white`
                      : "border border-border/80 bg-background text-foreground hover:border-cat-health/40 hover:bg-cat-health-soft hover:text-cat-health"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {presetId === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  id={`${uid}-custom-distance`}
                  label="Distance"
                  value={customDistanceRaw}
                  onChange={setCustomDistanceRaw}
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
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-muted">
                Finish time
              </span>
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

            <div className="rounded-lg border border-border/60 bg-background/70 p-3">
              <button
                type="button"
                aria-expanded={showMore}
                onClick={() => setShowMore((prev) => !prev)}
                className="w-full text-left text-[13px] font-semibold text-foreground"
              >
                {showMore ? "Hide more options" : "More options"}
              </button>
              {showMore ? (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <NumberField
                      id={`${uid}-exponent`}
                      label="Riegel exponent"
                      value={exponentRaw}
                      onChange={setExponentRaw}
                    />
                    <p className="text-[12px] leading-relaxed text-muted">
                      Default {DEFAULT_RIEGEL_EXPONENT} is a common public value
                      for this formula — not a personal truth. Allowed range{" "}
                      {MIN_RIEGEL_EXPONENT.toFixed(2)}–
                      {MAX_RIEGEL_EXPONENT.toFixed(2)}.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      id={`${uid}-custom-target`}
                      label="Custom target distance"
                      value={customTargetRaw}
                      onChange={setCustomTargetRaw}
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        htmlFor={`${uid}-custom-target-unit`}
                        className="text-[12px] font-semibold text-muted"
                      >
                        Unit
                      </label>
                      <select
                        id={`${uid}-custom-target-unit`}
                        value={customTargetUnit}
                        onChange={(event) =>
                          setCustomTargetUnit(
                            event.target.value as DistanceUnit,
                          )
                        }
                        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:ring-2 focus:ring-cat-health/20"
                      >
                        <option value="km">km</option>
                        <option value="miles">miles</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="race-pred-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="race-pred-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Predicted times
            </span>
            <span className="text-[12px] text-muted">
              T₂ = T₁ × (D₂ ÷ D₁)^e
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] border-collapse text-left text-[13px]">
                  <caption className="sr-only">
                    Predicted race times with pace per kilometre and per mile
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Distance
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        Pace /km
                      </th>
                      <th
                        scope="col"
                        className="py-2 font-semibold tabular-nums"
                      >
                        Pace /mi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b border-border/60 ${
                          row.isInput
                            ? "bg-cat-health-soft/60 font-semibold text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        <th
                          scope="row"
                          className="py-2.5 pr-3 text-left font-medium"
                        >
                          {row.label}
                          {row.isInput ? (
                            <span className="ml-1.5 text-[11px] font-semibold text-muted">
                              (input)
                            </span>
                          ) : null}
                        </th>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {formatDuration(row.timeSeconds)}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {formatPace(row.secPerKm)}
                        </td>
                        <td className="py-2.5 tabular-nums">
                          {formatPace(row.secPerMile)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.working && (
                <p
                  className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${healthTheme.borderSoft} ${healthTheme.soft} ${healthTheme.text}`}
                >
                  <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                    Worked step
                  </span>
                  {result.working}
                </p>
              )}

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
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-health/40 focus:border-cat-health focus:bg-panel focus:ring-2 focus:ring-cat-health/20"
      />
    </div>
  );
}
