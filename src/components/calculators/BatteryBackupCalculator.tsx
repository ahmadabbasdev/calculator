"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Battery, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  DEFAULT_EFFICIENCY_PERCENT,
  DEFAULT_HEALTH_PERCENT,
  DEFAULT_POWER_FACTOR,
  DEFAULT_SERIES,
  DEFAULT_STRINGS,
  DEFAULT_USABLE_PERCENT,
  LEAD_ACID_USABLE_PERCENT,
  LITHIUM_USABLE_PERCENT,
  MAX_APPLIANCE_ROWS,
  calculateBatteryBackup,
  convertVaWatts,
  formatRuntimeLabel,
  type BatteryMode,
  type LoadInputMode,
} from "@/lib/utils/battery-backup";

const homeTheme = CATEGORY_THEME[getCategoryTheme("home-energy")];

const MODES: {
  id: BatteryMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "runtime",
    label: "How long will it last",
    shortLabel: "Runtime from battery pack and load",
  },
  {
    id: "needed",
    label: "What battery do I need",
    shortLabel: "Pack size for a target backup time",
  },
];

type ApplianceDraft = {
  id: string;
  label: string;
  watts: string;
  quantity: string;
};

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatWh(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatHours(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

let applianceSeq = 0;

function newApplianceRow(stableId?: string): ApplianceDraft {
  applianceSeq += 1;
  return {
    id: stableId ?? `appliance-${applianceSeq}`,
    label: "",
    watts: "",
    quantity: "1",
  };
}

/**
 * Battery / UPS / inverter backup time and pack sizing.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function BatteryBackupCalculator() {
  const [mode, setMode] = useState<BatteryMode>("runtime");
  const [batteryVoltageRaw, setBatteryVoltageRaw] = useState("12");
  const [batteryAhRaw, setBatteryAhRaw] = useState("");
  const [seriesRaw, setSeriesRaw] = useState(String(DEFAULT_SERIES));
  const [stringsRaw, setStringsRaw] = useState(String(DEFAULT_STRINGS));
  const [usableRaw, setUsableRaw] = useState(String(DEFAULT_USABLE_PERCENT));
  const [healthRaw, setHealthRaw] = useState(String(DEFAULT_HEALTH_PERCENT));
  const [efficiencyRaw, setEfficiencyRaw] = useState(
    String(DEFAULT_EFFICIENCY_PERCENT),
  );
  const [loadMode, setLoadMode] = useState<LoadInputMode>("watts");
  const [loadWattsRaw, setLoadWattsRaw] = useState("");
  const [appliances, setAppliances] = useState<ApplianceDraft[]>(() => [
    newApplianceRow("appliance-initial"),
  ]);
  const [backupHoursRaw, setBackupHoursRaw] = useState("");
  const [systemVoltageRaw, setSystemVoltageRaw] = useState("24");
  const [inverterRatingRaw, setInverterRatingRaw] = useState("");
  const [vaRaw, setVaRaw] = useState("");
  const [vaWattsRaw, setVaWattsRaw] = useState("");
  const [powerFactorRaw, setPowerFactorRaw] = useState(
    String(DEFAULT_POWER_FACTOR),
  );
  const [vaDirection, setVaDirection] = useState<"va-to-w" | "w-to-va">(
    "va-to-w",
  );

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: BatteryMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("runtime");
    setBatteryVoltageRaw("12");
    setBatteryAhRaw("");
    setSeriesRaw(String(DEFAULT_SERIES));
    setStringsRaw(String(DEFAULT_STRINGS));
    setUsableRaw(String(DEFAULT_USABLE_PERCENT));
    setHealthRaw(String(DEFAULT_HEALTH_PERCENT));
    setEfficiencyRaw(String(DEFAULT_EFFICIENCY_PERCENT));
    setLoadMode("watts");
    setLoadWattsRaw("");
    setAppliances([newApplianceRow("appliance-initial")]);
    setBackupHoursRaw("");
    setSystemVoltageRaw("24");
    setInverterRatingRaw("");
    setVaRaw("");
    setVaWattsRaw("");
    setPowerFactorRaw(String(DEFAULT_POWER_FACTOR));
    setVaDirection("va-to-w");
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

  function updateAppliance(
    id: string,
    patch: Partial<Omit<ApplianceDraft, "id">>,
  ) {
    setAppliances((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addAppliance() {
    setAppliances((rows) =>
      rows.length >= MAX_APPLIANCE_ROWS ? rows : [...rows, newApplianceRow()],
    );
  }

  function removeAppliance(id: string) {
    setAppliances((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row.id !== id),
    );
  }

  const applianceInput = appliances.map((row) => ({
    label: row.label,
    watts: parseOptionalNumber(row.watts),
    quantity: parseOptionalNumber(row.quantity),
  }));

  const result =
    mode === "runtime"
      ? calculateBatteryBackup({
          mode: "runtime",
          batteryVoltage: parseOptionalNumber(batteryVoltageRaw),
          batteryAh: parseOptionalNumber(batteryAhRaw),
          series: parseOptionalNumber(seriesRaw),
          strings: parseOptionalNumber(stringsRaw),
          usablePercent: parseOptionalNumber(usableRaw),
          healthPercent: parseOptionalNumber(healthRaw),
          efficiencyPercent: parseOptionalNumber(efficiencyRaw),
          loadWatts: parseOptionalNumber(loadWattsRaw),
          appliances: applianceInput,
          loadMode,
          inverterRatingWatts: parseOptionalNumber(inverterRatingRaw),
        })
      : calculateBatteryBackup({
          mode: "needed",
          loadWatts: parseOptionalNumber(loadWattsRaw),
          appliances: applianceInput,
          loadMode,
          backupHours: parseOptionalNumber(backupHoursRaw),
          systemVoltage: parseOptionalNumber(systemVoltageRaw),
          batteryVoltage: parseOptionalNumber(batteryVoltageRaw),
          batteryAh: parseOptionalNumber(batteryAhRaw),
          usablePercent: parseOptionalNumber(usableRaw),
          healthPercent: parseOptionalNumber(healthRaw),
          efficiencyPercent: parseOptionalNumber(efficiencyRaw),
          inverterRatingWatts: parseOptionalNumber(inverterRatingRaw),
        });

  const vaResult = convertVaWatts({
    direction: vaDirection,
    va: parseOptionalNumber(vaRaw),
    watts: parseOptionalNumber(vaWattsRaw),
    powerFactor: parseOptionalNumber(powerFactorRaw),
  });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="battery-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="battery-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Battery
                className={`size-5 ${homeTheme.text}`}
                aria-hidden="true"
              />
              Battery inputs
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
            Results are planning estimates. Real runtime depends on battery age,
            temperature, discharge rate, chemistry, cut-off settings and the
            unit&apos;s own power draw. Manufacturers&apos; discharge tables are
            the reference. A qualified electrician should install and check
            systems; batteries need ventilation and proper protection. Follow
            the manufacturer&apos;s limits. Motors and compressors can need much
            more power at startup — that surge is not modelled here.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Battery backup calculator modes"
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
            {mode === "needed" ? (
              <>
                <NumberField
                  id={`${uid}-hours`}
                  label="Wanted backup time (hours)"
                  value={backupHoursRaw}
                  onChange={setBackupHoursRaw}
                />
                <NumberField
                  id={`${uid}-sysv`}
                  label="System voltage (V)"
                  value={systemVoltageRaw}
                  onChange={setSystemVoltageRaw}
                  hint="Must divide evenly by the battery voltage (series count)."
                />
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-bv`}
                label="Battery voltage (V)"
                value={batteryVoltageRaw}
                onChange={setBatteryVoltageRaw}
              />
              <NumberField
                id={`${uid}-ah`}
                label="Battery capacity (Ah)"
                value={batteryAhRaw}
                onChange={setBatteryAhRaw}
              />
            </div>

            {mode === "runtime" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  id={`${uid}-series`}
                  label="Batteries in series"
                  value={seriesRaw}
                  onChange={setSeriesRaw}
                  hint="Series adds voltage (same Ah)."
                />
                <NumberField
                  id={`${uid}-strings`}
                  label="Strings in parallel"
                  value={stringsRaw}
                  onChange={setStringsRaw}
                  hint="Parallel adds Ah (same voltage)."
                />
              </div>
            ) : null}

            <NumberField
              id={`${uid}-usable`}
              label="Usable share of the battery (%)"
              value={usableRaw}
              onChange={setUsableRaw}
              suffix="%"
              hint="Planning assumption only — check the battery datasheet. Lead-acid systems commonly plan around 50%; many lithium packs around 80%."
            />
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Usable share presets"
            >
              <PresetButton
                label={`Lead-acid (commonly about ${LEAD_ACID_USABLE_PERCENT}%)`}
                onClick={() => setUsableRaw(String(LEAD_ACID_USABLE_PERCENT))}
              />
              <PresetButton
                label={`Lithium (commonly about ${LITHIUM_USABLE_PERCENT}%)`}
                onClick={() => setUsableRaw(String(LITHIUM_USABLE_PERCENT))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-health`}
                label="Remaining battery health (%)"
                value={healthRaw}
                onChange={setHealthRaw}
                suffix="%"
              />
              <NumberField
                id={`${uid}-eff`}
                label="Inverter or UPS efficiency (%)"
                value={efficiencyRaw}
                onChange={setEfficiencyRaw}
                suffix="%"
              />
            </div>

            <UnitToggle
              label="Load input"
              value={loadMode}
              options={[
                { id: "watts", label: "Total watts" },
                { id: "appliances", label: "Appliance list" },
              ]}
              onChange={setLoadMode}
            />

            {loadMode === "watts" ? (
              <NumberField
                id={`${uid}-load`}
                label="Load (watts)"
                value={loadWattsRaw}
                onChange={setLoadWattsRaw}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-muted">
                  Appliances (up to {MAX_APPLIANCE_ROWS})
                </span>
                <ul className="flex flex-col gap-2">
                  {appliances.map((row, index) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-panel/80 p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_auto]"
                    >
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`${uid}-app-label-${row.id}`}
                          className="text-[11px] font-semibold text-muted"
                        >
                          Label {index + 1}
                        </label>
                        <input
                          id={`${uid}-app-label-${row.id}`}
                          type="text"
                          value={row.label}
                          onChange={(event) =>
                            updateAppliance(row.id, {
                              label: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:ring-2 focus:ring-cat-home/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`${uid}-app-w-${row.id}`}
                          className="text-[11px] font-semibold text-muted"
                        >
                          Watts
                        </label>
                        <input
                          id={`${uid}-app-w-${row.id}`}
                          type="text"
                          inputMode="decimal"
                          value={row.watts}
                          onChange={(event) =>
                            updateAppliance(row.id, {
                              watts: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:ring-2 focus:ring-cat-home/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`${uid}-app-q-${row.id}`}
                          className="text-[11px] font-semibold text-muted"
                        >
                          Quantity
                        </label>
                        <input
                          id={`${uid}-app-q-${row.id}`}
                          type="text"
                          inputMode="numeric"
                          value={row.quantity}
                          onChange={(event) =>
                            updateAppliance(row.id, {
                              quantity: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:ring-2 focus:ring-cat-home/20"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAppliance(row.id)}
                          disabled={appliances.length <= 1}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 text-zinc-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove appliance row ${index + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addAppliance}
                  disabled={appliances.length >= MAX_APPLIANCE_ROWS}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition hover:border-cat-home/40 hover:bg-cat-home-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add appliance
                </button>
              </div>
            )}

            <NumberField
              id={`${uid}-inv`}
              label="Inverter or UPS rating (watts, optional)"
              value={inverterRatingRaw}
              onChange={setInverterRatingRaw}
              hint="If the load is above this rating, a calm warning appears. Startup surges are not modelled."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              UPS rating to watts
            </h3>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              VA × power factor = watts (and the reverse). The power factor
              field is editable; 0.7 is only an example, not a claim about your
              equipment.
            </p>
            <UnitToggle
              label="Conversion direction"
              value={vaDirection}
              options={[
                { id: "va-to-w", label: "VA → watts" },
                { id: "w-to-va", label: "Watts → VA" },
              ]}
              onChange={setVaDirection}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {vaDirection === "va-to-w" ? (
                <NumberField
                  id={`${uid}-va`}
                  label="VA rating"
                  value={vaRaw}
                  onChange={setVaRaw}
                />
              ) : (
                <NumberField
                  id={`${uid}-vaw`}
                  label="Watts"
                  value={vaWattsRaw}
                  onChange={setVaWattsRaw}
                />
              )}
              <NumberField
                id={`${uid}-pf`}
                label="Power factor (example)"
                value={powerFactorRaw}
                onChange={setPowerFactorRaw}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Result
                </span>
                <p className="flex h-11 items-center rounded-lg border border-border/80 bg-panel px-3 text-[15px] tabular-nums text-foreground">
                  {vaResult.ok
                    ? vaDirection === "va-to-w"
                      ? `${formatWh(vaResult.watts)} W`
                      : `${formatWh(vaResult.va)} VA`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="battery-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="battery-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "runtime" ? "Estimated runtime" : "Battery pack needed"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : result.mode === "runtime" ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Estimated backup time
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatRuntimeLabel(result.runtimeHours)}
                </p>
                <p className="mt-1 text-[15px] tabular-nums text-zinc-600">
                  {formatHours(result.runtimeHours)} hours
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Usable energy"
                  value={`${formatWh(result.usableWh)} Wh`}
                />
                <Stat
                  label="Pack"
                  value={`${formatWh(result.packVoltage)} V · ${formatWh(result.packAh)} Ah`}
                />
                <Stat
                  label="Nominal energy"
                  value={`${formatWh(result.nominalWh)} Wh`}
                />
                <Stat
                  label="Load"
                  value={`${formatWh(result.loadWatts)} W`}
                />
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
                  Batteries for this plan
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {result.totalBatteries}
                </p>
                <p className="mt-1 text-[15px] text-zinc-600">
                  {result.series} in series × {result.strings} parallel string
                  {result.strings === 1 ? "" : "s"}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Required energy"
                  value={`${formatWh(result.requiredWh)} Wh`}
                />
                <Stat
                  label="Required pack Ah"
                  value={`${formatWh(result.requiredPackAh)} Ah`}
                />
                <Stat
                  label="Actual usable energy"
                  value={`${formatWh(result.actualUsableWh)} Wh`}
                />
                <Stat
                  label="Actual runtime"
                  value={`${formatRuntimeLabel(result.actualRuntimeHours)} (${formatHours(result.actualRuntimeHours)} h)`}
                />
              </dl>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          )}

          {result.ok && result.inverterWarning ? (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-950"
            >
              The load is above the inverter or UPS rating you entered. The
              unit may shut down or limit output before the battery is empty.
              Startup surges for motors and compressors are not included in this
              estimate.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-[16px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:border-cat-home/40 hover:bg-cat-home-soft"
    >
      {label}
    </button>
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
