"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Briefcase, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  calculateFreelanceRate,
  roundMoney,
  type ExpensePeriod,
  type FreelanceMode,
} from "@/lib/utils/freelance-rate";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const MODES: {
  id: FreelanceMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "find-rate",
    label: "Find my rate",
    shortLabel: "From a take-home income goal",
  },
  {
    id: "take-home",
    label: "What will I take home",
    shortLabel: "From an hourly rate you already use",
  },
];

/**
 * Freelance hourly rate calculator — find a rate from a take-home goal, or
 * estimate take-home from a rate. Inputs stay in component state only.
 */
export function FreelanceRateCalculator() {
  const [mode, setMode] = useState<FreelanceMode>("find-rate");
  const [takeHomeRaw, setTakeHomeRaw] = useState("");
  const [hourlyRaw, setHourlyRaw] = useState("");
  const [expensesRaw, setExpensesRaw] = useState("");
  const [expensePeriod, setExpensePeriod] = useState<ExpensePeriod>("yearly");
  const [taxRaw, setTaxRaw] = useState("");
  const [weeksOffRaw, setWeeksOffRaw] = useState("6");
  const [hoursRaw, setHoursRaw] = useState("25");
  const [feeRaw, setFeeRaw] = useState("0");
  const [bufferRaw, setBufferRaw] = useState("0");
  const [projectHoursRaw, setProjectHoursRaw] = useState("");
  const [revisionRaw, setRevisionRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");

  const tablistId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const result = calculateFreelanceRate({
    mode,
    takeHome: parseDecimal(takeHomeRaw),
    hourlyRate: parseDecimal(hourlyRaw),
    expenses: parseDecimal(expensesRaw),
    expensePeriod,
    taxRatePercent: parseDecimal(taxRaw),
    weeksOff: parseDecimal(weeksOffRaw),
    billableHoursPerWeek: parseDecimal(hoursRaw),
    platformFeePercent: feeRaw.trim() === "" ? 0 : parseDecimal(feeRaw),
    bufferPercent: bufferRaw.trim() === "" ? 0 : parseDecimal(bufferRaw),
    projectHours:
      projectHoursRaw.trim() === "" ? null : parseDecimal(projectHoursRaw),
    revisionBufferPercent:
      revisionRaw.trim() === "" ? null : parseDecimal(revisionRaw),
  });

  const money = (value: number) => formatMoney(roundMoney(value), currencyId);

  const selectMode = useCallback((next: FreelanceMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("find-rate");
    setTakeHomeRaw("");
    setHourlyRaw("");
    setExpensesRaw("");
    setExpensePeriod("yearly");
    setTaxRaw("");
    setWeeksOffRaw("6");
    setHoursRaw("25");
    setFeeRaw("0");
    setBufferRaw("0");
    setProjectHoursRaw("");
    setRevisionRaw("");
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

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="freelance-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="freelance-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Briefcase
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Freelance rate
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
            General information only — not financial, tax or business advice.
            This shows a minimum rate for your income goal; market rates, client
            budgets, experience and demand also matter. Tax rates and rules vary
            by country — enter a rate that covers income tax and any
            self-employment contributions for your situation.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Freelance calculator modes"
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
                      ? `${financeTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-finance-soft hover:text-cat-finance"
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
            {mode === "find-rate" ? (
              <NumberField
                id="fr-takehome"
                label="Desired annual take-home income (after tax)"
                value={takeHomeRaw}
                onChange={setTakeHomeRaw}
              />
            ) : (
              <NumberField
                id="fr-hourly"
                label="Hourly rate"
                value={hourlyRaw}
                onChange={setHourlyRaw}
              />
            )}

            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
              <NumberField
                id="fr-expenses"
                label={
                  expensePeriod === "monthly"
                    ? "Monthly business expenses"
                    : "Annual business expenses"
                }
                value={expensesRaw}
                onChange={setExpensesRaw}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Expense period
                </span>
                <div
                  role="radiogroup"
                  aria-label="Expense period"
                  className="grid h-11 grid-cols-2 gap-1.5"
                >
                  {(
                    [
                      { id: "yearly" as const, label: "Yearly" },
                      { id: "monthly" as const, label: "Monthly" },
                    ] as const
                  ).map((option) => {
                    const selected = expensePeriod === option.id;
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
                          name="expense-period"
                          value={option.id}
                          checked={selected}
                          onChange={() => setExpensePeriod(option.id)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="-mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              Software, equipment, internet, workspace
            </p>

            <NumberField
              id="fr-tax"
              label="Estimated tax rate on profit (%)"
              value={taxRaw}
              onChange={setTaxRaw}
              hint="Covers income tax and any self-employment contributions you expect"
              suffix="%"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id="fr-weeks"
                label="Weeks off per year"
                value={weeksOffRaw}
                onChange={setWeeksOffRaw}
                hint="Vacation, holidays, sick days"
              />
              <NumberField
                id="fr-hours"
                label="Billable hours per week"
                value={hoursRaw}
                onChange={setHoursRaw}
                hint="Hours you can actually invoice"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id="fr-fee"
                label="Marketplace or platform fee (%)"
                value={feeRaw}
                onChange={setFeeRaw}
                hint="Share of each sale a marketplace keeps (optional)"
                suffix="%"
              />
              {mode === "find-rate" ? (
                <NumberField
                  id="fr-buffer"
                  label="Profit buffer (%)"
                  value={bufferRaw}
                  onChange={setBufferRaw}
                  hint="Extra revenue for slow months and savings (optional)"
                  suffix="%"
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="fr-currency"
                    className="text-[12px] font-semibold text-muted"
                  >
                    Currency (display only)
                  </label>
                  <select
                    id="fr-currency"
                    value={currencyId}
                    onChange={(e) => setCurrencyId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-zinc-400 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {mode === "find-rate" ? (
              <>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="fr-currency-find"
                    className="text-[12px] font-semibold text-muted"
                  >
                    Currency (display only)
                  </label>
                  <select
                    id="fr-currency-find"
                    value={currencyId}
                    onChange={(e) => setCurrencyId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-zinc-400 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <fieldset className="m-0 min-w-0 rounded-lg border border-border/60 p-3">
                  <legend className="px-1 text-[12px] font-semibold text-zinc-600">
                    Project quote helper (optional)
                  </legend>
                  <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumberField
                      id="fr-project-hours"
                      label="Project hours"
                      value={projectHoursRaw}
                      onChange={setProjectHoursRaw}
                    />
                    <NumberField
                      id="fr-revision"
                      label="Revision buffer (%)"
                      value={revisionRaw}
                      onChange={setRevisionRaw}
                      suffix="%"
                    />
                  </div>
                </fieldset>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="freelance-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="freelance-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
            </span>
            <span className="text-[12px] text-muted">
              {MODES.find((m) => m.id === mode)?.label}
            </span>
          </div>

          {!result.ok ? (
            <p
              className={
                result.error === "empty"
                  ? "text-[15px] text-muted"
                  : "rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[15px] leading-relaxed text-amber-950"
              }
            >
              {result.message}
            </p>
          ) : result.mode === "find-rate" ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-zinc-600">
                  Hourly rate
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {money(result.hourlyRate)}
                  <span className="ml-1 text-lg font-semibold text-zinc-500">
                    / hour
                  </span>
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="Annual revenue target"
                  value={money(result.annualRevenue)}
                />
                <Stat
                  label="Monthly revenue target"
                  value={money(result.monthlyRevenue)}
                />
                <Stat
                  label="Weekly revenue"
                  value={money(result.weeklyRevenue)}
                />
                <Stat
                  label="Billable hours per year"
                  value={result.billableHours.toLocaleString("en-US")}
                />
              </dl>
              {result.projectQuote !== null ? (
                <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[14px] text-zinc-700">
                  Suggested project price:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(result.projectQuote)}
                  </span>
                </p>
              ) : null}
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${financeTheme.borderSoft} ${financeTheme.soft} ${financeTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Worked step
                </span>
                {result.working}
              </p>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-zinc-600">
                  {result.isLoss ? "Estimated result" : "Estimated take-home"}
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {money(result.takeHome)}
                  <span className="ml-1 text-lg font-semibold text-zinc-500">
                    / year
                  </span>
                </p>
              </div>
              {result.isLoss ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[14px] leading-relaxed text-amber-950">
                  Costs and fees exceed revenue in this scenario, so the result
                  is a loss and tax on profit is shown as zero.
                </p>
              ) : null}
              <dl className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="Annual revenue"
                  value={money(result.annualRevenue)}
                />
                <Stat label="Profit" value={money(result.profit)} />
                <Stat
                  label="Tax on profit"
                  value={money(result.taxOnProfit)}
                />
                <Stat
                  label="Billable hours per year"
                  value={result.billableHours.toLocaleString("en-US")}
                />
              </dl>
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${financeTheme.borderSoft} ${financeTheme.soft} ${financeTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Worked step
                </span>
                {result.working}
              </p>
            </div>
          )}

          <p className="text-[12px] leading-relaxed text-zinc-600">
            This is general information and an estimate only — not financial,
            tax or business advice.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
      <dt className="text-[11px] font-semibold text-zinc-600">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
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
          className={`h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20 ${suffix ? "pr-9" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] font-medium text-muted">
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
