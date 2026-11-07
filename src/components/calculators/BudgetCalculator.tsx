"use client";

import { useId, useState } from "react";
import { PiggyBank, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  MAX_ROWS_PER_GROUP,
  RULE_50_30_20,
  calculateBudget,
  createDefaultOwnItems,
  groupLabel,
  type BudgetGroupId,
  type BudgetLineItem,
  type BudgetMethod,
  type BudgetSuccess,
} from "@/lib/utils/budget";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const METHODS: { id: BudgetMethod; label: string; hint: string }[] = [
  {
    id: "rule-50-30-20",
    label: "50/30/20 rule",
    hint: "Needs 50%, wants 30%, savings and debt repayment 20% — a widely used rule of thumb, not a requirement.",
  },
  {
    id: "custom",
    label: "Custom percentages",
    hint: "Set three percentages that total 100%.",
  },
  {
    id: "own-numbers",
    label: "My own numbers",
    hint: "List monthly amounts under needs, wants, and savings.",
  },
];

const GROUP_ORDER: BudgetGroupId[] = ["needs", "wants", "savings"];

let rowSeq = 100;

function nextRowId(): string {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

/**
 * Monthly budget calculator — 50/30/20, custom %, or own line items.
 * Inputs stay in component state only (never URL/storage/analytics).
 */
export function BudgetCalculator() {
  const [method, setMethod] = useState<BudgetMethod>("rule-50-30-20");
  const [incomeRaw, setIncomeRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");
  const [customNeeds, setCustomNeeds] = useState("50");
  const [customWants, setCustomWants] = useState("30");
  const [customSavings, setCustomSavings] = useState("20");
  const [ownItems, setOwnItems] = useState(createDefaultOwnItems);

  const incomeId = useId();
  const currencyInputId = useId();
  const methodGroupId = useId();
  const customNeedsId = useId();
  const customWantsId = useId();
  const customSavingsId = useId();

  const income = parseDecimal(incomeRaw);
  const result = calculateBudget({
    method,
    income,
    customNeeds: parseDecimal(customNeeds),
    customWants: parseDecimal(customWants),
    customSavings: parseDecimal(customSavings),
    ownNeeds: ownItems.needs,
    ownWants: ownItems.wants,
    ownSavings: ownItems.savings,
  });

  const money = (value: number) => formatMoney(value, currencyId);

  function handleReset() {
    setMethod("rule-50-30-20");
    setIncomeRaw("");
    setCurrencyId("USD");
    setCustomNeeds("50");
    setCustomWants("30");
    setCustomSavings("20");
    setOwnItems(createDefaultOwnItems());
  }

  function updateRow(
    group: BudgetGroupId,
    id: string,
    patch: Partial<BudgetLineItem>,
  ) {
    setOwnItems((prev) => ({
      ...prev,
      [group]: prev[group].map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    }));
  }

  function addRow(group: BudgetGroupId) {
    setOwnItems((prev) => {
      if (prev[group].length >= MAX_ROWS_PER_GROUP) return prev;
      return {
        ...prev,
        [group]: [
          ...prev[group],
          { id: nextRowId(), label: "New item", amount: null },
        ],
      };
    });
  }

  function removeRow(group: BudgetGroupId, id: string) {
    setOwnItems((prev) => ({
      ...prev,
      [group]: prev[group].filter((row) => row.id !== id),
    }));
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="budget-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="budget-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <PiggyBank
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Monthly budget
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
            General information only — not financial advice. Costs and
            priorities differ by country, city and household. Irregular income
            and one-off costs are not modelled here.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={incomeId}
              className="text-[12px] font-semibold text-muted"
            >
              Monthly after-tax income
            </label>
            <input
              id={incomeId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={incomeRaw}
              onChange={(event) => setIncomeRaw(event.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={currencyInputId}
              className="text-[12px] font-semibold text-muted"
            >
              Currency (display only)
            </label>
            <select
              id={currencyInputId}
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

          <fieldset className="flex flex-col gap-2.5">
            <legend className="text-[12px] font-semibold text-muted">
              Budget method
            </legend>
            {METHODS.map((item) => {
              const selected = method === item.id;
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                    selected
                      ? "border-cat-finance/50 bg-cat-finance-soft"
                      : "border-border/70 bg-background hover:border-cat-finance/30"
                  }`}
                >
                  <input
                    type="radio"
                    name={methodGroupId}
                    value={item.id}
                    checked={selected}
                    onChange={() => setMethod(item.id)}
                    className="mt-1 size-4 border-border text-cat-finance focus:ring-cat-finance/30"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-zinc-600">
                      {item.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {method === "custom" ? (
            <div className="grid grid-cols-3 gap-2">
              <PercentField
                id={customNeedsId}
                label="Needs %"
                value={customNeeds}
                onChange={setCustomNeeds}
              />
              <PercentField
                id={customWantsId}
                label="Wants %"
                value={customWants}
                onChange={setCustomWants}
              />
              <PercentField
                id={customSavingsId}
                label="Savings %"
                value={customSavings}
                onChange={setCustomSavings}
              />
            </div>
          ) : null}

          {method === "own-numbers" ? (
            <div className="flex flex-col gap-5">
              {GROUP_ORDER.map((group) => (
                <OwnGroupEditor
                  key={group}
                  group={group}
                  rows={ownItems[group]}
                  onLabelChange={(id, label) =>
                    updateRow(group, id, { label })
                  }
                  amountRawFor={(row) =>
                    row.amount === null ? "" : String(row.amount)
                  }
                  onAmountRawChange={(id, raw) => {
                    const trimmed = raw.trim();
                    if (!trimmed) {
                      updateRow(group, id, { amount: null });
                      return;
                    }
                    const parsed = parseDecimal(raw);
                    if (parsed !== null) {
                      updateRow(group, id, { amount: parsed });
                    }
                  }}
                  onAdd={() => addRow(group)}
                  onRemove={(id) => removeRow(group, id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="budget-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="budget-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
            </span>
            <span className="text-[12px] text-muted">
              {METHODS.find((m) => m.id === method)?.label}
            </span>
          </div>

          {result.ok ? (
            <BudgetResultPanel result={result} money={money} />
          ) : result.error === "empty" ? (
            <p className="text-[15px] text-muted">{result.message}</p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[15px] leading-relaxed text-amber-950">
              {result.message}
            </p>
          )}

          <p className="text-[12px] leading-relaxed text-zinc-600">
            This is general information, not financial advice. The 50/30/20
            figures are a common rule of thumb for comparison — not what you
            must do.
          </p>
        </div>
      </section>
    </div>
  );
}

function PercentField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
      />
    </div>
  );
}

/**
 * Own-numbers group editor with string draft amounts for typing comfort.
 */
function OwnGroupEditor({
  group,
  rows,
  onLabelChange,
  onAmountRawChange,
  amountRawFor,
  onAdd,
  onRemove,
}: {
  group: BudgetGroupId;
  rows: BudgetLineItem[];
  onLabelChange: (id: string, label: string) => void;
  onAmountRawChange: (id: string, raw: string) => void;
  amountRawFor: (row: BudgetLineItem) => string;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">
          {groupLabel(group)}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          disabled={rows.length >= MAX_ROWS_PER_GROUP}
          aria-label={`Add row to ${groupLabel(group)}`}
          className="inline-flex items-center gap-1 rounded-md border border-border/80 px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row, index) => {
          const labelId = `${group}-label-${row.id}`;
          const amountId = `${group}-amount-${row.id}`;
          const draft =
            drafts[row.id] !== undefined ? drafts[row.id]! : amountRawFor(row);
          return (
            <li
              key={row.id}
              className="grid grid-cols-[1fr_6.5rem_auto] items-end gap-1.5 sm:grid-cols-[1fr_7.5rem_auto]"
            >
              <div className="min-w-0">
                <label htmlFor={labelId} className="sr-only">
                  {groupLabel(group)} label {index + 1}
                </label>
                <input
                  id={labelId}
                  type="text"
                  value={row.label}
                  onChange={(event) => onLabelChange(row.id, event.target.value)}
                  className="w-full rounded-md border border-border/70 bg-panel px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-cat-finance focus:ring-1 focus:ring-cat-finance/20"
                />
              </div>
              <div>
                <label htmlFor={amountId} className="sr-only">
                  {groupLabel(group)} amount {index + 1}
                </label>
                <input
                  id={amountId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setDrafts((prev) => ({ ...prev, [row.id]: raw }));
                    onAmountRawChange(row.id, raw);
                  }}
                  onBlur={() => {
                    setDrafts((prev) => {
                      const next = { ...prev };
                      delete next[row.id];
                      return next;
                    });
                  }}
                  className="w-full rounded-md border border-border/70 bg-panel px-2 py-1.5 text-[13px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-1 focus:ring-cat-finance/20"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                aria-label={`Remove ${row.label || `row ${index + 1}`} from ${groupLabel(group)}`}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border/70 text-zinc-600 transition hover:bg-stone-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <p className="mt-2 text-[12px] text-zinc-600">No rows yet. Add a line.</p>
      ) : null}
    </div>
  );
}

function BudgetResultPanel({
  result,
  money,
}: {
  result: BudgetSuccess;
  money: (value: number) => string;
}) {
  const { amounts, shares, balance, totalSpent, income, vsRule, working } =
    result;
  const barTotal = Math.max(income, totalSpent, 1);
  const segments = GROUP_ORDER.map((group) => ({
    group,
    value: amounts[group],
    pct: Math.max(0, (amounts[group] / barTotal) * 100),
  }));
  const leftoverPct =
    balance > 0 ? Math.max(0, (balance / barTotal) * 100) : 0;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        {GROUP_ORDER.map((group) => (
          <div
            key={group}
            className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3"
          >
            <dt className="text-[11px] font-semibold text-zinc-600">
              {groupLabel(group)}
            </dt>
            <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
              {money(amounts[group])}
            </dd>
            {result.method === "own-numbers" ? (
              <dd className="mt-0.5 text-[12px] tabular-nums text-zinc-600">
                {shares[group]}% of income
              </dd>
            ) : (
              <dd className="mt-0.5 text-[12px] tabular-nums text-zinc-600">
                {shares[group]}%
              </dd>
            )}
          </div>
        ))}
      </dl>

      {result.method === "own-numbers" ? (
        <div className="space-y-2 text-[14px] leading-relaxed text-zinc-700">
          <p>
            Total listed:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {money(totalSpent)}
            </span>
            {balance >= 0 ? (
              <>
                {" "}
                · Left over:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money(balance)}
                </span>
              </>
            ) : (
              <>
                {" "}
                · Over by{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money(Math.abs(balance))}
                </span>
              </>
            )}
          </p>
          <p>
            Savings share of income:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {shares.savings}%
            </span>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {vsRule.map((item) => {
              const abs = Math.abs(item.difference);
              const direction =
                item.difference > 0
                  ? "above"
                  : item.difference < 0
                    ? "below"
                    : "at";
              return (
                <li key={item.group}>
                  {groupLabel(item.group)}:{" "}
                  {item.difference === 0
                    ? `at the ${RULE_50_30_20[item.group]}% target (${money(item.targetAmount)})`
                    : `${money(abs)} ${direction} the ${RULE_50_30_20[item.group]}% target`}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[12px] font-semibold text-zinc-600">
          Share of income (visual)
        </p>
        <div
          className="flex h-8 w-full overflow-hidden rounded-lg border border-border/70"
          role="img"
          aria-label={segments
            .map(
              (s) =>
                `${groupLabel(s.group)} ${money(s.value)} (${shares[s.group]}%)`,
            )
            .concat(
              leftoverPct > 0
                ? [`Left over ${money(balance)}`]
                : balance < 0
                  ? [`Over by ${money(Math.abs(balance))}`]
                  : [],
            )
            .join("; ")}
        >
          {segments.map((s, index) => (
            <div
              key={s.group}
              style={{ width: `${s.pct}%` }}
              className={`flex items-center justify-center text-[10px] font-semibold text-white ${
                index === 0
                  ? "bg-zinc-800"
                  : index === 1
                    ? "bg-zinc-500"
                    : "bg-zinc-400"
              }`}
              title={`${groupLabel(s.group)}: ${money(s.value)}`}
            >
              {s.pct >= 12 ? (
                <span className="truncate px-1">
                  {groupLabel(s.group).split(" ")[0]}
                </span>
              ) : null}
            </div>
          ))}
          {leftoverPct > 0 ? (
            <div
              style={{ width: `${leftoverPct}%` }}
              className="bg-stone-200"
              title={`Left over: ${money(balance)}`}
            />
          ) : null}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-600">
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-800" aria-hidden="true" />
            Needs
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-500" aria-hidden="true" />
            Wants
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-400" aria-hidden="true" />
            Savings
          </li>
          {leftoverPct > 0 ? (
            <li className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm bg-stone-200 ring-1 ring-zinc-300"
                aria-hidden="true"
              />
              Left over
            </li>
          ) : null}
        </ul>
        <ul className="sr-only">
          {segments.map((s) => (
            <li key={s.group}>
              {groupLabel(s.group)}: {money(s.value)} ({shares[s.group]}% of
              income)
            </li>
          ))}
          {balance > 0 ? <li>Left over: {money(balance)}</li> : null}
          {balance < 0 ? <li>Over by: {money(Math.abs(balance))}</li> : null}
        </ul>
      </div>

      <p
        className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${financeTheme.borderSoft} ${financeTheme.soft} ${financeTheme.text}`}
      >
        <span className="ui-label mb-0.5 block text-[11px] opacity-80">
          Worked step
        </span>
        {working}
      </p>
    </div>
  );
}
