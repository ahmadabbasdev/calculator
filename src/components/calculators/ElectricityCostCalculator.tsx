"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { CURRENCY_OPTIONS, formatMoney } from "@/lib/utils/money";
import {
  DEFAULT_BILL_ROW_LABELS,
  DEFAULT_DAYS_PER_MONTH,
  DEFAULT_DUTY_PERCENT,
  DEFAULT_QUANTITY,
  MAX_BILL_APPLIANCES,
  calculateElectricity,
  type ElectricityMode,
  type PowerInputMode,
  type TierMethod,
} from "@/lib/utils/electricity";

const homeTheme = CATEGORY_THEME[getCategoryTheme("home-energy")];

const MODES: {
  id: ElectricityMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "appliance",
    label: "One appliance",
    shortLabel: "Watts or amps × volts to kWh and cost",
  },
  {
    id: "bill",
    label: "Several appliances and my bill",
    shortLabel: "List devices, shares, and optional tiers",
  },
];

type BillRowDraft = {
  id: string;
  label: string;
  watts: string;
  quantity: string;
  hoursPerDay: string;
  daysPerMonth: string;
  dutyPercent: string;
};

type TierDraft = {
  id: string;
  upToUnits: string;
  pricePerUnit: string;
  openEnded: boolean;
};

let rowSeq = 0;

