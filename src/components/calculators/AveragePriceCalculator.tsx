"use client";

import { useId, useState } from "react";
import { ChartColumn, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  MAX_PURCHASE_ROWS,
  QUANTITY_DISPLAY_DIGITS,
  calculateAveragePrice,
} from "@/lib/utils/average-price";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

type PurchaseDraft = {
  id: string;
  label: string;
  quantity: string;
  price: string;
  fee: string;
};

let purchaseSeq = 0;

function nextPurchaseId(): string {
  purchaseSeq += 1;
  return `purchase-${purchaseSeq}`;
}

function initialRows(): PurchaseDraft[] {
  return [
    {
      id: "purchase-initial-0",
      label: "",
      quantity: "",
      price: "",
      fee: "",
    },
    {
      id: "purchase-initial-1",
      label: "",
      quantity: "",
      price: "",
      fee: "",
    },
  ];
}

function formatQty(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: QUANTITY_DISPLAY_DIGITS,
  });
}

function formatPct(n: number): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * Weighted average purchase price — cost-basis arithmetic only.
 * Inputs stay in React state (never URL, storage, cookies, or analytics).
 */
export function AveragePriceCalculator() {
  const [rows, setRows] = useState<PurchaseDraft[]>(initialRows);
  const [includeFees, setIncludeFees] = useState(false);
  const [currencyId, setCurrencyId] = useState("USD");
  const [buyMoreQtyRaw, setBuyMoreQtyRaw] = useState("");
  const [buyMorePriceRaw, setBuyMorePriceRaw] = useState("");
  const [targetAvgRaw, setTargetAvgRaw] = useState("");
  const [targetExtraRaw, setTargetExtraRaw] = useState("");
  const [currentPriceRaw, setCurrentPriceRaw] = useState("");

  const uid = useId();
  const money = (value: number) => formatMoney(value, currencyId);

  const result = calculateAveragePrice({
    rows: rows.map((row) => ({
      label: row.label,
      quantity: parseDecimal(row.quantity),
      price: parseDecimal(row.price),
      fee: parseDecimal(row.fee),
    })),
    includeFees,
    buyMoreQuantity: parseDecimal(buyMoreQtyRaw),
    buyMorePrice: parseDecimal(buyMorePriceRaw),
    targetAverage: parseDecimal(targetAvgRaw),
    targetExtraQuantity: parseDecimal(targetExtraRaw),
    currentPrice: parseDecimal(currentPriceRaw),
  });

  function handleReset() {
    purchaseSeq = 0;
    setRows(initialRows());
    setIncludeFees(false);
    setCurrencyId("USD");
    setBuyMoreQtyRaw("");
    setBuyMorePriceRaw("");
    setTargetAvgRaw("");
    setTargetExtraRaw("");
    setCurrentPriceRaw("");
  }

  function updateRow(id: string, patch: Partial<PurchaseDraft>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => {
      if (prev.length >= MAX_PURCHASE_ROWS) return prev;
      return [
        ...prev,
        {
          id: nextPurchaseId(),
          label: "",
          quantity: "",
          price: "",
          fee: "",
        },
      ];
    });
  }

  function removeRow(id: string) {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== id),
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="avg-price-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="avg-price-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <ChartColumn
                className={`size-5 ${financeTheme.text}`}
                aria-hidden="true"
              />
              Purchases
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
            Arithmetic only. This page does not suggest buying or selling, does
            not predict prices, and is not financial or tax advice. Tax
            cost-basis rules differ by country and account type.
          </p>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${uid}-currency`}
              className="text-[12px] font-semibold text-muted"
            >
              Currency
            </label>
            <select
              id={`${uid}-currency`}
              value={currencyId}
              onChange={(event) => setCurrencyId(event.target.value)}
              className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background/70 px-3.5 py-3">
            <input
              type="checkbox"
              checked={includeFees}
              onChange={(event) => setIncludeFees(event.target.checked)}
              className="mt-0.5 size-4 rounded border-border text-cat-finance focus:ring-cat-finance/30"
            />
            <span>
              <span className="block text-[13px] font-semibold text-foreground">
                Include fees in the average
              </span>
              <span className="mt-0.5 block text-[12px] text-muted">
                When on, each row&apos;s fee is added to that purchase&apos;s
                cost before dividing by quantity.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <PurchaseRowEditor
                key={row.id}
                row={row}
                index={index}
                total={rows.length}
                includeFees={includeFees}
                onChange={(patch) => updateRow(row.id, patch)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= MAX_PURCHASE_ROWS}
              aria-label="Add purchase row"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] font-semibold text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add purchase ({rows.length}/{MAX_PURCHASE_ROWS})
            </button>
          </div>

          <fieldset className="rounded-xl border border-border/60 bg-background/70 p-4">
            <legend className="px-1 text-[13px] font-semibold text-foreground">
              If I buy more
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-more-qty`}
                label="Extra quantity"
                value={buyMoreQtyRaw}
                onChange={setBuyMoreQtyRaw}
              />
              <NumberField
                id={`${uid}-more-price`}
                label="Price per unit"
                value={buyMorePriceRaw}
                onChange={setBuyMorePriceRaw}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-border/60 bg-background/70 p-4">
            <legend className="px-1 text-[13px] font-semibold text-foreground">
              Price needed for a target average
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                id={`${uid}-target-avg`}
                label="Target average"
                value={targetAvgRaw}
                onChange={setTargetAvgRaw}
              />
              <NumberField
                id={`${uid}-target-extra`}
                label="Extra quantity"
                value={targetExtraRaw}
                onChange={setTargetExtraRaw}
              />
            </div>
          </fieldset>

          <NumberField
            id={`${uid}-mark`}
            label="Current price (optional)"
            value={currentPriceRaw}
            onChange={setCurrentPriceRaw}
            hint="Compares market value to your total cost in currency and percent. Neutral arithmetic only."
          />
        </div>
      </section>

      <section
        aria-labelledby="avg-price-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="avg-price-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            Average price
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Average price per unit
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {money(result.base.averagePrice)}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat
                  label="Total quantity"
                  value={formatQty(result.base.totalQuantity)}
                />
                <Stat
                  label="Total cost"
                  value={money(result.base.totalCost)}
                />
                <Stat
                  label="Average per unit"
                  value={money(result.base.averagePrice)}
                />
              </dl>

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.base.working}
              </p>

              {result.buyMore ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <h3 className="text-[14px] font-semibold text-foreground">
                    After buying more
                  </h3>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Stat
                      label="New quantity"
                      value={formatQty(result.buyMore.totalQuantity)}
                    />
                    <Stat
                      label="New total cost"
                      value={money(result.buyMore.totalCost)}
                    />
                    <Stat
                      label="New average"
                      value={money(result.buyMore.averagePrice)}
                    />
                  </dl>
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-700">
                    {result.buyMore.working}
                  </p>
                </div>
              ) : null}

              {result.target ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <h3 className="text-[14px] font-semibold text-foreground">
                    Price needed for target average
                  </h3>
                  {result.target.ok ? (
                    <>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                        {money(result.target.requiredPrice)}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-zinc-700">
                        {result.target.working}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">
                      {result.target.message}
                    </p>
                  )}
                </div>
              ) : null}

              {result.mark ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <h3 className="text-[14px] font-semibold text-foreground">
                    Compared with current price
                  </h3>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Stat
                      label="Market value"
                      value={money(result.mark.marketValue)}
                    />
                    <Stat
                      label={
                        result.mark.difference >= 0
                          ? "Amount above cost"
                          : "Amount below cost"
                      }
                      value={money(Math.abs(result.mark.difference))}
                    />
                    <Stat
                      label="Percent vs cost"
                      value={formatPct(result.mark.percentVsCost)}
                    />
                  </dl>
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-700">
                    {result.mark.working}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PurchaseRowEditor({
  row,
  index,
  total,
  includeFees,
  onChange,
  onRemove,
}: {
  row: PurchaseDraft;
  index: number;
  total: number;
  includeFees: boolean;
  onChange: (patch: Partial<PurchaseDraft>) => void;
  onRemove: () => void;
}) {
  const labelId = useId();
  const qtyId = useId();
  const priceId = useId();
  const feeId = useId();
  const name = row.label.trim() || `Purchase ${index + 1}`;

  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-zinc-700">{name}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          aria-label={`Remove ${name}`}
          className="rounded-md border border-border/80 p-1.5 text-zinc-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor={labelId}
            className="text-[11px] font-semibold text-muted"
          >
            Label or date (optional)
          </label>
          <input
            id={labelId}
            type="text"
            autoComplete="off"
            value={row.label}
            onChange={(event) => onChange({ label: event.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={qtyId} className="text-[11px] font-semibold text-muted">
            Quantity
          </label>
          <input
            id={qtyId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={priceId}
            className="text-[11px] font-semibold text-muted"
          >
            Price per unit
          </label>
          <input
            id={priceId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.price}
            onChange={(event) => onChange({ price: event.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor={feeId}
            className="text-[11px] font-semibold text-muted"
          >
            Fee (optional)
          </label>
          <input
            id={feeId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={row.fee}
            onChange={(event) => onChange({ fee: event.target.value })}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
          />
          {!includeFees ? (
            <p className="text-[11px] text-zinc-500">
              Not used in the average until “Include fees” is turned on.
            </p>
          ) : null}
        </div>
      </div>
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
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:bg-panel focus:ring-2 focus:ring-cat-finance/20"
      />
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
