"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Receipt, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  VAT_RATE_CHIPS,
  calculateVatGst,
  type VatGstMode,
} from "@/lib/utils/vat-gst";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const MODES: {
  id: VatGstMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "add",
    label: "Add tax",
    shortLabel: "Net → gross",
  },
  {
    id: "remove",
    label: "Remove tax",
    shortLabel: "Gross → net",
  },
  {
    id: "find-rate",
    label: "Find the tax rate",
    shortLabel: "Net + gross → %",
  },
];

/**
 * VAT / GST / sales-tax calculator — add, remove, or find the rate.
 * Inputs stay in component state only.
 */
export function VatGstCalculator() {
  const [mode, setMode] = useState<VatGstMode>("add");
  const [netRaw, setNetRaw] = useState("");
  const [grossRaw, setGrossRaw] = useState("");
  const [rateRaw, setRateRaw] = useState("18");
  const [currencyId, setCurrencyId] = useState("USD");
  const [splitTax, setSplitTax] = useState(false);

  const tablistId = useId();
  const netId = useId();
  const grossId = useId();
  const rateId = useId();
  const currencyIdInput = useId();
  const splitId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const net = parseDecimal(netRaw);
  const gross = parseDecimal(grossRaw);
  const ratePercent = parseDecimal(rateRaw);

  const result = calculateVatGst({
    mode,
    net: mode === "remove" ? null : net,
    gross: mode === "add" ? null : gross,
    ratePercent: mode === "find-rate" ? null : ratePercent,
    splitTax,
  });

  const money = (value: number) => formatMoney(value, currencyId);

  const selectMode = useCallback((next: VatGstMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("add");
    setNetRaw("");
    setGrossRaw("");
    setRateRaw("18");
    setCurrencyId("USD");
    setSplitTax(false);
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

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="vat-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="vat-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Receipt
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Tax calculation
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
            aria-label="VAT, GST and sales tax modes"
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

            {mode !== "remove" ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={netId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Net price (excluding tax)
                </label>
                <input
                  id={netId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={netRaw}
                  onChange={(event) => setNetRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            {mode !== "add" ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={grossId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Gross price (including tax)
                </label>
                <input
                  id={grossId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={grossRaw}
                  onChange={(event) => setGrossRaw(event.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            ) : null}

            {mode !== "find-rate" ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={rateId}
                  className="text-[12px] font-semibold text-muted"
                >
                  Tax rate (%)
                </label>
                <input
                  id={rateId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rateRaw}
                  onChange={(event) => setRateRaw(event.target.value)}
                  aria-describedby={`${rateId}-hint`}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {VAT_RATE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRateRaw(String(chip))}
                      className={`rounded-md border px-2.5 py-1 text-[12px] font-semibold tabular-nums transition ${
                        rateRaw.trim() === String(chip)
                          ? "border-cat-finance bg-cat-finance text-white"
                          : "border-border/80 bg-panel text-zinc-700 hover:border-cat-finance/40"
                      }`}
                    >
                      {chip}%
                    </button>
                  ))}
                </div>
                <p id={`${rateId}-hint`} className="text-[12px] text-zinc-600">
                  Rates differ by country, product and date. Enter the rate that
                  applies to you.
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-panel px-3 py-2.5">
              <input
                id={splitId}
                type="checkbox"
                checked={splitTax}
                onChange={(event) => setSplitTax(event.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-cat-finance focus:ring-cat-finance/30"
              />
              <label htmlFor={splitId} className="text-[13px] leading-snug text-zinc-700">
                Split the tax into two equal parts (for example CGST and SGST in
                India)
              </label>
            </div>

            {mode === "remove" ? (
              <p className="text-[12px] leading-relaxed text-zinc-600">
                Removing tax uses net = gross ÷ (1 + rate). It is{" "}
                <strong className="font-semibold text-foreground">not</strong>{" "}
                gross × (1 − rate).
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="vat-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="vat-outcome-heading"
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
              {mode === "find-rate" ? (
                <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {Number(result.ratePercent.toFixed(4)).toLocaleString(
                    "en-US",
                    { maximumFractionDigits: 4 },
                  )}
                  %
                </p>
              ) : (
                <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {mode === "add" ? money(result.gross) : money(result.net)}
                </p>
              )}

              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Net
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.net)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Tax
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.tax)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
                  <dt className="text-[11px] font-semibold text-zinc-600">
                    Gross
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.gross)}
                  </dd>
                </div>
              </dl>

              {result.split ? (
                <p className="text-[14px] leading-relaxed text-zinc-700">
                  Split parts:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(result.split.partA)}
                  </span>
                  {" + "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(result.split.partB)}
                  </span>
                  {" = "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(result.tax)}
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
