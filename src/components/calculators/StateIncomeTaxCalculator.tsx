"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  FILING_STATUSES,
  type FilingStatus,
  type StateTaxData,
} from "@/lib/state-tax/schema";
import { formatRatePercent, stateHref } from "@/lib/state-tax/format";
import { formatMoney, fromCents, parseDecimal } from "@/lib/utils/money";
import { calculateStateIncomeTax } from "@/lib/utils/state-tax";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

type Props = {
  states: StateTaxData[];
  /** When set, preselects this state (state pages). Changing navigates. */
  lockedStateCode?: string;
};

/**
 * State income tax estimator — published flat/progressive states only.
 * Inputs stay in React state (never URL, storage, cookies, or analytics).
 * Choosing a state navigates to that state's own URL.
 */
export function StateIncomeTaxCalculator({
  states,
  lockedStateCode,
}: Props) {
  const router = useRouter();
  const taxableStates = states.filter((s) => s.structure !== "none");
  const initialCode =
    lockedStateCode ??
    taxableStates[0]?.code ??
    "";

  const [stateCode, setStateCode] = useState(initialCode);
  const [grossRaw, setGrossRaw] = useState("");
  const [status, setStatus] = useState<FilingStatus>("single");
  const [pretaxRaw, setPretaxRaw] = useState("");

  const grossId = useId();
  const statusId = useId();
  const pretaxId = useId();
  const stateId = useId();

  const selected =
    taxableStates.find((s) => s.code === stateCode) ?? taxableStates[0] ?? null;

  const result = useMemo(() => {
    if (!selected) return null;
    return calculateStateIncomeTax({
      grossIncome: parseDecimal(grossRaw),
      filingStatus: status,
      pretaxDeductions: parseDecimal(pretaxRaw) ?? 0,
      state: selected,
    });
  }, [selected, grossRaw, status, pretaxRaw]);

  function handleStateChange(code: string) {
    const next = taxableStates.find((s) => s.code === code);
    if (!next) return;
    setStateCode(code);
    router.push(stateHref(next));
  }

  function handleReset() {
    setGrossRaw("");
    setPretaxRaw("");
    setStatus("single");
    if (!lockedStateCode && taxableStates[0]) {
      setStateCode(taxableStates[0].code);
    }
  }

  const money = (cents: number) => formatMoney(fromCents(cents), "USD");

  if (taxableStates.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
        <p className="text-[15px] leading-relaxed text-zinc-700">
          No state tax schedules are published on this page yet. When a sourced
          state schedule is ready, it will appear in the selector here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="sit-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="sit-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Landmark
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Income details
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

          <p className="text-[13px] leading-relaxed text-zinc-700">
            State income tax only. Federal tax, FICA, local taxes, credits and
            withholding rules are not included. Your numbers stay in your
            browser.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={stateId}
              className="text-[12px] font-semibold text-zinc-700"
            >
              State
            </label>
            <select
              id={stateId}
              value={selected?.code ?? ""}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            >
              {taxableStates.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code}) — {state.taxYear}
                </option>
              ))}
            </select>
            <nav aria-label="Published state pages" className="mt-2">
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-relaxed">
                {taxableStates.map((state) => (
                  <li key={state.code}>
                    <a
                      href={stateHref(state)}
                      className={
                        state.code === selected?.code
                          ? "font-semibold text-foreground underline underline-offset-2"
                          : "text-zinc-700 underline underline-offset-2 hover:text-foreground"
                      }
                    >
                      {state.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={grossId}
              className="text-[12px] font-semibold text-zinc-700"
            >
              Annual gross income
            </label>
            <input
              id={grossId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={grossRaw}
              onChange={(e) => setGrossRaw(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={statusId}
              className="text-[12px] font-semibold text-zinc-700"
            >
              Filing status
            </label>
            <select
              id={statusId}
              value={status}
              onChange={(e) => setStatus(e.target.value as FilingStatus)}
              className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            >
              {FILING_STATUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={pretaxId}
              className="text-[12px] font-semibold text-zinc-700"
            >
              Pre-tax deductions (optional)
            </label>
            <input
              id={pretaxId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={pretaxRaw}
              onChange={(e) => setPretaxRaw(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="sit-result-heading"
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-[18rem] flex-col lg:col-span-7"
      >
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="sit-result-heading"
              className="text-[15px] font-semibold text-foreground"
            >
              Estimate
            </h2>
            {selected ? (
              <span className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white">
                {selected.name} · {selected.taxYear}
              </span>
            ) : null}
          </div>

          {!result || (!result.ok && result.error === "empty") ? (
            <p className="text-[15px] leading-relaxed text-muted">
              Enter annual gross income to see an estimated state tax.
            </p>
          ) : !result.ok ? (
            <p className="text-[15px] leading-relaxed text-zinc-700">
              {result.message}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-muted">
                  Estimated state tax
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
                  {money(result.taxCents)}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Stat
                  label="Taxable income"
                  value={money(result.taxableIncomeCents)}
                />
                <Stat
                  label="Effective rate"
                  value={`${(result.effectiveRate * 100).toFixed(2)}%`}
                />
                <Stat
                  label="Marginal rate"
                  value={formatRatePercent(result.marginalRate)}
                />
                <Stat
                  label="Take-home after state tax"
                  value={money(result.takeHomeAfterStateTaxCents)}
                />
              </dl>
              <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
                {result.working}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/70">
                <table className="min-w-[22rem] w-full border-collapse text-left text-[13px]">
                  <caption className="sr-only">
                    Tax by bracket for the selected filing status
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
                      <th scope="col" className="px-3 py-2">
                        Bracket
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Rate
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Taxed amount
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((row) => (
                      <tr
                        key={`${row.from}-${row.to}-${row.rate}`}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-3 py-2 tabular-nums text-foreground">
                          {row.from.toLocaleString("en-US")}
                          {row.to === null
                            ? "+"
                            : ` – ${row.to.toLocaleString("en-US")}`}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-foreground">
                          {formatRatePercent(row.rate)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-foreground">
                          {money(row.taxableInBracketCents)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-foreground">
                          {money(row.taxCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="mt-auto text-[12px] leading-relaxed text-zinc-600">
            Estimates for general information only. Not tax advice. Check
            official figures with your state&apos;s revenue department or a tax
            professional. Federal tax, FICA, local taxes, credits and
            withholding are not included.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