function nextId(prefix: string): string {
  rowSeq += 1;
  return `${prefix}-${rowSeq}`;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatKwh(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function formatPct(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function emptyBillRows(): BillRowDraft[] {
  return DEFAULT_BILL_ROW_LABELS.map((label, index) => ({
    id: `bill-row-initial-${index}`,
    label,
    watts: "",
    quantity: String(DEFAULT_QUANTITY),
    hoursPerDay: "",
    daysPerMonth: String(DEFAULT_DAYS_PER_MONTH),
    dutyPercent: String(DEFAULT_DUTY_PERCENT),
  }));
}

function emptyTierRows(): TierDraft[] {
  return [
    {
      id: "tier-initial-0",
      upToUnits: "",
      pricePerUnit: "",
      openEnded: false,
    },
    {
      id: "tier-initial-1",
      upToUnits: "",
      pricePerUnit: "",
      openEnded: true,
    },
  ];
}

/**
 * Electricity cost from watts/hours or a multi-appliance bill with optional tiers.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function ElectricityCostCalculator() {
  const [mode, setMode] = useState<ElectricityMode>("appliance");
  const [powerMode, setPowerMode] = useState<PowerInputMode>("watts");
  const [wattsRaw, setWattsRaw] = useState("");
  const [ampsRaw, setAmpsRaw] = useState("");
  const [voltsRaw, setVoltsRaw] = useState("");
  const [hoursRaw, setHoursRaw] = useState("");
  const [daysRaw, setDaysRaw] = useState(String(DEFAULT_DAYS_PER_MONTH));
  const [quantityRaw, setQuantityRaw] = useState(String(DEFAULT_QUANTITY));
  const [dutyRaw, setDutyRaw] = useState(String(DEFAULT_DUTY_PERCENT));
  const [standbyWattsRaw, setStandbyWattsRaw] = useState("");
  const [standbyHoursRaw, setStandbyHoursRaw] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");
  const [billRows, setBillRows] = useState<BillRowDraft[]>(emptyBillRows);
  const [billPriceRaw, setBillPriceRaw] = useState("");
  const [showTiers, setShowTiers] = useState(false);
  const [tiers, setTiers] = useState<TierDraft[]>(emptyTierRows);
  const [tierMethod, setTierMethod] = useState<TierMethod>("incremental");
  const [fixedChargeRaw, setFixedChargeRaw] = useState("");
  const [taxRaw, setTaxRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const money = (value: number) => formatMoney(value, currencyId);

  const selectMode = useCallback((next: ElectricityMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("appliance");
    setPowerMode("watts");
    setWattsRaw("");
    setAmpsRaw("");
    setVoltsRaw("");
    setHoursRaw("");
    setDaysRaw(String(DEFAULT_DAYS_PER_MONTH));
    setQuantityRaw(String(DEFAULT_QUANTITY));
    setDutyRaw(String(DEFAULT_DUTY_PERCENT));
    setStandbyWattsRaw("");
    setStandbyHoursRaw("");
    setPriceRaw("");
    setCurrencyId("USD");
    setBillRows(emptyBillRows());
    setBillPriceRaw("");
    setShowTiers(false);
    setTiers(emptyTierRows());
    setTierMethod("incremental");
    setFixedChargeRaw("");
    setTaxRaw("");
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

  function updateBillRow(
    id: string,
    patch: Partial<Omit<BillRowDraft, "id">>,
  ) {
    setBillRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addBillRow() {
    setBillRows((rows) =>
      rows.length >= MAX_BILL_APPLIANCES
        ? rows
        : [
            ...rows,
            {
              id: nextId("bill-row"),
              label: "",
              watts: "",
              quantity: String(DEFAULT_QUANTITY),
              hoursPerDay: "",
              daysPerMonth: String(DEFAULT_DAYS_PER_MONTH),
              dutyPercent: String(DEFAULT_DUTY_PERCENT),
            },
          ],
    );
  }

  function removeBillRow(id: string) {
    setBillRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row.id !== id),
    );
  }

  function updateTier(
    id: string,
    patch: Partial<Omit<TierDraft, "id">>,
  ) {
    setTiers((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addTier() {
    setTiers((rows) => {
      const closed = rows.map((row) => ({ ...row, openEnded: false }));
      return [
        ...closed,
        {
          id: nextId("tier"),
          upToUnits: "",
          pricePerUnit: "",
          openEnded: true,
        },
      ];
    });
  }

  function removeTier(id: string) {
    setTiers((rows) => {
      if (rows.length <= 1) return rows;
      const next = rows.filter((row) => row.id !== id);
      return next.map((row, index) => ({
        ...row,
        openEnded: index === next.length - 1,
      }));
    });
  }

  const result =
    mode === "appliance"
      ? calculateElectricity({
          mode: "appliance",
          powerMode,
          watts: parseOptionalNumber(wattsRaw),
          amps: parseOptionalNumber(ampsRaw),
          volts: parseOptionalNumber(voltsRaw),
          hoursPerDay: parseOptionalNumber(hoursRaw),
          daysPerMonth: parseOptionalNumber(daysRaw),
          quantity: parseOptionalNumber(quantityRaw),
          dutyPercent: parseOptionalNumber(dutyRaw),
          standbyWatts: parseOptionalNumber(standbyWattsRaw),
          standbyHoursPerDay: parseOptionalNumber(standbyHoursRaw),
          pricePerKwh: parseOptionalNumber(priceRaw),
        })
      : calculateElectricity({
          mode: "bill",
          appliances: billRows.map((row) => ({
            label: row.label,
            watts: parseOptionalNumber(row.watts),
            quantity: parseOptionalNumber(row.quantity),
            hoursPerDay: parseOptionalNumber(row.hoursPerDay),
            daysPerMonth: parseOptionalNumber(row.daysPerMonth),
            dutyPercent: parseOptionalNumber(row.dutyPercent),
          })),
          pricePerKwh: parseOptionalNumber(billPriceRaw),
          useTiers: showTiers,
          tiers: tiers.map((tier) => ({
            upToUnits: tier.openEnded
              ? null
              : parseOptionalNumber(tier.upToUnits),
            pricePerUnit: parseOptionalNumber(tier.pricePerUnit),
          })),
          tierMethod,
          fixedCharge: parseOptionalNumber(fixedChargeRaw),
          taxPercent: parseOptionalNumber(taxRaw),
        });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="electricity-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="electricity-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Zap className={`size-5 ${homeTheme.text}`} aria-hidden="true" />
              Electricity inputs
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
            This calculator estimates only the figures you enter. Real bills may
            include other charges, taxes, demand or seasonal rules. Device labels
            often show maximum power; many devices draw less at different
            moments. Enter the price per kWh (units) from your bill — bills
            differ between countries and utilities.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Electricity cost calculator modes"
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
            {mode === "appliance" ? (
              <>
                <UnitToggle
                  label="Power input"
                  value={powerMode}
                  options={[
                    { id: "watts", label: "Watts" },
                    { id: "amps-volts", label: "Amps × volts" },
                  ]}
                  onChange={setPowerMode}
                />
                {powerMode === "watts" ? (
                  <NumberField
                    id={`${uid}-watts`}
                    label="Power (watts)"
                    value={wattsRaw}
                    onChange={setWattsRaw}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumberField
                      id={`${uid}-amps`}
                      label="Amps"
                      value={ampsRaw}
                      onChange={setAmpsRaw}
                    />
                    <NumberField
                      id={`${uid}-volts`}
                      label="Volts"
                      value={voltsRaw}
                      onChange={setVoltsRaw}
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-hours`}
                    label="Hours per day"
                    value={hoursRaw}
                    onChange={setHoursRaw}
                  />
                  <NumberField
                    id={`${uid}-days`}
                    label="Days per month"
                    value={daysRaw}
                    onChange={setDaysRaw}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-qty`}
                    label="Quantity"
                    value={quantityRaw}
                    onChange={setQuantityRaw}
                  />
                  <NumberField
                    id={`${uid}-duty`}
                    label="% of time drawing full power"
                    value={dutyRaw}
                    onChange={setDutyRaw}
                    suffix="%"
                    hint="For devices that cycle, such as fridges or air conditioners."
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-sbw`}
                    label="Standby watts (optional)"
                    value={standbyWattsRaw}
                    onChange={setStandbyWattsRaw}
                  />
                  <NumberField
                    id={`${uid}-sbh`}
                    label="Standby hours per day"
                    value={standbyHoursRaw}
                    onChange={setStandbyHoursRaw}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NumberField
                    id={`${uid}-price`}
                    label="Price per kWh (units)"
                    value={priceRaw}
                    onChange={setPriceRaw}
                  />
                  <CurrencySelect
                    id={`${uid}-currency`}
                    value={currencyId}
                    onChange={setCurrencyId}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-muted">
                    Appliances (up to {MAX_BILL_APPLIANCES})
                  </span>
                  <button
                    type="button"
                    onClick={() => setBillRows(emptyBillRows())}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-stone-100"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    Reset list
                  </button>
                </div>
                <ul className="flex flex-col gap-3">
                  {billRows.map((row, index) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-panel/80 p-3"
                    >
                      <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <NumberField
                            id={`${uid}-blabel-${row.id}`}
                            label={`Label ${index + 1}`}
                            value={row.label}
                            onChange={(value) =>
                              updateBillRow(row.id, { label: value })
                            }
                            inputMode="text"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBillRow(row.id)}
                          disabled={billRows.length <= 1}
                          className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 text-zinc-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove appliance row ${index + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <NumberField
                          id={`${uid}-bw-${row.id}`}
                          label="Watts"
                          value={row.watts}
                          onChange={(value) =>
                            updateBillRow(row.id, { watts: value })
                          }
                        />
                        <NumberField
                          id={`${uid}-bq-${row.id}`}
                          label="Quantity"
                          value={row.quantity}
                          onChange={(value) =>
                            updateBillRow(row.id, { quantity: value })
                          }
                        />
                        <NumberField
                          id={`${uid}-bh-${row.id}`}
                          label="Hours/day"
                          value={row.hoursPerDay}
                          onChange={(value) =>
                            updateBillRow(row.id, { hoursPerDay: value })
                          }
                        />
                        <NumberField
                          id={`${uid}-bd-${row.id}`}
                          label="Days/month"
                          value={row.daysPerMonth}
                          onChange={(value) =>
                            updateBillRow(row.id, { daysPerMonth: value })
                          }
                        />
                        <NumberField
                          id={`${uid}-bduty-${row.id}`}
                          label="% of time"
                          value={row.dutyPercent}
                          onChange={(value) =>
                            updateBillRow(row.id, { dutyPercent: value })
                          }
                          suffix="%"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addBillRow}
                  disabled={billRows.length >= MAX_BILL_APPLIANCES}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition hover:border-cat-home/40 hover:bg-cat-home-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add appliance
                </button>

                {!showTiers ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumberField
                      id={`${uid}-bprice`}
                      label="Price per kWh (units)"
                      value={billPriceRaw}
                      onChange={setBillPriceRaw}
                    />
                    <CurrencySelect
                      id={`${uid}-bcurrency`}
                      value={currencyId}
                      onChange={setCurrencyId}
                    />
                  </div>
                ) : (
                  <CurrencySelect
                    id={`${uid}-bcurrency`}
                    value={currencyId}
                    onChange={setCurrencyId}
                  />
                )}

                <details
                  className="rounded-lg border border-border/70 bg-panel/60 p-3"
                  open={showTiers}
                  onToggle={(event) =>
                    setShowTiers((event.target as HTMLDetailsElement).open)
                  }
                >
                  <summary className="cursor-pointer text-[13px] font-semibold text-foreground">
                    My bill is not a flat rate
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-[12px] leading-relaxed text-zinc-600">
                      Bills differ between countries and utilities. Enter what
                      your bill says. A tier boundary is inclusive (“up to 100”
                      includes 100). The last tier is open-ended.
                    </p>
                    <UnitToggle
                      label="Tier method"
                      value={tierMethod}
                      options={[
                        {
                          id: "incremental",
                          label: "Incremental",
                        },
                        { id: "whole", label: "Whole bill" },
                      ]}
                      onChange={setTierMethod}
                    />
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Incremental: each tier&apos;s price applies only to units
                      inside that tier. Whole bill: the price of the tier your
                      total falls in applies to all units.
                    </p>
                    <ul className="flex flex-col gap-2">
                      {tiers.map((tier, index) => (
                        <li
                          key={tier.id}
                          className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-background/80 p-3 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          {tier.openEnded ? (
                            <p className="flex h-11 items-center text-[13px] text-zinc-600">
                              Above previous tier (open-ended)
                            </p>
                          ) : (
                            <NumberField
                              id={`${uid}-tup-${tier.id}`}
                              label={`Up to (kWh / units) — tier ${index + 1}`}
                              value={tier.upToUnits}
                              onChange={(value) =>
                                updateTier(tier.id, { upToUnits: value })
                              }
                            />
                          )}
                          <NumberField
                            id={`${uid}-tprice-${tier.id}`}
                            label="Price per unit"
                            value={tier.pricePerUnit}
                            onChange={(value) =>
                              updateTier(tier.id, { pricePerUnit: value })
                            }
                          />
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeTier(tier.id)}
                              disabled={tiers.length <= 1}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 text-zinc-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Remove billing tier ${index + 1}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={addTier}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition hover:bg-cat-home-soft"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add tier
                    </button>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NumberField
                        id={`${uid}-fixed`}
                        label="Fixed monthly charge"
                        value={fixedChargeRaw}
                        onChange={setFixedChargeRaw}
                      />
                      <NumberField
                        id={`${uid}-tax`}
                        label="Tax or surcharge (%)"
                        value={taxRaw}
                        onChange={setTaxRaw}
                        suffix="%"
                        hint="Applied to energy charge plus fixed charge."
                      />
                    </div>
                  </div>
                </details>

                {!showTiers ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumberField
                      id={`${uid}-fixed2`}
                      label="Fixed monthly charge (optional)"
                      value={fixedChargeRaw}
                      onChange={setFixedChargeRaw}
                    />
                    <NumberField
                      id={`${uid}-tax2`}
                      label="Tax or surcharge (%)"
                      value={taxRaw}
                      onChange={setTaxRaw}
                      suffix="%"
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="electricity-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="electricity-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "appliance" ? "Use and cost" : "Bill estimate"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : result.mode === "appliance" ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Energy per month
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatKwh(result.kwhPerMonth)}{" "}
                  <span className="text-2xl font-semibold sm:text-3xl">
                    kWh
                  </span>
                </p>
                <p className="mt-1 text-[15px] tabular-nums text-zinc-600">
                  {formatKwh(result.kwhPerDay)} kWh/day ·{" "}
                  {formatKwh(result.kwhPerYear)} kWh/year
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat label="Resolved power" value={`${formatKwh(result.watts)} W`} />
                {result.costPerHour !== null ? (
                  <Stat label="Cost per hour" value={money(result.costPerHour)} />
                ) : null}
                {result.costPerDay !== null ? (
                  <Stat label="Cost per day" value={money(result.costPerDay)} />
                ) : null}
                {result.costPerMonth !== null ? (
                  <Stat
                    label="Cost per month"
                    value={money(result.costPerMonth)}
                  />
                ) : null}
                {result.costPerYear !== null ? (
                  <Stat label="Cost per year" value={money(result.costPerYear)} />
                ) : null}
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
                  Monthly energy
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatKwh(result.totalKwhPerMonth)}{" "}
                  <span className="text-2xl font-semibold sm:text-3xl">
                    kWh
                  </span>
                </p>
                {result.totalBill !== null ? (
                  <p className="mt-2 text-[18px] font-semibold tabular-nums text-foreground">
                    Estimated bill: {money(result.totalBill)}
                  </p>
                ) : null}
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.energyCharge !== null ? (
                  <Stat
                    label="Energy charge"
                    value={money(result.energyCharge)}
                  />
                ) : null}
                <Stat
                  label="Fixed charge"
                  value={money(result.fixedCharge)}
                />
                <Stat label="Tax / surcharge" value={money(result.taxAmount)} />
              </dl>

              {result.shares.length > 0 ? (
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Share of monthly kWh
                  </h3>
                  <p className="sr-only">
                    Bar chart of each appliance&apos;s share of total monthly
                    kilowatt-hours. Shares sum to{" "}
                    {formatPct(
                      result.shares.reduce((s, row) => s + row.sharePercent, 0),
                    )}
                    %.
                  </p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {result.shares.map((row) => (
                      <li key={`${row.label}-${row.kwhPerMonth}`}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="font-medium text-foreground">
                            {row.label}
                          </span>
                          <span className="tabular-nums text-zinc-600">
                            {formatKwh(row.kwhPerMonth)} kWh ·{" "}
                            {formatPct(row.sharePercent)}%
                          </span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-stone-200"
                          role="img"
                          aria-label={`${row.label}: ${formatPct(row.sharePercent)} percent of monthly energy`}
                        >
                          <div
                            className={`h-full rounded-full ${homeTheme.solid}`}
                            style={{
                              width: `${Math.min(100, Math.max(0, row.sharePercent))}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
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

function CurrencySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        Currency (display only)
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:ring-2 focus:ring-cat-home/20"
      >
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
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
  inputMode = "decimal",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric" | "text";
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
          inputMode={inputMode === "text" ? undefined : inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-home/40 focus:border-cat-home focus:bg-panel focus:ring-2 focus:ring-cat-home/20 ${inputMode === "text" ? "" : "tabular-nums"} ${suffix ? "pr-10" : ""}`}
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
