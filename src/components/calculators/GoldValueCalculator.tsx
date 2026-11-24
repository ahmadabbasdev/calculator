"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Gem, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  MAKING_MODES,
  PRICE_UNITS,
  STANDARD_KARATS,
  TAX_BASES,
  WEIGHT_UNITS,
  calculateGoldValue,
  roundMoney,
  type GoldMode,
  type GoldPriceUnit,
  type GoldPurityMode,
  type GoldWeightUnit,
  type MakingChargeMode,
  type TaxBase,
} from "@/lib/utils/gold-value";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const MODES: {
  id: GoldMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "jewellery",
    label: "Jewellery price",
    shortLabel: "Weight, karat, making charges and tax",
  },
  {
    id: "old-gold",
    label: "Value of old gold",
    shortLabel: "Estimate from weight, purity and your price",
  },
];

/**
 * Gold jewellery / old-gold value from the user's 24K price.
 * Inputs stay in React state only — no live quotes.
 */
export function GoldValueCalculator() {
  const [mode, setMode] = useState<GoldMode>("jewellery");
  const [weightRaw, setWeightRaw] = useState("");
  const [weightUnit, setWeightUnit] = useState<GoldWeightUnit>("gram");
  const [stoneRaw, setStoneRaw] = useState("");
  const [purityMode, setPurityMode] = useState<GoldPurityMode>("karat");
  const [karat, setKarat] = useState<number>(22);
  const [customPurityRaw, setCustomPurityRaw] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [priceUnit, setPriceUnit] = useState<GoldPriceUnit>("per_gram");
  const [makingMode, setMakingMode] = useState<MakingChargeMode>("none");
  const [makingRaw, setMakingRaw] = useState("");
  const [wastageRaw, setWastageRaw] = useState("0");
  const [taxRaw, setTaxRaw] = useState("0");
  const [taxBase, setTaxBase] = useState<TaxBase>("gold_wastage_making");
  const [dealerRaw, setDealerRaw] = useState("0");
  const [currencyId, setCurrencyId] = useState("USD");

  const tablistId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const result = calculateGoldValue({
    mode,
    weight: parseDecimal(weightRaw),
    weightUnit,
    stoneWeightGrams:
      stoneRaw.trim() === "" ? null : parseDecimal(stoneRaw),
    purityMode,
    karat: purityMode === "karat" ? karat : null,
    customPurityPercent:
      purityMode === "custom" ? parseDecimal(customPurityRaw) : null,
    price24k: parseDecimal(priceRaw),
    priceUnit,
    makingMode,
    makingValue:
      makingMode === "none"
        ? null
        : makingRaw.trim() === ""
          ? null
          : parseDecimal(makingRaw),
    wastagePercent: wastageRaw.trim() === "" ? 0 : parseDecimal(wastageRaw),
    taxPercent: taxRaw.trim() === "" ? 0 : parseDecimal(taxRaw),
    taxBase,
    dealerDeductionPercent:
      dealerRaw.trim() === "" ? 0 : parseDecimal(dealerRaw),
  });

  const money = (value: number) => formatMoney(roundMoney(value), currencyId);

  const selectMode = useCallback((next: GoldMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("jewellery");
    setWeightRaw("");
    setWeightUnit("gram");
    setStoneRaw("");
    setPurityMode("karat");
    setKarat(22);
    setCustomPurityRaw("");
    setPriceRaw("");
    setPriceUnit("per_gram");
    setMakingMode("none");
    setMakingRaw("");
    setWastageRaw("0");
    setTaxRaw("0");
    setTaxBase("gold_wastage_making");
    setDealerRaw("0");
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

  const makingHint =
    makingMode === "percent_of_gold"
      ? "Percent of gold value"
      : makingMode === "per_gram"
        ? "Amount per gram of net gold weight"
        : makingMode === "fixed_total"
          ? "Fixed making charge total"
          : undefined;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="gold-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="gold-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Gem
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Gold value
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
            Arithmetic from the 24K price you enter — not a live quote, price
            history or prediction. Jewellers&apos; pricing and hallmark purity
            vary. This does not calculate zakat.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Gold calculator modes"
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
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
              <NumberField
                id="gv-weight"
                label="Weight"
                value={weightRaw}
                onChange={setWeightRaw}
              />
              <SelectField
                id="gv-weight-unit"
                label="Weight unit"
                value={weightUnit}
                onChange={(v) => setWeightUnit(v as GoldWeightUnit)}
                options={WEIGHT_UNITS.map((u) => ({
                  value: u.id,
                  label: u.label,
                }))}
              />
            </div>

            {mode === "jewellery" ? (
              <NumberField
                id="gv-stone"
                label="Stone or other weight to deduct (grams, optional)"
                value={stoneRaw}
                onChange={setStoneRaw}
                hint="Cannot exceed gross weight"
              />
            ) : null}

            <fieldset className="m-0 min-w-0 rounded-lg border border-border/60 p-3">
              <legend className="px-1 text-[12px] font-semibold text-zinc-600">
                Purity
              </legend>
              <div
                role="radiogroup"
                aria-label="Purity mode"
                className="mt-1 grid grid-cols-2 gap-1.5"
              >
                {(
                  [
                    { id: "karat" as const, label: "Karat" },
                    { id: "custom" as const, label: "Custom %" },
                  ] as const
                ).map((option) => {
                  const selected = purityMode === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-center text-[12px] font-semibold transition ${
                        selected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-border/80 bg-background text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="purity-mode"
                        value={option.id}
                        checked={selected}
                        onChange={() => setPurityMode(option.id)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {purityMode === "karat" ? (
                <div className="mt-3 flex flex-col gap-1">
                  <label
                    htmlFor="gv-karat"
                    className="text-[12px] font-semibold text-muted"
                  >
                    Karat
                  </label>
                  <select
                    id="gv-karat"
                    value={karat}
                    onChange={(e) => setKarat(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-zinc-400 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                  >
                    {STANDARD_KARATS.map((k) => (
                      <option key={k} value={k}>
                        {k}K ({((k / 24) * 100).toFixed(k === 24 ? 0 : 2)}%
                        purity)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-3">
                  <NumberField
                    id="gv-custom-purity"
                    label="Custom purity (%)"
                    value={customPurityRaw}
                    onChange={setCustomPurityRaw}
                    suffix="%"
                  />
                </div>
              )}
            </fieldset>

            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
              <NumberField
                id="gv-price"
                label="Your 24K gold price"
                value={priceRaw}
                onChange={setPriceRaw}
                hint="Never prefilled — enter the rate you want to use"
              />
              <SelectField
                id="gv-price-unit"
                label="Price unit"
                value={priceUnit}
                onChange={(v) => setPriceUnit(v as GoldPriceUnit)}
                options={PRICE_UNITS.map((u) => ({
                  value: u.id,
                  label: u.label,
                }))}
              />
            </div>

            {mode === "jewellery" ? (
              <>
                <SelectField
                  id="gv-making-mode"
                  label="Making charges"
                  value={makingMode}
                  onChange={(v) => setMakingMode(v as MakingChargeMode)}
                  options={MAKING_MODES.map((m) => ({
                    value: m.id,
                    label: m.label,
                  }))}
                />
                {makingMode !== "none" ? (
                  <NumberField
                    id="gv-making"
                    label={
                      makingMode === "percent_of_gold"
                        ? "Making charges (%)"
                        : makingMode === "per_gram"
                          ? "Making charges per gram"
                          : "Making charges (fixed total)"
                    }
                    value={makingRaw}
                    onChange={setMakingRaw}
                    hint={makingHint}
                    suffix={makingMode === "percent_of_gold" ? "%" : undefined}
                  />
                ) : null}

                <NumberField
                  id="gv-wastage"
                  label="Wastage (% of gold value)"
                  value={wastageRaw}
                  onChange={setWastageRaw}
                  suffix="%"
                />

                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                  <NumberField
                    id="gv-tax"
                    label="Tax (%)"
                    value={taxRaw}
                    onChange={setTaxRaw}
                    suffix="%"
                  />
                  <SelectField
                    id="gv-tax-base"
                    label="Tax base"
                    value={taxBase}
                    onChange={(v) => setTaxBase(v as TaxBase)}
                    options={TAX_BASES.map((t) => ({
                      value: t.id,
                      label: t.label,
                    }))}
                  />
                </div>
              </>
            ) : (
              <NumberField
                id="gv-dealer"
                label="Dealer deduction (%, optional)"
                value={dealerRaw}
                onChange={setDealerRaw}
                hint="Applied to the estimated gold value"
                suffix="%"
              />
            )}

            <SelectField
              id="gv-currency"
              label="Currency (display only)"
              value={currencyId}
              onChange={setCurrencyId}
              options={CURRENCY_OPTIONS.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="gold-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="gold-outcome-heading"
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
          ) : result.mode === "jewellery" ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-zinc-600">
                  Total price
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {money(result.totalPrice)}
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="Net weight"
                  value={`${formatGrams(result.netWeightGrams)} g`}
                />
                <Stat
                  label="Pure gold"
                  value={`${formatGrams(result.pureGoldGrams)} g`}
                />
                <Stat label="Gold value" value={money(result.goldValue)} />
                <Stat label="Wastage" value={money(result.wastageAmount)} />
                <Stat
                  label="Making charges"
                  value={money(result.makingCharges)}
                />
                <Stat label="Tax" value={money(result.taxAmount)} />
                <Stat
                  label="Effective price per gram"
                  value={money(result.effectivePerGram)}
                />
                <Stat
                  label="Purity used"
                  value={`${formatGrams(result.purityPercent)}%`}
                />
              </dl>
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${financeTheme.borderSoft} ${financeTheme.soft} ${financeTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Working
                </span>
                {result.working}
              </p>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-zinc-600">
                  Estimated value
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {money(result.estimatedValue)}
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="Weight"
                  value={`${formatGrams(result.netWeightGrams)} g`}
                />
                <Stat
                  label="Pure gold"
                  value={`${formatGrams(result.pureGoldGrams)} g`}
                />
                <Stat label="Gross value" value={money(result.grossValue)} />
                <Stat
                  label="Dealer deduction"
                  value={money(result.dealerDeductionAmount)}
                />
              </dl>
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${financeTheme.borderSoft} ${financeTheme.soft} ${financeTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Working
                </span>
                {result.working}
              </p>
            </div>
          )}

          <p className="text-[12px] leading-relaxed text-zinc-600">
            General arithmetic only — not buying or selling advice. Real prices
            depend on the seller. This page does not calculate zakat.
          </p>
        </div>
      </section>
    </div>
  );
}

function formatGrams(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-zinc-400 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
