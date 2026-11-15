"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Fuel, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  calculateFuelCost,
  type DistanceUnit,
  type EfficiencyUnit,
  type FuelMode,
  type FuelPriceUnit,
  type FuelVolumeUnit,
} from "@/lib/utils/fuel-cost";

const lifeTheme = CATEGORY_THEME[getCategoryTheme("everyday-life")];

const MODES: { id: FuelMode; label: string; shortLabel: string }[] = [
  {
    id: "trip",
    label: "Trip cost",
    shortLabel: "Distance, efficiency, price and extras",
  },
  {
    id: "efficiency",
    label: "Find my efficiency",
    shortLabel: "Distance driven and fuel used",
  },
  {
    id: "convert",
    label: "Convert efficiency",
    shortLabel: "km/L, L/100 km, MPG US and UK",
  },
];

const DISTANCE_UNITS: { id: DistanceUnit; label: string }[] = [
  { id: "km", label: "Kilometres" },
  { id: "mi", label: "Miles" },
];

const EFFICIENCY_UNITS: { id: EfficiencyUnit; label: string }[] = [
  { id: "km_l", label: "km/L" },
  { id: "l_100km", label: "L/100 km" },
  { id: "mpg_us", label: "MPG (US)" },
  { id: "mpg_uk", label: "MPG (UK)" },
];

const PRICE_UNITS: { id: FuelPriceUnit; label: string }[] = [
  { id: "per_litre", label: "Per litre" },
  { id: "per_us_gallon", label: "Per US gallon" },
  { id: "per_uk_gallon", label: "Per UK gallon" },
];

const VOLUME_UNITS: { id: FuelVolumeUnit; label: string }[] = [
  { id: "litre", label: "Litres" },
  { id: "us_gallon", label: "US gallons" },
  { id: "uk_gallon", label: "UK gallons" },
];

