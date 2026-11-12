"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { RefreshCw, Thermometer } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  DEFAULT_BTU_PER_EXTRA_PERSON,
  DEFAULT_CEILING_FT,
  DEFAULT_COMMON_BTU_SIZES,
  DEFAULT_COMMON_TONS,
  DEFAULT_COOLING_BTU_PER_SQFT,
  DEFAULT_KITCHEN_BTU,
  HEATING_PRESETS,
  PEOPLE_BASELINE,
  calculateBtu,
  convertBtuH,
  defaultSunFraction,
  type AreaUnit,
  type BtuMode,
  type HeatingClimate,
  type HeightUnit,
  type SunExposure,
} from "@/lib/utils/btu";

const homeTheme = CATEGORY_THEME[getCategoryTheme("home-energy")];

const MODES: {
  id: BtuMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "cooling",
    label: "Cooling",
    shortLabel: "Air conditioner BTU/h and tons",
  },
  {
    id: "heating",
    label: "Heating",
    shortLabel: "Heater thermal output BTU/h",
  },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatBtuDisplay(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * BTU room sizing — cooling and heating rules of thumb.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function BtuCalculator() {
  const [mode, setMode] = useState<BtuMode>("cooling");
  const [areaRaw, setAreaRaw] = useState("");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqft");
  const [ceilingRaw, setCeilingRaw] = useState(String(DEFAULT_CEILING_FT));
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("ft");
  const [coolingBtuPerSqFtRaw, setCoolingBtuPerSqFtRaw] = useState(
    String(DEFAULT_COOLING_BTU_PER_SQFT),
  );
  const [sun, setSun] = useState<SunExposure>("normal");
  const [sunFractionRaw, setSunFractionRaw] = useState("");
  const [peopleRaw, setPeopleRaw] = useState(String(PEOPLE_BASELINE));
  const [btuPerExtraPersonRaw, setBtuPerExtraPersonRaw] = useState(
    String(DEFAULT_BTU_PER_EXTRA_PERSON),
  );
  const [kitchen, setKitchen] = useState(false);
  const [kitchenBtuRaw, setKitchenBtuRaw] = useState(
    String(DEFAULT_KITCHEN_BTU),
  );
  const [climate, setClimate] = useState<HeatingClimate>("moderate");
  const [heatingBtuPerSqFtRaw, setHeatingBtuPerSqFtRaw] = useState(
    String(HEATING_PRESETS.moderate.btuPerSqFt),
  );
  const [commonSizesRaw, setCommonSizesRaw] = useState(
    DEFAULT_COMMON_BTU_SIZES.join(", "),
  );
  const [showMore, setShowMore] = useState(false);
  const [convertRaw, setConvertRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: BtuMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("cooling");
    setAreaRaw("");
    setAreaUnit("sqft");
    setCeilingRaw(String(DEFAULT_CEILING_FT));
    setHeightUnit("ft");
    setCoolingBtuPerSqFtRaw(String(DEFAULT_COOLING_BTU_PER_SQFT));
    setSun("normal");
    setSunFractionRaw("");
    setPeopleRaw(String(PEOPLE_BASELINE));
    setBtuPerExtraPersonRaw(String(DEFAULT_BTU_PER_EXTRA_PERSON));
    setKitchen(false);
    setKitchenBtuRaw(String(DEFAULT_KITCHEN_BTU));
    setClimate("moderate");
    setHeatingBtuPerSqFtRaw(String(HEATING_PRESETS.moderate.btuPerSqFt));
    setCommonSizesRaw(DEFAULT_COMMON_BTU_SIZES.join(", "));
    setShowMore(false);
    setConvertRaw("");
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
    selectMode(MODES[nextIndex]!.id);
    tabRefs.current[nextIndex]?.focus();
  }

  const commonBtuSizes = commonSizesRaw
    .split(/[\s,]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);
  const sizesForCalc =
    commonBtuSizes.length > 0 ? commonBtuSizes : [...DEFAULT_COMMON_BTU_SIZES];

  const sunFractionOverride = parseOptionalNumber(sunFractionRaw);
  const result =
    mode === "cooling"
      ? calculateBtu({
          mode: "cooling",
          area: parseOptionalNumber(areaRaw),
          areaUnit,
          ceiling: parseOptionalNumber(ceilingRaw),
          heightUnit,
          btuPerSqFt: parseOptionalNumber(coolingBtuPerSqFtRaw),
          sun,
          sunFraction:
            sunFractionOverride === null
              ? defaultSunFraction(sun)
              : sunFractionOverride / 100,
          people: parseOptionalNumber(peopleRaw),
          btuPerExtraPerson: parseOptionalNumber(btuPerExtraPersonRaw),
          kitchen,
          kitchenBtu: parseOptionalNumber(kitchenBtuRaw),
          commonBtuSizes: sizesForCalc,
          commonTons: [...DEFAULT_COMMON_TONS],
        })
      : calculateBtu({
          mode: "heating",
          area: parseOptionalNumber(areaRaw),
          areaUnit,
          ceiling: parseOptionalNumber(ceilingRaw),
          heightUnit,
          climate,
          btuPerSqFt:
            climate === "custom"
              ? parseOptionalNumber(heatingBtuPerSqFtRaw)
              : HEATING_PRESETS[climate].btuPerSqFt,
          commonBtuSizes: sizesForCalc,
          commonTons: [...DEFAULT_COMMON_TONS],
        });

  const convertResult = convertBtuH(parseOptionalNumber(convertRaw));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="btu-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="btu-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Thermometer
                className={`size-5 ${homeTheme.text}`}
                aria-hidden="true"
              />
              Room size
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
            A rough sizing estimate, not a heat-load calculation. Proper sizing
            considers insulation, windows, orientation, climate and local rules.
            Ask a qualified HVAC professional.
            {mode === "heating"
              ? " Fuel-burning heaters need proper ventilation; follow the manufacturer’s instructions."
              : null}
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="BTU calculator modes"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
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
                      ? `${homeTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-home-soft hover:text-cat-home"
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
            className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-area`}
                label="Room area"
                value={areaRaw}
                onChange={setAreaRaw}
              />
              <UnitToggle
                label="Area unit"
                value={areaUnit}
                options={[
                  { id: "sqft", label: "ft²" },
                  { id: "sqm", label: "m²" },
                ]}
                onChange={setAreaUnit}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-ceiling`}
                label="Ceiling height"
                value={ceilingRaw}
                onChange={setCeilingRaw}
              />
              <UnitToggle
                label="Height unit"
                value={heightUnit}
                options={[
                  { id: "ft", label: "ft" },
                  { id: "m", label: "m" },
                ]}
                onChange={setHeightUnit}
              />
            </div>

            {mode === "cooling" ? (
              <>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-[12px] font-semibold text-muted">
                    Sun exposure
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Sun exposure"
                    className="grid grid-cols-1 gap-1.5 sm:grid-cols-3"
                  >
                    {(
                      [
                        { id: "normal" as const, label: "Normal" },
                        { id: "very-sunny" as const, label: "Very sunny" },
                        {
                          id: "heavily-shaded" as const,
                          label: "Heavily shaded",
                        },
                      ] as const
                    ).map((option) => {
                      const selected = sun === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-[12px] font-semibold transition ${
                            selected
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-border/80 bg-background text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${uid}-sun`}
                            value={option.id}
                            checked={selected}
                            onChange={() => {
                              setSun(option.id);
                              setSunFractionRaw("");
                            }}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <NumberField
                  id={`${uid}-people`}
                  label="People in the room"
                  value={peopleRaw}
                  onChange={setPeopleRaw}
                  hint={`Adds ${DEFAULT_BTU_PER_EXTRA_PERSON} BTU/h for each person beyond ${PEOPLE_BASELINE}`}
                />

                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[13px] text-foreground">
                  <input
                    type="checkbox"
                    checked={kitchen}
                    onChange={(event) => setKitchen(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span>
                    <span className="font-semibold">Kitchen</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      Adds {DEFAULT_KITCHEN_BTU.toLocaleString("en-US")} BTU/h
                      when checked (editable below)
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-[12px] font-semibold text-muted">
                    Climate / BTU per ft² (rough rules of thumb)
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Heating climate preset"
                    className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                  >
                    {(
                      [
                        { id: "mild" as const, label: HEATING_PRESETS.mild.label },
                        {
                          id: "moderate" as const,
                          label: HEATING_PRESETS.moderate.label,
                        },
                        { id: "cold" as const, label: HEATING_PRESETS.cold.label },
                        { id: "custom" as const, label: "Custom value" },
                      ] as const
                    ).map((option) => {
                      const selected = climate === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-[12px] font-semibold transition ${
                            selected
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-border/80 bg-background text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${uid}-climate`}
                            value={option.id}
                            checked={selected}
                            onChange={() => {
                              setClimate(option.id);
                              if (option.id !== "custom") {
                                setHeatingBtuPerSqFtRaw(
                                  String(HEATING_PRESETS[option.id].btuPerSqFt),
                                );
                              }
                            }}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {climate === "custom" ? (
                  <NumberField
                    id={`${uid}-heat-btu`}
                    label="Custom BTU/h per ft²"
                    value={heatingBtuPerSqFtRaw}
                    onChange={setHeatingBtuPerSqFtRaw}
                  />
                ) : null}
                <p className="text-[12px] leading-relaxed text-muted">
                  Insulation, windows and climate change the answer. The result
                  is thermal output, not electrical input.
                </p>
              </>
            )}

            <div className="border-t border-border/60 pt-3">
              <button
                type="button"
                className="text-[13px] font-semibold text-foreground underline underline-offset-2"
                aria-expanded={showMore}
                onClick={() => setShowMore((open) => !open)}
              >
                {showMore ? "Hide more options" : "More options"}
              </button>
              {showMore ? (
                <div className="mt-3 flex flex-col gap-3">
                  {mode === "cooling" ? (
                    <>
                      <NumberField
                        id={`${uid}-cool-rate`}
                        label="Base BTU/h per ft²"
                        value={coolingBtuPerSqFtRaw}
                        onChange={setCoolingBtuPerSqFtRaw}
                        hint="Rule of thumb for a typical room (default 20)"
                      />
                      <NumberField
                        id={`${uid}-sun-pct`}
                        label="Sun adjustment (% of base)"
                        value={
                          sunFractionRaw === ""
                            ? String(defaultSunFraction(sun) * 100)
                            : sunFractionRaw
                        }
                        onChange={setSunFractionRaw}
                        hint="Normal 0, very sunny +10, heavily shaded −10"
                        suffix="%"
                      />
                      <NumberField
                        id={`${uid}-extra-person`}
                        label="BTU/h per person beyond two"
                        value={btuPerExtraPersonRaw}
                        onChange={setBtuPerExtraPersonRaw}
                      />
                      <NumberField
                        id={`${uid}-kitchen-btu`}
                        label="Kitchen add-on (BTU/h)"
                        value={kitchenBtuRaw}
                        onChange={setKitchenBtuRaw}
                      />
                    </>
                  ) : null}
                  <NumberField
                    id={`${uid}-sizes`}
                    label="Typical sizes (BTU/h, comma-separated)"
                    value={commonSizesRaw}
                    onChange={setCommonSizesRaw}
                    hint="Used for “next common size up”. Check what is sold locally."
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="btu-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="btu-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "cooling" ? "Cooling estimate" : "Heating estimate"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-muted">
                  Required capacity
                </p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {formatBtuDisplay(result.requiredBtuRounded)}{" "}
                  <span className="text-2xl font-bold sm:text-3xl">BTU/h</span>
                </p>
                <p className="mt-2 text-[15px] text-muted">
                  {mode === "cooling" ? (
                    <>
                      {result.tons.toFixed(2)} ton · {result.kw.toFixed(2)} kW
                      thermal
                    </>
                  ) : (
                    <>{result.kw.toFixed(2)} kW thermal</>
                  )}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[12px] font-semibold text-muted">
                    Next common size up
                  </dt>
                  <dd className="mt-1 text-[18px] font-bold tabular-nums text-foreground">
                    {result.nextCommonBtu !== null
                      ? `${formatBtuDisplay(result.nextCommonBtu)} BTU/h`
                      : "Above listed sizes"}
                  </dd>
                  {mode === "cooling" && result.nextCommonTon !== null ? (
                    <dd className="mt-0.5 text-[13px] text-muted">
                      ≈ {result.nextCommonTon} ton step
                    </dd>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[12px] font-semibold text-muted">
                    Exact before rounding
                  </dt>
                  <dd className="mt-1 text-[18px] font-bold tabular-nums text-foreground">
                    {formatBtuDisplay(result.requiredBtuExact)} BTU/h
                  </dd>
                </div>
              </dl>

              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${homeTheme.borderSoft} ${homeTheme.soft} ${homeTheme.text}`}
              >
                <span className="font-semibold">Worked step: </span>
                {result.working}
              </p>

              {result.notes.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}

              <div>
                <h3 className="text-[14px] font-semibold text-foreground">
                  Assumptions used
                </h3>
                <p className="mt-1 text-[12px] text-muted">
                  Every adjustment is listed. Edit values under More options
                  where available.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[20rem] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 pr-3">
                          Item
                        </th>
                        <th
                          scope="col"
                          className="py-2 text-right tabular-nums"
                        >
                          BTU/h
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.adjustments.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/60 text-foreground"
                        >
                          <th
                            scope="row"
                            className="py-2 pr-3 text-left font-medium"
                          >
                            {row.label}
                            {row.editable ? (
                              <span className="ml-1 text-[11px] font-normal text-muted">
                                (editable)
                              </span>
                            ) : null}
                          </th>
                          <td className="py-2 text-right tabular-nums">
                            {row.btuPerHour >= 0 ? "+" : "−"}
                            {formatBtuDisplay(Math.abs(row.btuPerHour))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <h3 className="text-[15px] font-semibold text-foreground">
            Convert BTU/h
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            1 BTU/h = 0.29307107 W · 1 ton = 12,000 BTU/h
          </p>
          <div className="mt-3 max-w-xs">
            <NumberField
              id={`${uid}-convert`}
              label="BTU/h"
              value={convertRaw}
              onChange={setConvertRaw}
            />
          </div>
          {convertResult.ok ? (
            <p className="mt-3 text-[14px] tabular-nums text-foreground">
              {convertResult.kw.toFixed(2)} kW · {convertResult.tons.toFixed(2)}{" "}
              ton
            </p>
          ) : convertRaw.trim() !== "" ? (
            <p className="mt-3 text-[13px] text-muted">{convertResult.message}</p>
          ) : null}
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
  hint,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:bg-panel focus:ring-2 focus:ring-cat-home/20 ${suffix ? "pr-10" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function UnitToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid h-11 grid-cols-2 gap-1.5"
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-[12px] font-semibold transition ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border/80 bg-background text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              <input
                type="radio"
                name={label}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
