"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
} from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  MAX_DEBTS,
  buildScheduleCsv,
  calculateDebtPayoff,
  formatMoney,
  fromCents,
  parseDecimal,
  strategyLabel,
  type DebtInput,
  type DebtPayoffStrategyId,
  type DebtPayoffStrategyResult,
  type DebtPayoffSuccess,
} from "@/lib/utils/debt-payoff";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

type DebtRow = {
  id: string;
  name: string;
  balance: string;
  apr: string;
  minimum: string;
};

let rowSeq = 0;
function nextId(): string {
  rowSeq += 1;
  return `debt-${rowSeq}`;
}

function emptyRows(count: number): DebtRow[] {
  return Array.from({ length: count }, () => ({
    id: nextId(),
    name: "",
    balance: "",
    apr: "",
    minimum: "",
  }));
}

const STRATEGY_ORDER: DebtPayoffStrategyId[] = [
  "minimums",
  "snowball",
  "avalanche",
  "selected",
];

/**
 * Multi-debt payoff calculator — snowball, avalanche, selected order, minimums.
 * Inputs stay in component state only (never URL / storage / analytics).
 */
export function DebtPayoffCalculator() {
  const [rows, setRows] = useState<DebtRow[]>(() => emptyRows(3));
  const [budgetRaw, setBudgetRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");
  const [focusStrategy, setFocusStrategy] =
    useState<DebtPayoffStrategyId>("avalanche");
  const [startMonth, setStartMonth] = useState<Date | null>(null);

  const budgetId = useId();
  const currencyInputId = useId();

  useEffect(() => {
    const now = new Date();
    setStartMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  const debts: DebtInput[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    balance: parseDecimal(row.balance),
    aprPercent: row.apr.trim() === "" ? null : parseDecimal(row.apr),
    minimumPayment: parseDecimal(row.minimum),
  }));

  const result = calculateDebtPayoff({
    debts,
    monthlyBudget: parseDecimal(budgetRaw),
    selectedOrderIds: rows.map((r) => r.id),
  });

  const money = (cents: number) => formatMoney(fromCents(cents), currencyId);

  function handleReset() {
    rowSeq = 0;
    setRows(emptyRows(3));
    setBudgetRaw("");
    setCurrencyId("USD");
    setFocusStrategy("avalanche");
  }

  function updateRow(id: string, patch: Partial<DebtRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => {
      if (prev.length >= MAX_DEBTS) return prev;
      return [
        ...prev,
        { id: nextId(), name: "", balance: "", apr: "", minimum: "" },
      ];
    });
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  function moveRow(id: string, direction: -1 | 1) {
    setRows((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index]!;
      copy[index] = copy[next]!;
      copy[next] = tmp;
      return copy;
    });
  }

  function downloadCsv(strategy: DebtPayoffStrategyId) {
    if (!result.ok) return;
    const s = result.strategies[strategy];
    const csv = buildScheduleCsv(s, result.debtLabels, result.debtIds);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debt-payoff-${strategy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="debt-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="debt-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Scale
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Debt list
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
            General information only — not financial advice. Avalanche usually
            costs the least interest in this model; some people prefer snowball
            because the first debts clear sooner. The best plan is the one you
            can keep.
          </p>

          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label
                htmlFor={budgetId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Total monthly amount for debt payments
              </label>
              <input
                id={budgetId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={budgetRaw}
                onChange={(e) => setBudgetRaw(e.target.value)}
                className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={currencyInputId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Currency (display only)
              </label>
              <select
                id={currencyInputId}
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Use the up and down buttons to set your selected order. Snowball
              and avalanche ignore that order and sort by balance or rate.
            </p>
            {rows.map((row, index) => (
              <DebtRowEditor
                key={row.id}
                row={row}
                index={index}
                total={rows.length}
                onChange={(patch) => updateRow(row.id, patch)}
                onRemove={() => removeRow(row.id)}
                onMoveUp={() => moveRow(row.id, -1)}
                onMoveDown={() => moveRow(row.id, 1)}
              />
            ))}
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= MAX_DEBTS}
              aria-label="Add debt row"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] font-semibold text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add debt ({rows.length}/{MAX_DEBTS})
            </button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="debt-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="debt-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
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
          ) : (
            <ResultsPanel
              result={result}
              money={money}
              startMonth={startMonth}
              focusStrategy={focusStrategy}
              onFocusStrategy={setFocusStrategy}
              onDownloadCsv={downloadCsv}
            />
          )}

          <p className="text-[12px] leading-relaxed text-zinc-600">
            This is general information, not financial advice. If you&apos;re
            struggling to keep up with payments, you may want to contact your
            lender or a not-for-profit credit counselling service in your
            country.
          </p>
        </div>
      </section>
    </div>
  );
}