function formatQty(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Trip fuel cost and efficiency — estimates from numbers you enter.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function FuelCostCalculator() {
  const [mode, setMode] = useState<FuelMode>("trip");
  const [distanceRaw, setDistanceRaw] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [efficiencyRaw, setEfficiencyRaw] = useState("");
  const [efficiencyUnit, setEfficiencyUnit] =
    useState<EfficiencyUnit>("km_l");
  const [fuelPriceRaw, setFuelPriceRaw] = useState("");
  const [fuelPriceUnit, setFuelPriceUnit] =
    useState<FuelPriceUnit>("per_litre");
  const [roundTrip, setRoundTrip] = useState(false);
  const [tollsRaw, setTollsRaw] = useState("");
  const [otherRaw, setOtherRaw] = useState("");
  const [peopleRaw, setPeopleRaw] = useState("1");
  const [fuelUsedRaw, setFuelUsedRaw] = useState("");
  const [fuelUsedUnit, setFuelUsedUnit] = useState<FuelVolumeUnit>("litre");
  const [currencyId, setCurrencyId] = useState("USD");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const money = (value: number) => formatMoney(value, currencyId);

  const selectMode = useCallback((next: FuelMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("trip");
    setDistanceRaw("");
    setDistanceUnit("km");
    setEfficiencyRaw("");
    setEfficiencyUnit("km_l");
    setFuelPriceRaw("");
    setFuelPriceUnit("per_litre");
    setRoundTrip(false);
    setTollsRaw("");
    setOtherRaw("");
    setPeopleRaw("1");
    setFuelUsedRaw("");
    setFuelUsedUnit("litre");
    setCurrencyId("USD");
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

  const result =
    mode === "trip"
      ? calculateFuelCost({
          mode: "trip",
          distance: parseDecimal(distanceRaw),
          distanceUnit,
          efficiency: parseDecimal(efficiencyRaw),
          efficiencyUnit,
          fuelPrice: parseDecimal(fuelPriceRaw),
          fuelPriceUnit,
          roundTrip,
          tolls: parseDecimal(tollsRaw),
          otherCosts: parseDecimal(otherRaw),
          people: parseDecimal(peopleRaw),
        })
      : mode === "efficiency"
        ? calculateFuelCost({
            mode: "efficiency",
            distance: parseDecimal(distanceRaw),
            distanceUnit,
            fuelUsed: parseDecimal(fuelUsedRaw),
            fuelUsedUnit,
            fuelPrice: parseDecimal(fuelPriceRaw),
            fuelPriceUnit,
          })
        : calculateFuelCost({
            mode: "convert",
            efficiency: parseDecimal(efficiencyRaw),
            efficiencyUnit,
          });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="fuel-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="fuel-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Fuel
                className={`size-5 ${lifeTheme.text}`}
                aria-hidden="true"
              />
              Fuel cost inputs
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
            Estimates use the numbers you enter. Real consumption changes with
            driving, load, weather and traffic, and map distances can differ.
            This page does not look up fuel prices.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Fuel cost calculator modes"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-3"
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
                      ? `${lifeTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-everyday-soft hover:text-cat-everyday"
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
            {mode !== "convert" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  id={`${uid}-distance`}
                  label="Distance"
                  value={distanceRaw}
                  onChange={setDistanceRaw}
                />
                <SelectField
                  id={`${uid}-distance-unit`}
                  label="Distance unit"
                  value={distanceUnit}
                  options={DISTANCE_UNITS}
                  onChange={(v) => setDistanceUnit(v as DistanceUnit)}
                />
              </div>
            ) : null}

            {mode === "trip" || mode === "convert" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  id={`${uid}-efficiency`}
                  label="Fuel efficiency"
                  value={efficiencyRaw}
                  onChange={setEfficiencyRaw}
                />
                <SelectField
                  id={`${uid}-efficiency-unit`}
                  label="Efficiency unit"
                  value={efficiencyUnit}
                  options={EFFICIENCY_UNITS}
                  onChange={(v) => setEfficiencyUnit(v as EfficiencyUnit)}
                />
              </div>
            ) : null}

            {mode === "efficiency" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  id={`${uid}-fuel-used`}
                  label="Fuel used"
                  value={fuelUsedRaw}
                  onChange={setFuelUsedRaw}
                />
                <SelectField
                  id={`${uid}-fuel-used-unit`}
                  label="Fuel unit"
                  value={fuelUsedUnit}
                  options={VOLUME_UNITS}
                  onChange={(v) => setFuelUsedUnit(v as FuelVolumeUnit)}
                />
              </div>
            ) : null}

            {mode === "trip" || mode === "efficiency" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-price`}
                    label={
                      mode === "efficiency"
                        ? "Fuel price (optional)"
                        : "Fuel price"
                    }
                    value={fuelPriceRaw}
                    onChange={setFuelPriceRaw}
                  />
                  <SelectField
                    id={`${uid}-price-unit`}
                    label="Price unit"
                    value={fuelPriceUnit}
                    options={PRICE_UNITS}
                    onChange={(v) => setFuelPriceUnit(v as FuelPriceUnit)}
                  />
                </div>
                <SelectField
                  id={`${uid}-currency`}
                  label="Currency"
                  value={currencyId}
                  options={CURRENCY_OPTIONS.map((c) => ({
                    id: c.id,
                    label: c.label,
                  }))}
                  onChange={setCurrencyId}
                />
              </>
            ) : null}

            {mode === "trip" ? (
              <>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-panel/60 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={roundTrip}
                    onChange={(event) => setRoundTrip(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-border text-cat-everyday focus:ring-cat-everyday/30"
                  />
                  <span className="text-[13px] font-semibold text-foreground">
                    Round trip
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-tolls`}
                    label="Tolls (optional)"
                    value={tollsRaw}
                    onChange={setTollsRaw}
                  />
                  <NumberField
                    id={`${uid}-other`}
                    label="Other costs (optional)"
                    value={otherRaw}
                    onChange={setOtherRaw}
                  />
                </div>
                <NumberField
                  id={`${uid}-people`}
                  label="People to split with"
                  value={peopleRaw}
                  onChange={setPeopleRaw}
                  hint="Use 1 to skip splitting. Must be a whole number."
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="fuel-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="fuel-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "trip"
              ? "Trip cost"
              : mode === "efficiency"
                ? "Measured efficiency"
                : "Converted efficiency"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : result.mode === "trip" ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">Total cost</p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {money(result.totalCost)}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label="Fuel needed"
                  value={`${formatQty(result.fuelLitres)} L`}
                />
                <Stat
                  label="US gallons"
                  value={formatQty(result.fuelUsGallons)}
                />
                <Stat
                  label="UK gallons"
                  value={formatQty(result.fuelUkGallons)}
                />
                <Stat label="Fuel cost" value={money(result.fuelCost)} />
                <Stat label="Total cost" value={money(result.totalCost)} />
                <Stat
                  label="Cost per person"
                  value={money(result.costPerPerson)}
                />
                <Stat label="Cost per km" value={money(result.costPerKm)} />
                <Stat label="Cost per mile" value={money(result.costPerMile)} />
              </dl>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Efficiency (km/L)
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatQty(result.efficiency.kmPerLitre)}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="km/L"
                  value={formatQty(result.efficiency.kmPerLitre)}
                />
                <Stat
                  label="L/100 km"
                  value={formatQty(result.efficiency.litresPer100km)}
                />
                <Stat
                  label="MPG (US)"
                  value={formatQty(result.efficiency.mpgUs)}
                />
                <Stat
                  label="MPG (UK)"
                  value={formatQty(result.efficiency.mpgUk)}
                />
              </dl>
              {result.mode === "efficiency" && result.costPerKm !== null ? (
                <Stat
                  label="Cost per km"
                  value={money(result.costPerKm)}
                />
              ) : null}
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
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
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
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
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-everyday/40 focus:border-cat-everyday focus:bg-panel focus:ring-2 focus:ring-cat-everyday/20"
      />
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-everyday/40 focus:border-cat-everyday focus:ring-2 focus:ring-cat-everyday/20"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
