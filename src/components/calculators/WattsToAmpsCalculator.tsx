"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Activity, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  DEFAULT_POWER_FACTOR,
  calculateElectrical,
  type CircuitType,
  type ElectricalTab,
  type KvaKwDirection,
  type WattsAmpsDirection,
} from "@/lib/utils/electrical";

const homeTheme = CATEGORY_THEME[getCategoryTheme("home-energy")];

const TABS: {
  id: ElectricalTab;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "watts-amps",
    label: "Watts and amps",
    shortLabel: "Convert power and current",
  },
  {
    id: "kva-kw",
    label: "kVA and kW",
    shortLabel: "Apparent and real power",
  },
  {
    id: "ohms",
    label: "Ohm's law",
    shortLabel: "Resistive V, I, R, P",
  },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatDisplay(n: number, digits = 4): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Watts ↔ amps, kVA ↔ kW, and Ohm's law.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function WattsToAmpsCalculator() {
  const [tab, setTab] = useState<ElectricalTab>("watts-amps");
  const [direction, setDirection] =
    useState<WattsAmpsDirection>("watts-to-amps");
  const [circuit, setCircuit] = useState<CircuitType>("single");
  const [voltageRaw, setVoltageRaw] = useState("");
  const [wattsRaw, setWattsRaw] = useState("");
  const [ampsRaw, setAmpsRaw] = useState("");
  const [pfRaw, setPfRaw] = useState(String(DEFAULT_POWER_FACTOR.toFixed(2)));

  const [kvaDirection, setKvaDirection] =
    useState<KvaKwDirection>("kva-to-kw");
  const [kvaCircuit, setKvaCircuit] = useState<CircuitType>("single");
  const [kvaRaw, setKvaRaw] = useState("");
  const [kwRaw, setKwRaw] = useState("");
  const [kvaAmpsRaw, setKvaAmpsRaw] = useState("");
  const [kvaVoltageRaw, setKvaVoltageRaw] = useState("");
  const [kvaPfRaw, setKvaPfRaw] = useState(
    String(DEFAULT_POWER_FACTOR.toFixed(2)),
  );

  const [ohmsVRaw, setOhmsVRaw] = useState("");
  const [ohmsIRaw, setOhmsIRaw] = useState("");
  const [ohmsRRaw, setOhmsRRaw] = useState("");
  const [ohmsPRaw, setOhmsPRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = useCallback((next: ElectricalTab) => {
    setTab(next);
  }, []);

  function handleReset() {
    setTab("watts-amps");
    setDirection("watts-to-amps");
    setCircuit("single");
    setVoltageRaw("");
    setWattsRaw("");
    setAmpsRaw("");
    setPfRaw(String(DEFAULT_POWER_FACTOR.toFixed(2)));
    setKvaDirection("kva-to-kw");
    setKvaCircuit("single");
    setKvaRaw("");
    setKwRaw("");
    setKvaAmpsRaw("");
    setKvaVoltageRaw("");
    setKvaPfRaw(String(DEFAULT_POWER_FACTOR.toFixed(2)));
    setOhmsVRaw("");
    setOhmsIRaw("");
    setOhmsRRaw("");
    setOhmsPRaw("");
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = TABS.length - 1;
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
    selectTab(TABS[nextIndex]!.id);
    tabRefs.current[nextIndex]?.focus();
  }

  const result =
    tab === "watts-amps"
      ? calculateElectrical({
          tab: "watts-amps",
          direction,
          circuit,
          voltage: parseOptionalNumber(voltageRaw),
          watts: parseOptionalNumber(wattsRaw),
          amps: parseOptionalNumber(ampsRaw),
          powerFactor: parseOptionalNumber(pfRaw),
        })
      : tab === "kva-kw"
        ? calculateElectrical({
            tab: "kva-kw",
            direction: kvaDirection,
            circuit: kvaCircuit,
            voltage: parseOptionalNumber(kvaVoltageRaw),
            kva: parseOptionalNumber(kvaRaw),
            kw: parseOptionalNumber(kwRaw),
            amps: parseOptionalNumber(kvaAmpsRaw),
            powerFactor: parseOptionalNumber(kvaPfRaw),
          })
        : calculateElectrical({
            tab: "ohms",
            voltage: parseOptionalNumber(ohmsVRaw),
            current: parseOptionalNumber(ohmsIRaw),
            resistance: parseOptionalNumber(ohmsRRaw),
            power: parseOptionalNumber(ohmsPRaw),
          });

  const needsPf =
    (tab === "watts-amps" && circuit !== "dc") ||
    (tab === "kva-kw" &&
      (kvaDirection === "kva-to-kw" ||
        kvaDirection === "kw-to-kva" ||
        kvaDirection === "kva-to-amps" ||
        kvaDirection === "amps-to-kva"));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="electrical-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="electrical-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Activity
                className={`size-5 ${homeTheme.text}`}
                aria-hidden="true"
              />
              Electrical inputs
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
            These results are calculated from the numbers you enter. Real
            appliances change what they draw over time, and startup current can
            be much higher than running current. Wiring, fuses and breakers must
            be chosen by a qualified electrician under your local rules.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Electrical calculator modes"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-3"
          >
            {TABS.map((item, index) => {
              const selected = tab === item.id;
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
                  onClick={() => selectTab(item.id)}
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
            aria-labelledby={`${tablistId}-${tab}`}
            className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {tab === "watts-amps" ? (
              <>
                <UnitToggle
                  label="Direction"
                  value={direction}
                  options={[
                    { id: "watts-to-amps", label: "Watts → amps" },
                    { id: "amps-to-watts", label: "Amps → watts" },
                  ]}
                  onChange={setDirection}
                />
                <UnitToggle
                  label="Circuit type"
                  value={circuit}
                  options={[
                    { id: "dc", label: "DC" },
                    { id: "single", label: "AC 1φ" },
                    { id: "three", label: "AC 3φ" },
                  ]}
                  onChange={setCircuit}
                  columns={3}
                />
                {circuit === "three" ? (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Three-phase uses line-to-line voltage.
                  </p>
                ) : null}
                <NumberField
                  id={`${uid}-v`}
                  label="Voltage (V)"
                  value={voltageRaw}
                  onChange={setVoltageRaw}
                />
                {direction === "watts-to-amps" ? (
                  <NumberField
                    id={`${uid}-w`}
                    label="Power (W)"
                    value={wattsRaw}
                    onChange={setWattsRaw}
                  />
                ) : (
                  <NumberField
                    id={`${uid}-a`}
                    label="Current (A)"
                    value={ampsRaw}
                    onChange={setAmpsRaw}
                  />
                )}
                {circuit !== "dc" ? (
                  <NumberField
                    id={`${uid}-pf`}
                    label="Power factor"
                    value={pfRaw}
                    onChange={setPfRaw}
                    hint="Motors and many electronics have a power factor below 1; check the label. Default 1.00 is for resistive loads."
                  />
                ) : null}
              </>
            ) : null}

            {tab === "kva-kw" ? (
              <>
                <UnitToggle
                  label="Conversion"
                  value={kvaDirection}
                  options={[
                    { id: "kva-to-kw", label: "kVA → kW" },
                    { id: "kw-to-kva", label: "kW → kVA" },
                    { id: "kva-to-amps", label: "kVA → A" },
                    { id: "amps-to-kva", label: "A → kVA" },
                  ]}
                  onChange={setKvaDirection}
                  columns={2}
                />
                {kvaDirection === "kva-to-amps" ||
                kvaDirection === "amps-to-kva" ? (
                  <>
                    <UnitToggle
                      label="AC circuit"
                      value={kvaCircuit === "dc" ? "single" : kvaCircuit}
                      options={[
                        { id: "single", label: "Single-phase" },
                        { id: "three", label: "Three-phase" },
                      ]}
                      onChange={(next) => setKvaCircuit(next)}
                    />
                    <NumberField
                      id={`${uid}-kv`}
                      label="Voltage (V)"
                      value={kvaVoltageRaw}
                      onChange={setKvaVoltageRaw}
                      hint={
                        kvaCircuit === "three"
                          ? "Line-to-line voltage"
                          : undefined
                      }
                    />
                  </>
                ) : null}
                {kvaDirection === "kva-to-kw" ||
                kvaDirection === "kva-to-amps" ? (
                  <NumberField
                    id={`${uid}-kva`}
                    label="Apparent power (kVA)"
                    value={kvaRaw}
                    onChange={setKvaRaw}
                  />
                ) : null}
                {kvaDirection === "kw-to-kva" ? (
                  <NumberField
                    id={`${uid}-kw`}
                    label="Real power (kW)"
                    value={kwRaw}
                    onChange={setKwRaw}
                  />
                ) : null}
                {kvaDirection === "amps-to-kva" ? (
                  <NumberField
                    id={`${uid}-ka`}
                    label="Current (A)"
                    value={kvaAmpsRaw}
                    onChange={setKvaAmpsRaw}
                  />
                ) : null}
                {needsPf ? (
                  <NumberField
                    id={`${uid}-kpf`}
                    label="Power factor"
                    value={kvaPfRaw}
                    onChange={setKvaPfRaw}
                    hint={
                      kvaDirection === "amps-to-kva" ||
                      kvaDirection === "kva-to-amps"
                        ? "Optional for amps ↔ kVA; enter PF to also show kW."
                        : "Must be above 0 and at most 1."
                    }
                  />
                ) : null}
              </>
            ) : null}

            {tab === "ohms" ? (
              <>
                <p className="text-[12px] leading-relaxed text-zinc-600">
                  Enter any two of voltage, current, resistance and power. This
                  solves resistive circuits only (V = I × R, P = V × I, P = I² ×
                  R, P = V² ÷ R).
                </p>
                <NumberField
                  id={`${uid}-ov`}
                  label="Voltage (V)"
                  value={ohmsVRaw}
                  onChange={setOhmsVRaw}
                />
                <NumberField
                  id={`${uid}-oi`}
                  label="Current (A)"
                  value={ohmsIRaw}
                  onChange={setOhmsIRaw}
                />
                <NumberField
                  id={`${uid}-or`}
                  label="Resistance (Ω)"
                  value={ohmsRRaw}
                  onChange={setOhmsRRaw}
                />
                <NumberField
                  id={`${uid}-op`}
                  label="Power (W)"
                  value={ohmsPRaw}
                  onChange={setOhmsPRaw}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="electrical-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="electrical-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            Result
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : result.tab === "watts-amps" ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-muted">
                  {result.direction === "watts-to-amps"
                    ? "Current"
                    : "Power"}
                </p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {result.direction === "watts-to-amps"
                    ? formatDisplay(result.amps, 4)
                    : formatDisplay(result.watts, 2)}{" "}
                  <span className="text-2xl font-bold sm:text-3xl">
                    {result.direction === "watts-to-amps" ? "A" : "W"}
                  </span>
                </p>
                <p className="mt-2 text-[14px] text-muted">
                  Formula: {result.formulaLabel}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Watts"
                  value={`${formatDisplay(result.watts, 2)} W`}
                />
                <Stat
                  label="Amps"
                  value={`${formatDisplay(result.amps, 4)} A`}
                />
                <Stat
                  label="Apparent power"
                  value={`${formatDisplay(result.apparentVa, 2)} VA (${formatDisplay(result.apparentKva, 4)} kVA)`}
                />
                {result.circuit !== "dc" ? (
                  <Stat
                    label="Power factor used"
                    value={formatDisplay(result.powerFactor, 2)}
                  />
                ) : null}
              </dl>
              <WorkingLine text={result.working} />
            </div>
          ) : result.tab === "kva-kw" ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-muted">
                  {result.direction === "kva-to-kw"
                    ? "Real power"
                    : result.direction === "kw-to-kva"
                      ? "Apparent power"
                      : result.direction === "kva-to-amps"
                        ? "Current"
                        : "Apparent power"}
                </p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {result.direction === "kva-to-kw"
                    ? formatDisplay(result.kw ?? 0, 4)
                    : result.direction === "kw-to-kva" ||
                        result.direction === "amps-to-kva"
                      ? formatDisplay(result.kva, 4)
                      : formatDisplay(result.amps ?? 0, 4)}{" "}
                  <span className="text-2xl font-bold sm:text-3xl">
                    {result.direction === "kva-to-kw"
                      ? "kW"
                      : result.direction === "kva-to-amps"
                        ? "A"
                        : "kVA"}
                  </span>
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="kVA"
                  value={`${formatDisplay(result.kva, 4)} kVA`}
                />
                {result.kw !== null ? (
                  <Stat
                    label="kW"
                    value={`${formatDisplay(result.kw, 4)} kW`}
                  />
                ) : null}
                {result.amps !== null ? (
                  <Stat
                    label="Amps"
                    value={`${formatDisplay(result.amps, 4)} A`}
                  />
                ) : null}
                <Stat
                  label="Apparent (VA)"
                  value={`${formatDisplay(result.apparentVa, 2)} VA`}
                />
              </dl>
              <WorkingLine text={result.working} />
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-muted">
                  Ohm&apos;s law (resistive)
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
                  {formatDisplay(result.voltage, 4)} V ·{" "}
                  {formatDisplay(result.current, 4)} A
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Voltage"
                  value={`${formatDisplay(result.voltage, 4)} V`}
                />
                <Stat
                  label="Current"
                  value={`${formatDisplay(result.current, 4)} A`}
                />
                <Stat
                  label="Resistance"
                  value={`${formatDisplay(result.resistance, 4)} Ω`}
                />
                <Stat
                  label="Power"
                  value={`${formatDisplay(result.power, 4)} W`}
                />
              </dl>
              <WorkingLine text={result.working} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WorkingLine({ text }: { text: string }) {
  return (
    <p
      className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${homeTheme.borderSoft} ${homeTheme.soft} ${homeTheme.text}`}
    >
      <span className="font-semibold">Worked step: </span>
      {text}
    </p>
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:bg-panel focus:ring-2 focus:ring-cat-home/20"
      />
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
  columns = 2,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid gap-1.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-[12px] font-semibold transition ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border/80 bg-background text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              <input
                type="radio"
                name={`${label}-${options.map((o) => o.id).join("-")}`}
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