function DebtRowEditor({
  row,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  row: DebtRow;
  index: number;
  total: number;
  onChange: (patch: Partial<DebtRow>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const nameId = useId();
  const balanceId = useId();
  const aprId = useId();
  const minId = useId();
  const label = row.name.trim() || `Debt ${index + 1}`;

  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-zinc-700">
          {label}
          <span className="ml-1 font-normal text-zinc-500">
            (order {index + 1})
          </span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${label} up in selected order`}
            className="rounded-md border border-border/80 p-1.5 text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index >= total - 1}
            aria-label={`Move ${label} down in selected order`}
            className="rounded-md border border-border/80 p-1.5 text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label={`Remove ${label}`}
            className="rounded-md border border-border/80 p-1.5 text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor={nameId} className="text-[11px] font-semibold text-muted">
            Name (optional)
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="off"
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={balanceId}
            className="text-[11px] font-semibold text-muted"
          >
            Current balance
          </label>
          <input
            id={balanceId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.balance}
            onChange={(e) => onChange({ balance: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={aprId} className="text-[11px] font-semibold text-muted">
            Annual interest rate (APR %)
          </label>
          <input
            id={aprId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.apr}
            onChange={(e) => onChange({ apr: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor={minId} className="text-[11px] font-semibold text-muted">
            Minimum monthly payment
          </label>
          <input
            id={minId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.minimum}
            onChange={(e) => onChange({ minimum: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({
  result,
  money,
  startMonth,
  focusStrategy,
  onFocusStrategy,
  onDownloadCsv,
}: {
  result: DebtPayoffSuccess;
  money: (cents: number) => string;
  startMonth: Date | null;
  focusStrategy: DebtPayoffStrategyId;
  onFocusStrategy: (id: DebtPayoffStrategyId) => void;
  onDownloadCsv: (id: DebtPayoffStrategyId) => void;
}) {
  const focused = result.strategies[focusStrategy];
  const mins = result.strategies.minimums;

  const comparisons = useMemo(() => {
    const lines: string[] = [];
    const snow = result.strategies.snowball;
    const av = result.strategies.avalanche;
    if (snow.paidOff && av.paidOff) {
      const diff = snow.totalInterestCents - av.totalInterestCents;
      if (diff > 0) {
        lines.push(
          `Avalanche costs ${money(diff)} less interest than snowball in this scenario.`,
        );
      } else if (diff < 0) {
        lines.push(
          `Snowball costs ${money(-diff)} less interest than avalanche in this scenario.`,
        );
      } else {
        lines.push(
          "Avalanche and snowball cost the same interest in this scenario.",
        );
      }
    }
    for (const id of ["snowball", "avalanche", "selected"] as const) {
      const s = result.strategies[id];
      if (s.paidOff && mins.paidOff) {
        const diff = mins.totalInterestCents - s.totalInterestCents;
        if (diff > 0) {
          lines.push(
            `${strategyLabel(id)} costs ${money(diff)} less interest than minimums only.`,
          );
        }
      }
    }
    return lines;
  }, [result, mins, money]);

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      {result.warnings.map((warning) => (
        <p
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[14px] leading-relaxed text-amber-950"
        >
          {warning}
        </p>
      ))}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-[13px]">
          <caption className="mb-2 text-left text-[12px] font-semibold text-zinc-600">
            Strategy comparison
          </caption>
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-500">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Strategy
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Months
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Total interest
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Total paid
              </th>
              <th scope="col" className="py-2 font-semibold">
                Debt-free date
              </th>
            </tr>
          </thead>
          <tbody>
            {STRATEGY_ORDER.map((id) => {
              const s = result.strategies[id];
              return (
                <tr key={id} className="border-b border-border/70">
                  <th scope="row" className="py-2.5 pr-3 font-semibold text-foreground">
                    <button
                      type="button"
                      onClick={() => onFocusStrategy(id)}
                      className={`rounded-md px-2 py-1 text-left transition ${
                        focusStrategy === id
                          ? "bg-zinc-900 text-white"
                          : "hover:bg-stone-100"
                      }`}
                    >
                      {strategyLabel(id)}
                    </button>
                  </th>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {s.paidOff
                      ? s.months
                      : "Not within 100 years"}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {s.paidOff ? money(s.totalInterestCents) : "—"}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {s.paidOff ? money(s.totalPaidCents) : "—"}
                  </td>
                  <td className="py-2.5 tabular-nums">
                    {s.paidOff && startMonth
                      ? format(addMonths(startMonth, s.months - 1), "MMM yyyy")
                      : s.paidOff
                        ? "—"
                        : "Not paid off within 100 years at this payment"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {comparisons.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-zinc-700">
          {comparisons.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <BalanceChart
        strategies={result.strategies}
        focus={focusStrategy}
        money={money}
      />

      <DebtClearList
        result={focused}
        labels={result.debtLabels}
        ids={result.debtIds}
        startMonth={startMonth}
      />

      <ScheduleSection
        strategy={focused}
        labels={result.debtLabels}
        ids={result.debtIds}
        money={money}
        startMonth={startMonth}
        strategyId={focusStrategy}
        onDownload={() => onDownloadCsv(focusStrategy)}
      />
    </div>
  );
}

function DebtClearList({
  result,
  labels,
  ids,
  startMonth,
}: {
  result: DebtPayoffStrategyResult;
  labels: Record<string, string>;
  ids: string[];
  startMonth: Date | null;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-foreground">
        When each debt clears ({strategyLabel(result.strategy)})
      </h3>
      <ul className="mt-2 space-y-1 text-[14px] text-zinc-700">
        {ids.map((id) => {
          const month = result.debtPaidOffMonth[id];
          return (
            <li key={id} className="tabular-nums">
              {labels[id] ?? id}:{" "}
              {month == null
                ? "still open in this run"
                : startMonth
                  ? `${format(addMonths(startMonth, month - 1), "MMM yyyy")} (month ${month})`
                  : `month ${month}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BalanceChart({
  strategies,
  focus,
  money,
}: {
  strategies: Record<DebtPayoffStrategyId, DebtPayoffStrategyResult>;
  focus: DebtPayoffStrategyId;
  money: (cents: number) => string;
}) {
  const focused = strategies[focus];
  const points = focused.schedule;
  if (points.length === 0) return null;

  const width = 560;
  const height = 160;
  const padX = 28;
  const padY = 16;
  const maxBalance = Math.max(
    ...points.map((p) => p.totalBalanceAfterCents),
    1,
  );
  const maxMonth = points.length;

  function xAt(month: number) {
    return padX + ((month - 1) / Math.max(maxMonth - 1, 1)) * (width - padX * 2);
  }
  function yAt(cents: number) {
    return (
      height -
      padY -
      (cents / maxBalance) * (height - padY * 2)
    );
  }

  const path = points
    .map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${xAt(p.month).toFixed(1)} ${yAt(p.totalBalanceAfterCents).toFixed(1)}`;
    })
    .join(" ");

  const sample = [
    points[0],
    points[Math.floor(points.length / 2)],
    points[points.length - 1],
  ].filter(Boolean) as typeof points;

  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-zinc-600">
        Total balance over time — {strategyLabel(focus)}
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-w-full"
        role="img"
        aria-label={`Balance chart for ${strategyLabel(focus)}. After month 1 the total balance is ${money(points[0]!.totalBalanceAfterCents)}; after month ${points.length} it is ${money(points[points.length - 1]!.totalBalanceAfterCents)}.`}
      >
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="#d4d4d8"
          strokeWidth="1"
        />
        <line
          x1={padX}
          y1={padY}
          x2={padX}
          y2={height - padY}
          stroke="#d4d4d8"
          strokeWidth="1"
        />
        <path d={path} fill="none" stroke="#27272a" strokeWidth="2" />
        {sample.map((p) => (
          <g key={p.month}>
            <circle
              cx={xAt(p.month)}
              cy={yAt(p.totalBalanceAfterCents)}
              r="3"
              fill="#27272a"
            />
            <text
              x={xAt(p.month)}
              y={yAt(p.totalBalanceAfterCents) - 8}
              textAnchor="middle"
              className="fill-zinc-600"
              fontSize="10"
            >
              M{p.month}: {money(p.totalBalanceAfterCents)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="sr-only">
        {points.map((p) => (
          <li key={p.month}>
            Month {p.month}: total balance {money(p.totalBalanceAfterCents)},
            payment {money(p.totalPaymentCents)}, interest{" "}
            {money(p.totalInterestCents)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleSection({
  strategy,
  labels,
  ids,
  money,
  startMonth,
  strategyId,
  onDownload,
}: {
  strategy: DebtPayoffStrategyResult;
  labels: Record<string, string>;
  ids: string[];
  money: (cents: number) => string;
  startMonth: Date | null;
  strategyId: DebtPayoffStrategyId;
  onDownload: () => void;
}) {
  const years = useMemo(() => {
    const map = new Map<number, typeof strategy.schedule>();
    for (const row of strategy.schedule) {
      const yearIndex = Math.ceil(row.month / 12);
      const list = map.get(yearIndex) ?? [];
      list.push(row);
      map.set(yearIndex, list);
    }
    return [...map.entries()];
  }, [strategy.schedule]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          Yearly schedule — {strategyLabel(strategyId)}
        </h3>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-800 transition hover:bg-stone-50"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Download schedule (CSV)
        </button>
      </div>
      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {years.map(([yearIndex, rows]) => (
          <details
            key={yearIndex}
            className="rounded-lg border border-border/70 bg-background/70"
          >
            <summary className="cursor-pointer list-none px-3 py-2 text-[13px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              Year {yearIndex}
              {startMonth
                ? ` (${format(addMonths(startMonth, (yearIndex - 1) * 12), "yyyy")}–${format(addMonths(startMonth, yearIndex * 12 - 1), "yyyy")})`
                : ""}
              <span className="ml-2 font-normal text-zinc-500">
                {rows.length} month{rows.length === 1 ? "" : "s"}
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-border/60 px-2 pb-2">
              <table className="w-full min-w-[28rem] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="text-[11px] text-zinc-500">
                    <th scope="col" className="py-1.5 pr-2 font-semibold">
                      Month
                    </th>
                    {ids.map((id) => (
                      <th
                        key={id}
                        scope="col"
                        className="py-1.5 pr-2 font-semibold"
                      >
                        {labels[id] ?? id}
                      </th>
                    ))}
                    <th scope="col" className="py-1.5 pr-2 font-semibold">
                      Interest
                    </th>
                    <th scope="col" className="py-1.5 font-semibold">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const byId = new Map(row.debts.map((d) => [d.debtId, d]));
                    return (
                      <tr key={row.month} className="border-t border-border/50">
                        <th
                          scope="row"
                          className="py-1.5 pr-2 font-medium tabular-nums"
                        >
                          {row.month}
                          {startMonth
                            ? ` · ${format(addMonths(startMonth, row.month - 1), "MMM yyyy")}`
                            : ""}
                        </th>
                        {ids.map((id) => (
                          <td
                            key={id}
                            className="py-1.5 pr-2 tabular-nums text-zinc-700"
                          >
                            {money(byId.get(id)?.paymentCents ?? 0)}
                          </td>
                        ))}
                        <td className="py-1.5 pr-2 tabular-nums text-zinc-700">
                          {money(row.totalInterestCents)}
                        </td>
                        <td className="py-1.5 tabular-nums text-zinc-700">
                          {money(row.totalBalanceAfterCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
