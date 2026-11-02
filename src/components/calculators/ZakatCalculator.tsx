"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Copy, HandCoins, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  fromCents,
  parseDecimal,
} from "@/lib/utils/money";
import {
  GOLD_KARATS,
  GOLD_NISAB_GRAMS_ALT,
  GOLD_NISAB_GRAMS_STANDARD,
  MAX_METAL_ITEMS,
  PRICE_UNITS,
  SILVER_NISAB_GRAMS_ALT,
  SILVER_NISAB_GRAMS_STANDARD,
  WEIGHT_UNITS,
  ZAKAT_RATE,
  calculateZakat,
  type GoldItemInput,
  type GoldKarat,
  type NisabBasis,
  type PriceUnit,
  type SilverItemInput,
  type WeightUnit,
} from "@/lib/utils/zakat";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

function newGoldItem(): GoldItemInput {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    weight: null,
    unit: "gram",
    karat: 24,
    personalJewellery: false,
  };
}

function newSilverItem(): SilverItemInput {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    weight: null,
    unit: "gram",
    purityPercent: 100,
  };
}

/**
 * Zakat wealth calculator — browser-only, no price fetching, no analytics of inputs.
 */
export function ZakatCalculator() {
  const [currencyId, setCurrencyId] = useState("USD");
  const [nisabBasis, setNisabBasis] = useState<NisabBasis>("silver");
  const [useAltNisabWeights, setUseAltNisabWeights] = useState(false);
  const [customNisabRaw, setCustomNisabRaw] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("per_gram");
  const [goldPriceRaw, setGoldPriceRaw] = useState("");
  const [silverPriceRaw, setSilverPriceRaw] = useState("");
  const [includePersonalJewellery, setIncludePersonalJewellery] =
    useState(true);

  const [cashRaw, setCashRaw] = useState("");
  const [bankRaw, setBankRaw] = useState("");
  const [savingsRaw, setSavingsRaw] = useState("");
  const [goldItems, setGoldItems] = useState<GoldItemInput[]>(() => [
    newGoldItem(),
  ]);
  const [silverItems, setSilverItems] = useState<SilverItemInput[]>(() => [
    newSilverItem(),
  ]);
  const [goldWeightRaw, setGoldWeightRaw] = useState<Record<string, string>>(
    {},
  );
  const [silverWeightRaw, setSilverWeightRaw] = useState<
    Record<string, string>
  >({});
  const [silverPurityRaw, setSilverPurityRaw] = useState<
    Record<string, string>
  >({});

  const [sharesRaw, setSharesRaw] = useState("");
  const [otherInvRaw, setOtherInvRaw] = useState("");
  const [cryptoRaw, setCryptoRaw] = useState("");
  const [inventoryRaw, setInventoryRaw] = useState("");
  const [otherRaw, setOtherRaw] = useState("");
  const [owedRaw, setOwedRaw] = useState("");
  const [liabilitiesRaw, setLiabilitiesRaw] = useState("");
  const [alreadyPaidRaw, setAlreadyPaidRaw] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const currencyInputId = useId();
  const nisabGroupId = useId();
  const priceUnitId = useId();

  const result = useMemo(() => {
    const mappedGold = goldItems.map((item) => ({
      ...item,
      weight: parseDecimal(goldWeightRaw[item.id] ?? "") ,
    }));
    const mappedSilver = silverItems.map((item) => ({
      ...item,
      weight: parseDecimal(silverWeightRaw[item.id] ?? ""),
      purityPercent:
        parseDecimal(silverPurityRaw[item.id] ?? "") ?? item.purityPercent,
    }));

    return calculateZakat({
      nisabBasis,
      useAltNisabWeights,
      customNisabAmount: parseDecimal(customNisabRaw),
      priceUnit,
      goldPrice: parseDecimal(goldPriceRaw),
      silverPrice: parseDecimal(silverPriceRaw),
      includePersonalJewellery,
      cashInHand: parseDecimal(cashRaw),
      bankBalances: parseDecimal(bankRaw),
      savings: parseDecimal(savingsRaw),
      goldItems: mappedGold,
      silverItems: mappedSilver,
      sharesTrading: parseDecimal(sharesRaw),
      otherInvestments: parseDecimal(otherInvRaw),
      cryptocurrency: parseDecimal(cryptoRaw),
      businessInventory: parseDecimal(inventoryRaw),
      otherZakatable: parseDecimal(otherRaw),
      moneyOwedToYou: parseDecimal(owedRaw),
      liabilities: parseDecimal(liabilitiesRaw),
      alreadyPaid: parseDecimal(alreadyPaidRaw),
    });
  }, [
    nisabBasis,
    useAltNisabWeights,
    customNisabRaw,
    priceUnit,
    goldPriceRaw,
    silverPriceRaw,
    includePersonalJewellery,
    cashRaw,
    bankRaw,
    savingsRaw,
    goldItems,
    silverItems,
    goldWeightRaw,
    silverWeightRaw,
    silverPurityRaw,
    sharesRaw,
    otherInvRaw,
    cryptoRaw,
    inventoryRaw,
    otherRaw,
    owedRaw,
    liabilitiesRaw,
    alreadyPaidRaw,
  ]);

  const money = (cents: number) => formatMoney(fromCents(cents), currencyId);

  function handleReset() {
    setCurrencyId("USD");
    setNisabBasis("silver");
    setUseAltNisabWeights(false);
    setCustomNisabRaw("");
    setPriceUnit("per_gram");
    setGoldPriceRaw("");
    setSilverPriceRaw("");
    setIncludePersonalJewellery(true);
    setCashRaw("");
    setBankRaw("");
    setSavingsRaw("");
    const g = newGoldItem();
    const s = newSilverItem();
    setGoldItems([g]);
    setSilverItems([s]);
    setGoldWeightRaw({});
    setSilverWeightRaw({});
    setSilverPurityRaw({});
    setSharesRaw("");
    setOtherInvRaw("");
    setCryptoRaw("");
    setInventoryRaw("");
    setOtherRaw("");
    setOwedRaw("");
    setLiabilitiesRaw("");
    setAlreadyPaidRaw("");
    setCopyStatus(null);
  }

  async function handleCopySummary() {
    if (!result.ok) {
      setCopyStatus("Nothing to copy yet.");
      return;
    }
    const lines = [
      "Zakat calculation summary (estimate only — not a religious ruling)",
      `Total assets: ${money(result.totalAssetsCents)}`,
      `Liabilities: ${money(result.liabilitiesCents)}`,
      `Net wealth: ${money(result.netWealthCents)}`,
      `Nisab value: ${money(result.nisabValueCents)} (${result.nisabBasis})`,
      `Reaches nisab: ${result.reachesNisab ? "yes" : "no"}`,
      `Zakat due (2.5%): ${money(result.zakatDueCents)}`,
      `Already paid: ${money(result.alreadyPaidCents)}`,
      `Remaining: ${money(result.remainingCents)}`,
      `Working: ${result.working}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("Summary copied.");
    } catch {
      setCopyStatus("Could not copy. Select the summary text instead.");
    }
  }

  function addGoldItem() {
    setGoldItems((prev) =>
      prev.length >= MAX_METAL_ITEMS ? prev : [...prev, newGoldItem()],
    );
  }

  function addSilverItem() {
    setSilverItems((prev) =>
      prev.length >= MAX_METAL_ITEMS ? prev : [...prev, newSilverItem()],
    );
  }

  const goldNisabLabel = useAltNisabWeights
    ? GOLD_NISAB_GRAMS_ALT
    : GOLD_NISAB_GRAMS_STANDARD;
  const silverNisabLabel = useAltNisabWeights
    ? SILVER_NISAB_GRAMS_ALT
    : SILVER_NISAB_GRAMS_STANDARD;

  const summaryPanel = (
    <SummaryPanel
      result={result}
      money={money}
      copyStatus={copyStatus}
      onCopy={handleCopySummary}
      onReset={handleReset}
    />
  );

  return (
    <div className="space-y-4">
      {/* Mobile compact summary — above the form, does not cover inputs */}
      <div className="lg:hidden">{summaryPanel}</div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="zakat-form-heading"
          className="flex flex-col gap-4 lg:col-span-7"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="zakat-form-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <HandCoins
                  className={`size-5 ${financeTheme.text}`}
                  aria-hidden="true"
                />
                Wealth details
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
              Your numbers stay in your browser. Nothing is stored or sent.
              Livestock, crops, minerals, zakat al-fitr and qurbani are not
              covered here.
            </p>

            {/* Settings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={currencyInputId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Currency (display only)
                </label>
                <select
                  id={currencyInputId}
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={priceUnitId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Metal price unit
                </label>
                <select
                  id={priceUnitId}
                  value={priceUnit}
                  onChange={(e) =>
                    setPriceUnit(e.target.value as PriceUnit)
                  }
                  className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                >
                  {PRICE_UNITS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-2 text-[12px] font-semibold text-zinc-700">
                Nisab basis
              </legend>
              <div
                role="radiogroup"
                aria-label="Nisab basis"
                className="flex flex-col gap-2"
              >
                {(
                  [
                    {
                      id: "silver" as const,
                      label: `Silver nisab (${silverNisabLabel} g)`,
                      note: "Includes more people; used by many scholars and organisations",
                    },
                    {
                      id: "gold" as const,
                      label: `Gold nisab (${goldNisabLabel} g)`,
                      note: "Higher threshold in most markets; some schools prefer gold",
                    },
                    {
                      id: "custom" as const,
                      label: "Custom nisab amount",
                      note: "Enter a value announced by a local authority or scholar",
                    },
                  ] as const
                ).map((option) => {
                  const selected = nisabBasis === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                        selected
                          ? "border-cat-finance/50 bg-cat-finance-soft"
                          : "border-border/80 bg-background hover:bg-stone-50"
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <input
                          type="radio"
                          name={nisabGroupId}
                          value={option.id}
                          checked={selected}
                          onChange={() => setNisabBasis(option.id)}
                          className="mt-1 size-4"
                        />
                        <span>
                          <span className="block text-[13px] font-semibold text-foreground">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-zinc-600">
                            {option.note}
                          </span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <label className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-zinc-700">
                <input
                  type="checkbox"
                  checked={useAltNisabWeights}
                  onChange={(e) => setUseAltNisabWeights(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border"
                  disabled={nisabBasis === "custom"}
                />
                <span>
                  Using {GOLD_NISAB_GRAMS_ALT} g / {SILVER_NISAB_GRAMS_ALT} g
                  instead (instead of {GOLD_NISAB_GRAMS_STANDARD} g /{" "}
                  {SILVER_NISAB_GRAMS_STANDARD} g)
                </span>
              </label>
              {nisabBasis === "custom" ? (
                <div className="mt-3 flex flex-col gap-1.5">
                  <label
                    htmlFor="custom-nisab"
                    className="text-[12px] font-semibold text-zinc-700"
                  >
                    Custom nisab amount
                  </label>
                  <MoneyInput
                    id="custom-nisab"
                    value={customNisabRaw}
                    onChange={setCustomNisabRaw}
                  />
                </div>
              ) : null}
            </fieldset>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="gold-price"
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Price of 24 karat gold
                </label>
                <MoneyInput
                  id="gold-price"
                  value={goldPriceRaw}
                  onChange={setGoldPriceRaw}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="silver-price"
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Price of pure silver
                </label>
                <MoneyInput
                  id="silver-price"
                  value={silverPriceRaw}
                  onChange={setSilverPriceRaw}
                />
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Enter today’s market prices yourself. This calculator never
              fetches live prices. Zakat rate is fixed at{" "}
              {(ZAKAT_RATE * 100).toFixed(1)}% (not editable).
            </p>

            <Section title="Cash and savings" defaultOpen>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field
                  id="cash-hand"
                  label="Cash in hand"
                  value={cashRaw}
                  onChange={setCashRaw}
                />
                <Field
                  id="bank-balances"
                  label="Bank balances"
                  value={bankRaw}
                  onChange={setBankRaw}
                />
                <Field
                  id="savings"
                  label="Savings"
                  value={savingsRaw}
                  onChange={setSavingsRaw}
                />
              </div>
            </Section>

            <Section title="Gold" defaultOpen>
              <label className="mb-3 flex items-start gap-2 text-[13px] leading-relaxed text-zinc-700">
                <input
                  type="checkbox"
                  checked={includePersonalJewellery}
                  onChange={(e) =>
                    setIncludePersonalJewellery(e.target.checked)
                  }
                  className="mt-0.5 size-4 rounded border-border"
                />
                <span>
                  Include personal jewellery. Scholars differ. The Hanafi view
                  counts all gold jewellery; some other views exempt jewellery
                  worn regularly.
                </span>
              </label>
              <div className="flex flex-col gap-3">
                {goldItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/70 bg-background/70 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-foreground">
                        Gold item {index + 1}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove gold item ${index + 1}`}
                        onClick={() =>
                          setGoldItems((prev) =>
                            prev.length <= 1
                              ? [newGoldItem()]
                              : prev.filter((row) => row.id !== item.id),
                          )
                        }
                        className="inline-flex rounded-md p-1.5 text-zinc-600 transition hover:bg-stone-100 hover:text-foreground"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Field
                        id={`gold-w-${item.id}`}
                        label="Weight"
                        ariaLabel={`Gold item ${index + 1} weight`}
                        value={goldWeightRaw[item.id] ?? ""}
                        onChange={(value) =>
                          setGoldWeightRaw((prev) => ({
                            ...prev,
                            [item.id]: value,
                          }))
                        }
                      />
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`gold-u-${item.id}`}
                          className="text-[12px] font-semibold text-zinc-700"
                        >
                          Unit
                        </label>
                        <select
                          id={`gold-u-${item.id}`}
                          aria-label={`Gold item ${index + 1} unit`}
                          value={item.unit}
                          onChange={(e) =>
                            setGoldItems((prev) =>
                              prev.map((row) =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      unit: e.target.value as WeightUnit,
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-2 py-2.5 text-[14px] text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                        >
                          {WEIGHT_UNITS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`gold-k-${item.id}`}
                          className="text-[12px] font-semibold text-zinc-700"
                        >
                          Karat
                        </label>
                        <select
                          id={`gold-k-${item.id}`}
                          aria-label={`Gold item ${index + 1} karat`}
                          value={item.karat}
                          onChange={(e) =>
                            setGoldItems((prev) =>
                              prev.map((row) =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      karat: Number(e.target.value) as GoldKarat,
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-2 py-2.5 text-[14px] text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                        >
                          {GOLD_KARATS.map((k) => (
                            <option key={k} value={k}>
                              {k}K
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-end gap-2 pb-2 text-[12px] leading-snug text-zinc-700 sm:col-span-1">
                        <input
                          type="checkbox"
                          checked={item.personalJewellery}
                          onChange={(e) =>
                            setGoldItems((prev) =>
                              prev.map((row) =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      personalJewellery: e.target.checked,
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="size-4 rounded border-border"
                          aria-label={`Gold item ${index + 1} personal jewellery worn regularly`}
                        />
                        <span>Personal jewellery worn regularly</span>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGoldItem}
                  disabled={goldItems.length >= MAX_METAL_ITEMS}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border/80 bg-background px-3 py-2 text-[13px] font-semibold text-foreground transition hover:border-cat-finance/45 hover:bg-cat-finance-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add gold item
                </button>
              </div>
            </Section>

            <Section title="Silver" defaultOpen>
              <div className="flex flex-col gap-3">
                {silverItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/70 bg-background/70 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-foreground">
                        Silver item {index + 1}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove silver item ${index + 1}`}
                        onClick={() =>
                          setSilverItems((prev) =>
                            prev.length <= 1
                              ? [newSilverItem()]
                              : prev.filter((row) => row.id !== item.id),
                          )
                        }
                        className="inline-flex rounded-md p-1.5 text-zinc-600 transition hover:bg-stone-100 hover:text-foreground"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Field
                        id={`silver-w-${item.id}`}
                        label="Weight"
                        ariaLabel={`Silver item ${index + 1} weight`}
                        value={silverWeightRaw[item.id] ?? ""}
                        onChange={(value) =>
                          setSilverWeightRaw((prev) => ({
                            ...prev,
                            [item.id]: value,
                          }))
                        }
                      />
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`silver-u-${item.id}`}
                          className="text-[12px] font-semibold text-zinc-700"
                        >
                          Unit
                        </label>
                        <select
                          id={`silver-u-${item.id}`}
                          aria-label={`Silver item ${index + 1} unit`}
                          value={item.unit}
                          onChange={(e) =>
                            setSilverItems((prev) =>
                              prev.map((row) =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      unit: e.target.value as WeightUnit,
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-2 py-2.5 text-[14px] text-foreground outline-none focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                        >
                          {WEIGHT_UNITS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field
                        id={`silver-p-${item.id}`}
                        label="Purity %"
                        ariaLabel={`Silver item ${index + 1} purity percent`}
                        value={
                          silverPurityRaw[item.id] ??
                          String(item.purityPercent ?? 100)
                        }
                        onChange={(value) =>
                          setSilverPurityRaw((prev) => ({
                            ...prev,
                            [item.id]: value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSilverItem}
                  disabled={silverItems.length >= MAX_METAL_ITEMS}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border/80 bg-background px-3 py-2 text-[13px] font-semibold text-foreground transition hover:border-cat-finance/45 hover:bg-cat-finance-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add silver item
                </button>
              </div>
            </Section>

            <Section title="Investments and business" defaultOpen>
              <p className="mb-3 text-[12px] leading-relaxed text-zinc-600">
                Rulings differ for long-term investments and retirement funds.
                Ask your scholar.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  id="shares"
                  label="Shares and funds held for trading (market value)"
                  value={sharesRaw}
                  onChange={setSharesRaw}
                />
                <Field
                  id="other-inv"
                  label="Other investments (market value)"
                  value={otherInvRaw}
                  onChange={setOtherInvRaw}
                />
                <Field
                  id="crypto"
                  label="Cryptocurrency (market value)"
                  value={cryptoRaw}
                  onChange={setCryptoRaw}
                />
                <Field
                  id="inventory"
                  label="Business inventory or goods for sale"
                  value={inventoryRaw}
                  onChange={setInventoryRaw}
                />
                <Field
                  id="other-assets"
                  label="Other zakatable assets"
                  value={otherRaw}
                  onChange={setOtherRaw}
                />
              </div>
            </Section>

            <Section title="Money owed to you" defaultOpen>
              <Field
                id="owed"
                label="Money you expect to receive soon"
                value={owedRaw}
                onChange={setOwedRaw}
              />
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                Include loans you gave that are likely to be recovered.
              </p>
            </Section>

            <Section title="Liabilities" defaultOpen>
              <Field
                id="liabilities"
                label="Debts and bills due now or within 12 months"
                value={liabilitiesRaw}
                onChange={setLiabilitiesRaw}
              />
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                Views differ on which debts to deduct.
              </p>
            </Section>

            <Section title="Already paid" defaultOpen>
              <Field
                id="already-paid"
                label="Zakat already paid for this year"
                value={alreadyPaidRaw}
                onChange={setAlreadyPaidRaw}
              />
            </Section>
          </div>
        </section>

        {/* Desktop sticky summary */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-6">{summaryPanel}</div>
        </aside>
      </div>
    </div>
  );
}

function SummaryPanel({
  result,
  money,
  copyStatus,
  onCopy,
  onReset,
}: {
  result: ReturnType<typeof calculateZakat>;
  money: (cents: number) => string;
  copyStatus: string | null;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <section
      aria-labelledby="zakat-summary-heading"
      aria-live="polite"
      aria-atomic="true"
      className="flex min-h-[16rem] flex-col gap-4 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h2
          id="zakat-summary-heading"
          className="text-[15px] font-semibold text-foreground"
        >
          Summary
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="ui-label inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition hover:bg-stone-50"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            Copy summary
          </button>
          <button
            type="button"
            onClick={onReset}
            className="ui-label inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800 lg:hidden"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {!result.ok ? (
        <p className="text-[15px] leading-relaxed text-zinc-700">
          {result.message ||
            "Enter your figures and metal prices to see an estimate."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[12px] font-semibold text-muted">Zakat due</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {money(result.zakatDueCents)}
            </p>
            <p className="mt-1 text-[13px] text-zinc-700">
              Remaining to pay:{" "}
              <span className="font-semibold tabular-nums">
                {money(result.remainingCents)}
              </span>
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SummaryStat label="Total assets" value={money(result.totalAssetsCents)} />
            <SummaryStat
              label="Liabilities"
              value={money(result.liabilitiesCents)}
            />
            <SummaryStat label="Net wealth" value={money(result.netWealthCents)} />
            <SummaryStat
              label={`Nisab (${result.nisabBasis}${
                result.nisabMetalGrams
                  ? `, ${result.nisabMetalGrams} g`
                  : ""
              })`}
              value={money(result.nisabValueCents)}
            />
          </dl>

          <p className="text-[13px] leading-relaxed text-zinc-700">
            {result.reachesNisab
              ? "Net wealth reaches the nisab."
              : "Net wealth is below the nisab, so zakat due is zero in this estimate."}
          </p>
          <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
            {result.working}
          </p>

          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="min-w-[16rem] w-full border-collapse text-left text-[13px]">
              <caption className="sr-only">
                Asset breakdown by category
              </caption>
              <thead>
                <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
                  <th scope="col" className="px-3 py-2">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Cash and savings", result.categories.cashAndSavings],
                    ["Gold", result.categories.gold],
                    ["Silver", result.categories.silver],
                    [
                      "Investments and business",
                      result.categories.investmentsAndBusiness,
                    ],
                    ["Money owed to you", result.categories.moneyOwed],
                    ["Other", result.categories.other],
                  ] as const
                ).map(([label, cents]) => (
                  <tr key={label} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-foreground">{label}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">
                      {money(cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[12px] leading-relaxed text-zinc-600">
            Zakat is due on wealth held for a full lunar year (about 354 days)
            above the nisab. Use the value of your assets on your zakat date.
          </p>
          <p className="text-[12px] leading-relaxed text-zinc-600">
            This calculator provides general information and estimates only. It
            is not a religious ruling. Zakat rules vary by school of thought and
            by circumstance, so please ask a qualified scholar.
          </p>
        </div>
      )}

      {copyStatus ? (
        <p className="text-[12px] text-zinc-600" role="status">
          {copyStatus}
        </p>
      ) : null}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-border/70 bg-background/50"
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 text-[14px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="border-t border-border/60 px-3 py-3">{children}</div>
    </details>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-zinc-700">
        {label}
      </label>
      <MoneyInput
        id={id}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
    />
  );
}
