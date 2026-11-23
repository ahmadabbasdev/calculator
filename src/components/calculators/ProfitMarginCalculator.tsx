"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChartColumn, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  calculateProfitMargin,
  marginToMarkup,
  markupToMargin,
  type ProfitMarginMode,
} from "@/lib/utils/profit-margin";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const MODES: {
  id: ProfitMarginMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "from-cost-price",
    label: "From cost and price",
    shortLabel: "Profit, margin, markup",
  },
  {
    id: "price-from-margin",
    label: "Price from margin",
    shortLabel: "Cost + margin → price",
  },
  {
    id: "price-from-markup",
    label: "Price from markup",
    shortLabel: "Cost + markup → price",
  },
  {
    id: "cost-from-margin",
    label: "Cost from price and margin",
    shortLabel: "Price + margin → cost",
  },
];

function formatPercentDisplay(percent: number): string {
  return percent.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Profit margin and markup calculator — four modes, optional fees and units.
 * Inputs stay in component state only.
 */
export function ProfitMarginCalculator() {
  const [mode, setMode] = useState<ProfitMarginMode>("from-cost-price");
  const [costRaw, setCostRaw] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [marginRaw, setMarginRaw] = useState("");
  const [markupRaw, setMarkupRaw] = useState("");
  const [unitsRaw, setUnitsRaw] = useState("");
  const [feePercentRaw, setFeePercentRaw] = useState("");
  const [fixedFeeRaw, setFixedFeeRaw] = useState("");
  const [converterMarginRaw, setConverterMarginRaw] = useState("");
  const [converterMarkupRaw, setConverterMarkupRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");

  const tablistId = useId();
  const costId = useId();
  const priceId = useId();
  const marginId = useId();
  const markupId = useId();
  const unitsId = useId();
  const feePercentId = useId();
  const fixedFeeId = useId();
  const converterMarginId = useId();
  const converterMarkupId = useId();
  const currencyIdInput = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cost = parseDecimal(costRaw);
  const price = parseDecimal(priceRaw);
  const marginPercent = parseDecimal(marginRaw);
  const markupPercent = parseDecimal(markupRaw);
  const units = parseDecimal(unitsRaw);
  const feePercent = parseDecimal(feePercentRaw);
  const fixedFee = parseDecimal(fixedFeeRaw);

  const result = calculateProfitMargin({
    mode,
    cost:
      mode === "cost-from-margin"
        ? null
        : cost,
    price:
      mode === "price-from-margin" || mode === "price-from-markup"
        ? null
        : price,
    marginPercent:
      mode === "price-from-margin" || mode === "cost-from-margin"
        ? marginPercent
        : null,
    markupPercent: mode === "price-from-markup" ? markupPercent : null,
    units,
    feePercent,
    fixedFee,
  });

  const converterFromMargin = marginToMarkup(parseDecimal(converterMarginRaw));
  const converterFromMarkup = markupToMargin(parseDecimal(converterMarkupRaw));

  const money = (value: number) => formatMoney(value, currencyId);

  const selectMode = useCallback((next: ProfitMarginMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("from-cost-price");
    setCostRaw("");
    setPriceRaw("");
    setMarginRaw("");
    setMarkupRaw("");
    setUnitsRaw("");
    setFeePercentRaw("");
    setFixedFeeRaw("");
    setConverterMarginRaw("");
    setConverterMarkupRaw("");
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
    selectMode(MODES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const showCost =
    mode === "from-cost-price" ||
    mode === "price-from-margin" ||
    mode === "price-from-markup";
  const showPrice =
    mode === "from-cost-price" || mode === "cost-from-margin";
  const showMargin =
    mode === "price-from-margin" || mode === "cost-from-margin";
  const showMarkup = mode === "price-from-markup";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="margin-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="margin-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <ChartColumn
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Margin calculation
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

          <div
            id={tablistId}
            role="tablist"
            aria-label="Profit margin modes"
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
                  className={`rounded-lg px-2.5 py-2.5 text-left text-[12px] font-semibold transition sm:text-[13px] ${
                    selected
                      ? `${financeTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-finance-soft hover:text-cat-finance"
                  }`}
                >
                  <span className="block leading-snug">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] font-medium ${
                      selected ? "text-white/85" : "text-zinc-600"
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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={currencyIdInput}
                className="text-[12px] font-semibold text-muted"
              >
                Currency (display only)
              </label>
              <select
                id={currencyIdInput}
                value={currencyId}
                onChange={(event) => setCurrencyId(event.target.value)}
                className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
              >
                {CURRENCY_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {showCost ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={costId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Cost
                </label>
                <input
                  id={costId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={costRaw}
                  onChange={(event) => setCostRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            {showPrice ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={priceId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Selling price
                </label>
                <input
                  id={priceId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={priceRaw}
                  onChange={(event) => setPriceRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            {showMargin ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={marginId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Margin (%)
                </label>
                <input
                  id={marginId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={marginRaw}
                  onChange={(event) => setMarginRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            {showMarkup ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={markupId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Markup (%)
                </label>
                <input
                  id={markupId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={markupRaw}
                  onChange={(event) => setMarkupRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={unitsId}
                className="text-[12px] font-semibold text-muted"
              >
                Units sold (optional)
              </label>
              <input
                id={unitsId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={unitsRaw}
                onChange={(event) => setUnitsRaw(event.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={feePercentId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Marketplace or payment fee (%)
                </label>
                <input
                  id={feePercentId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={feePercentRaw}
                  onChange={(event) => setFeePercentRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={fixedFeeId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Fixed fee per sale
                </label>
                <input
                  id={fixedFeeId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={fixedFeeRaw}
                  onChange={(event) => setFixedFeeRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            </div>

            {mode === "price-from-margin" ? (
              <p className="text-[12px] leading-relaxed text-zinc-600">
                Price = cost ÷ (1 − margin). Adding the margin percent to cost
                gives a different number.
              </p>
            ) : null}

            {mode === "from-cost-price" ? (
              <p className="text-[12px] leading-relaxed text-zinc-600">
                Margin = profit ÷ price. Markup = profit ÷ cost. A loss is a
                valid result when price is below cost.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              Margin ↔ markup converter
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={converterMarginId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Margin (%)
                </label>
                <input
                  id={converterMarginId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={converterMarginRaw}
                  onChange={(event) =>
                    setConverterMarginRaw(event.target.value)
                  }
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
                {converterFromMargin.ok ? (
                  <p className="text-[12px] tabular-nums text-zinc-700">
                    Markup {formatPercentDisplay(converterFromMargin.markupPercent)}
                    %
                  </p>
                ) : converterFromMargin.error !== "empty" ? (
                  <p className="text-[12px] text-amber-900">
                    {converterFromMargin.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={converterMarkupId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Markup (%)
                </label>
                <input
                  id={converterMarkupId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={converterMarkupRaw}
                  onChange={(event) =>
                    setConverterMarkupRaw(event.target.value)
                  }
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
                {converterFromMarkup.ok ? (
                  <p className="text-[12px] tabular-nums text-zinc-700">
                    Margin {formatPercentDisplay(converterFromMarkup.marginPercent)}
                    %
                  </p>
                ) : converterFromMarkup.error !== "empty" ? (
                  <p className="text-[12px] text-amber-900">
                    {converterFromMarkup.message}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Markup = margin ÷ (1 − margin). Margin = markup ÷ (1 + markup).
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="margin-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="margin-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
            </span>
            <span className="text-[12px] text-muted">
              {MODES.find((item) => item.id === mode)?.label}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                {mode === "cost-from-margin"
                  ? money(result.cost)
                  : mode === "from-cost-price"
                    ? money(result.profit)
                    : money(result.price)}
              </p>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Cost
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.cost)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Price
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.price)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Profit
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.profit)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Margin
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {formatPercentDisplay(result.marginPercent)}%
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Markup
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {formatPercentDisplay(result.markupPercent)}%
                  </dd>
                </div>
                {result.netRevenue !== null ? (
                  <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold text-zinc-600">
                      Net revenue
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {money(result.netRevenue)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {result.units !== null &&
              result.totalRevenue !== null &&
              result.totalCost !== null &&
              result.totalProfit !== null ? (
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold text-zinc-600">
                      Total revenue
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {money(result.totalRevenue)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold text-zinc-600">
                      Total cost
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {money(result.totalCost)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold text-zinc-600">
                      Total profit
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {money(result.totalProfit)}
                    </dd>
                  </div>
                </dl>
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
          ) : result.error === "empty" ? (
            <p className="text-[15px] text-muted">{result.message}</p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[15px] leading-relaxed text-amber-950">
              {result.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
