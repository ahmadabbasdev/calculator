"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { RefreshCw, Sun } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { CURRENCY_OPTIONS, formatMoney } from "@/lib/utils/money";
import {
  DEFAULT_DEGRADATION_PERCENT,
  DEFAULT_EXCESS_VALUE_PERCENT,
  DEFAULT_LIFETIME_YEARS,
  DEFAULT_LOSSES_PERCENT,
  DEFAULT_PANEL_AREA_M2,
  DEFAULT_PANEL_WATTS,
  DEFAULT_PRICE_INCREASE_PERCENT,
  DEFAULT_SHARE_PERCENT,
  DEFAULT_SUN_HOURS,
  calculateSolar,
  type ProduceSizeMode,
  type SolarMode,
  type SolarSuccess,
  type UsePeriod,
} from "@/lib/utils/solar";

const homeTheme = CATEGORY_THEME[getCategoryTheme("home-energy")];

const MODES: {
  id: SolarMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "size",
    label: "Size my system",
    shortLabel: "From electricity use to kW and panels",
  },
  {
    id: "produce",
    label: "What will my system produce",
    shortLabel: "From kW or panels to yearly kWh",
  },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatKwh(n: number): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function formatKw(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatYears(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Solar panel sizing and production estimates.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function SolarPanelCalculator() {
  const [mode, setMode] = useState<SolarMode>("size");
  const [useRaw, setUseRaw] = useState("");
  const [usePeriod, setUsePeriod] = useState<UsePeriod>("year");
  const [sunRaw, setSunRaw] = useState(String(DEFAULT_SUN_HOURS));
  const [lossesRaw, setLossesRaw] = useState(String(DEFAULT_LOSSES_PERCENT));
  const [shareRaw, setShareRaw] = useState(String(DEFAULT_SHARE_PERCENT));
  const [panelWattsRaw, setPanelWattsRaw] = useState(
    String(DEFAULT_PANEL_WATTS),
  );
  const [panelAreaRaw, setPanelAreaRaw] = useState(
    String(DEFAULT_PANEL_AREA_M2),
  );
  const [priceRaw, setPriceRaw] = useState("");
  const [costPerWattRaw, setCostPerWattRaw] = useState("");
  const [excessValueRaw, setExcessValueRaw] = useState(
    String(DEFAULT_EXCESS_VALUE_PERCENT),
  );
  const [degradationRaw, setDegradationRaw] = useState(
    String(DEFAULT_DEGRADATION_PERCENT),
  );
  const [priceIncreaseRaw, setPriceIncreaseRaw] = useState(
    String(DEFAULT_PRICE_INCREASE_PERCENT),
  );
  const [lifetimeRaw, setLifetimeRaw] = useState(
    String(DEFAULT_LIFETIME_YEARS),
  );
  const [currencyId, setCurrencyId] = useState("USD");
  const [produceSizeMode, setProduceSizeMode] =
    useState<ProduceSizeMode>("kw");
  const [systemKwRaw, setSystemKwRaw] = useState("");
  const [producePanelsRaw, setProducePanelsRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const money = (value: number) => formatMoney(value, currencyId);

  const selectMode = useCallback((next: SolarMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("size");
    setUseRaw("");
    setUsePeriod("year");
    setSunRaw(String(DEFAULT_SUN_HOURS));
    setLossesRaw(String(DEFAULT_LOSSES_PERCENT));
    setShareRaw(String(DEFAULT_SHARE_PERCENT));
    setPanelWattsRaw(String(DEFAULT_PANEL_WATTS));
    setPanelAreaRaw(String(DEFAULT_PANEL_AREA_M2));
    setPriceRaw("");
    setCostPerWattRaw("");
    setExcessValueRaw(String(DEFAULT_EXCESS_VALUE_PERCENT));
    setDegradationRaw(String(DEFAULT_DEGRADATION_PERCENT));
    setPriceIncreaseRaw(String(DEFAULT_PRICE_INCREASE_PERCENT));
    setLifetimeRaw(String(DEFAULT_LIFETIME_YEARS));
    setCurrencyId("USD");
    setProduceSizeMode("kw");
    setSystemKwRaw("");
    setProducePanelsRaw("");
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
    mode === "size"
      ? calculateSolar({
          mode: "size",
          useKwh: parseOptionalNumber(useRaw),
          usePeriod,
          sunHours: parseOptionalNumber(sunRaw),
          lossesPercent: parseOptionalNumber(lossesRaw),
          sharePercent: parseOptionalNumber(shareRaw),
          panelWatts: parseOptionalNumber(panelWattsRaw),
          panelAreaM2: parseOptionalNumber(panelAreaRaw),
          pricePerKwh: parseOptionalNumber(priceRaw),
          costPerWatt: parseOptionalNumber(costPerWattRaw),
          excessValuePercent: parseOptionalNumber(excessValueRaw),
          degradationPercent: parseOptionalNumber(degradationRaw),
          priceIncreasePercent: parseOptionalNumber(priceIncreaseRaw),
          lifetimeYears: parseOptionalNumber(lifetimeRaw),
        })
      : calculateSolar({
          mode: "produce",
          sizeMode: produceSizeMode,
          systemKw: parseOptionalNumber(systemKwRaw),
          panelCount: parseOptionalNumber(producePanelsRaw),
          panelWatts: parseOptionalNumber(panelWattsRaw),
          sunHours: parseOptionalNumber(sunRaw),
          lossesPercent: parseOptionalNumber(lossesRaw),
          pricePerKwh: parseOptionalNumber(priceRaw),
        });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="solar-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="solar-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Sun className={`size-5 ${homeTheme.text}`} aria-hidden="true" />
              Solar inputs
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
            Results are estimates from the numbers you enter. Real systems
            depend on roof direction and tilt, shading, equipment, installation
            quality, weather, and local electricity rules and prices. A
            qualified installer must size and install a system — electrical
            safety matters.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Solar calculator modes"
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
            {mode === "size" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-use`}
                    label="Electricity use (kWh)"
                    value={useRaw}
                    onChange={setUseRaw}
                  />
                  <UnitToggle
                    label="Use period"
                    value={usePeriod}
                    options={[
                      { id: "month", label: "Per month" },
                      { id: "year", label: "Per year" },
                    ]}
                    onChange={setUsePeriod}
                  />
                </div>
                <NumberField
                  id={`${uid}-share`}
                  label="Share of use to cover (%)"
                  value={shareRaw}
                  onChange={setShareRaw}
                  suffix="%"
                />
              </>
            ) : (
              <>
                <UnitToggle
                  label="System size input"
                  value={produceSizeMode}
                  options={[
                    { id: "kw", label: "kW" },
                    { id: "panels", label: "Panels" },
                  ]}
                  onChange={setProduceSizeMode}
                />
                {produceSizeMode === "kw" ? (
                  <NumberField
                    id={`${uid}-kw`}
                    label="System size (kW)"
                    value={systemKwRaw}
                    onChange={setSystemKwRaw}
                  />
                ) : (
                  <NumberField
                    id={`${uid}-panels`}
                    label="Number of panels"
                    value={producePanelsRaw}
                    onChange={setProducePanelsRaw}
                  />
                )}
              </>
            )}

            <NumberField
              id={`${uid}-sun`}
              label="Peak sun hours per day"
              value={sunRaw}
              onChange={setSunRaw}
              hint="Equivalent full-sun hours; varies by location and season, so enter a figure for your area. Default 5 is an example only."
            />
            <NumberField
              id={`${uid}-losses`}
              label="System losses (%)"
              value={lossesRaw}
              onChange={setLossesRaw}
              suffix="%"
            />
            <NumberField
              id={`${uid}-watts`}
              label="Panel wattage (W)"
              value={panelWattsRaw}
              onChange={setPanelWattsRaw}
            />

            {mode === "size" ? (
              <NumberField
                id={`${uid}-area`}
                label="Panel area (m², optional)"
                value={panelAreaRaw}
                onChange={setPanelAreaRaw}
                hint="Used only for rough roof-area estimate"
              />
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-price`}
                label="Electricity price per kWh (optional)"
                value={priceRaw}
                onChange={setPriceRaw}
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${uid}-currency`}
                  className="text-[12px] font-semibold text-muted"
                >
                  Currency (display only)
                </label>
                <select
                  id={`${uid}-currency`}
                  value={currencyId}
                  onChange={(event) => setCurrencyId(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:ring-2 focus:ring-cat-home/20"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {mode === "size" ? (
              <>
                <NumberField
                  id={`${uid}-costw`}
                  label="Installed cost per watt (optional)"
                  value={costPerWattRaw}
                  onChange={setCostPerWattRaw}
                />
                <NumberField
                  id={`${uid}-excess`}
                  label="Value of excess generation (% of price)"
                  value={excessValueRaw}
                  onChange={setExcessValueRaw}
                  suffix="%"
                  hint="Some places credit exported energy and others do not; rules change. Default 0 credits none of the excess."
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-deg`}
                    label="Yearly panel degradation (%)"
                    value={degradationRaw}
                    onChange={setDegradationRaw}
                    suffix="%"
                  />
                  <NumberField
                    id={`${uid}-infl`}
                    label="Yearly electricity price increase (%)"
                    value={priceIncreaseRaw}
                    onChange={setPriceIncreaseRaw}
                    suffix="%"
                  />
                </div>
                <NumberField
                  id={`${uid}-life`}
                  label="Lifetime view (years)"
                  value={lifetimeRaw}
                  onChange={setLifetimeRaw}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="solar-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="solar-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "size" ? "System size" : "Production"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : (
            <SolarResults
              result={result}
              money={money}
              mode={mode}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function SolarResults({
  result,
  money,
  mode,
}: {
  result: SolarSuccess;
  money: (value: number) => string;
  mode: SolarMode;
}) {
  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-semibold text-muted">
          {mode === "size" ? "Estimated system" : "System size"}
        </p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-5xl">
          {formatKw(result.installedKw)}{" "}
          <span className="text-2xl font-bold sm:text-3xl">kW</span>
        </p>
        <p className="mt-2 text-[15px] text-muted">
          {result.panelCount.toLocaleString("en-US")} panels ×{" "}
          {result.panelWatts.toLocaleString("en-US")} W
          {result.neededKw !== null
            ? ` (needed ${formatKw(result.neededKw)} kW before rounding up)`
            : null}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat
          label="Annual production"
          value={`${formatKwh(result.annualProductionKwh)} kWh`}
        />
        <Stat
          label="Monthly average"
          value={`${formatKwh(result.monthlyAvgProductionKwh)} kWh`}
        />
        {result.systemCost !== null ? (
          <Stat label="Estimated installed cost" value={money(result.systemCost)} />
        ) : null}
        {result.year1Savings !== null ? (
          <Stat label="Year-1 savings" value={money(result.year1Savings)} />
        ) : null}
        {result.simplePaybackYears !== null ? (
          <Stat
            label="Simple payback"
            value={`${formatYears(result.simplePaybackYears)} years`}
          />
        ) : null}
        {result.roofAreaM2 !== null ? (
          <Stat
            label="Approx. roof area"
            value={`${result.roofAreaM2.toLocaleString("en-US", { maximumFractionDigits: 1 })} m²`}
          />
        ) : null}
        {result.usedOnSiteKwh !== null ? (
          <Stat
            label="Used on site / excess"
            value={`${formatKwh(result.usedOnSiteKwh)} / ${formatKwh(result.excessKwh ?? 0)} kWh`}
          />
        ) : null}
        {result.lifetimeSavings !== null ? (
          <Stat
            label={`Lifetime savings (${result.lifetimeYears} yr)`}
            value={money(result.lifetimeSavings)}
          />
        ) : null}
        {result.lifetimeNet !== null ? (
          <Stat label="Lifetime net of cost" value={money(result.lifetimeNet)} />
        ) : null}
        {result.paybackYearInterpolated !== null ? (
          <Stat
            label="Payback year (lifetime view)"
            value={`${formatYears(result.paybackYearInterpolated)} years`}
          />
        ) : null}
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

      {result.yearRows.length > 0 && result.year1Savings !== null ? (
        <>
          <SavingsChart
            rows={result.yearRows}
            systemCost={result.systemCost}
            money={money}
          />
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              Year-by-year savings
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-[13px]">
                <caption className="sr-only">
                  Yearly solar savings and cumulative totals
                </caption>
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3">
                      Year
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right tabular-nums">
                      Savings
                    </th>
                    <th scope="col" className="py-2 text-right tabular-nums">
                      Cumulative
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearRows.map((row) => (
                    <tr
                      key={row.year}
                      className="border-b border-border/60 text-foreground"
                    >
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left font-medium tabular-nums"
                      >
                        {row.year}
                      </th>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {money(row.savings)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {money(row.cumulativeSavings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-[18px] font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SavingsChart({
  rows,
  systemCost,
  money,
}: {
  rows: SolarSuccess["yearRows"];
  systemCost: number | null;
  money: (value: number) => string;
}) {
  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxY = Math.max(
    ...rows.map((r) => r.cumulativeSavings),
    systemCost ?? 0,
    1,
  );
  const maxX = rows.length;

  function xAt(year: number) {
    return pad.left + ((year - 1) / Math.max(1, maxX - 1)) * innerW;
  }
  function yAt(value: number) {
    return pad.top + innerH - (value / maxY) * innerH;
  }

  const savingsPath = rows
    .map((row, index) => {
      const x = xAt(row.year);
      const y = yAt(row.cumulativeSavings);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const costY = systemCost !== null ? yAt(systemCost) : null;
  const last = rows[rows.length - 1]!;

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-foreground">
        Cumulative savings vs cost
      </h3>
      <p className="mt-1 text-[12px] text-muted">
        Solid line: cumulative savings. Dashed line: installed cost
        {systemCost !== null ? ` (${money(systemCost)})` : ""}. End of horizon:{" "}
        {money(last.cumulativeSavings)}.
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 w-full max-w-xl"
        role="img"
        aria-label={`Chart of cumulative savings over ${rows.length} years${systemCost !== null ? ` against installed cost of ${money(systemCost)}` : ""}. Final cumulative savings ${money(last.cumulativeSavings)}.`}
      >
        <title>Cumulative savings versus system cost</title>
        {/* Axes */}
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + innerH}
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-400"
        />
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-400"
        />
        {costY !== null ? (
          <line
            x1={pad.left}
            y1={costY}
            x2={pad.left + innerW}
            y2={costY}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="text-zinc-700"
          />
        ) : null}
        <path
          d={savingsPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-950"
        />
        {/* Markers every 5 years */}
        {rows
          .filter((r) => r.year === 1 || r.year % 5 === 0 || r.year === maxX)
          .map((row) => (
            <g key={row.year}>
              <circle
                cx={xAt(row.year)}
                cy={yAt(row.cumulativeSavings)}
                r="3"
                className="fill-zinc-950"
              />
              <text
                x={xAt(row.year)}
                y={pad.top + innerH + 16}
                textAnchor="middle"
                className="fill-zinc-600 text-[10px]"
              >
                Y{row.year}
              </text>
            </g>
          ))}
        <text
          x={pad.left - 8}
          y={pad.top + 4}
          textAnchor="end"
          className="fill-zinc-600 text-[10px]"
        >
          {money(maxY)}
        </text>
        {costY !== null ? (
          <text
            x={pad.left + innerW}
            y={costY - 6}
            textAnchor="end"
            className="fill-zinc-700 text-[10px]"
          >
            Cost
          </text>
        ) : null}
        <text
          x={pad.left + 8}
          y={pad.top + 14}
          className="fill-zinc-950 text-[10px] font-semibold"
        >
          Savings (solid)
        </text>
      </svg>
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
