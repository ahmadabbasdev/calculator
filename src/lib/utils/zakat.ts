/**
 * Pure zakat wealth calculation aid.
 * All money math uses integer minor units (cents) so category totals add up.
 * Metal prices are user-supplied — never fetched.
 */

import { fromCents, toCents } from "@/lib/utils/money";

/** Grams in one tola (common South Asian jewellery unit). */
export const GRAMS_PER_TOLA = 11.664;

/** Grams in one troy ounce. */
export const GRAMS_PER_TROY_OUNCE = 31.1035;

/** Widely cited gold nisab weight (grams). */
export const GOLD_NISAB_GRAMS_STANDARD = 87.48;

/** Widely cited silver nisab weight (grams). */
export const SILVER_NISAB_GRAMS_STANDARD = 612.36;

/** Alternate gold nisab weight used by some organisations (grams). */
export const GOLD_NISAB_GRAMS_ALT = 85;

/** Alternate silver nisab weight used by some organisations (grams). */
export const SILVER_NISAB_GRAMS_ALT = 595;

export const ZAKAT_RATE = 0.025;

export const MAX_METAL_ITEMS = 20;

/** Soft cap on a single money field (major units). */
export const MAX_MONEY_AMOUNT = 1_000_000_000_000;

/** Soft cap on a single metal weight in its chosen unit. */
export const MAX_WEIGHT = 1_000_000;

export type WeightUnit = "gram" | "tola" | "troy_oz";

export type PriceUnit = "per_gram" | "per_tola" | "per_troy_oz";

export type NisabBasis = "silver" | "gold" | "custom";

export type GoldKarat = 24 | 22 | 21 | 18 | 14;

export const WEIGHT_UNITS: { id: WeightUnit; label: string }[] = [
  { id: "gram", label: "Grams" },
  { id: "tola", label: "Tola" },
  { id: "troy_oz", label: "Troy ounce" },
];

export const PRICE_UNITS: { id: PriceUnit; label: string }[] = [
  { id: "per_gram", label: "Per gram" },
  { id: "per_tola", label: "Per tola" },
  { id: "per_troy_oz", label: "Per troy ounce" },
];

export const GOLD_KARATS: GoldKarat[] = [24, 22, 21, 18, 14];

export type GoldItemInput = {
  id: string;
  weight: number | null;
  unit: WeightUnit;
  karat: GoldKarat;
  personalJewellery: boolean;
};

export type SilverItemInput = {
  id: string;
  weight: number | null;
  unit: WeightUnit;
  /** Purity percent, default 100. */
  purityPercent: number | null;
};

export type ZakatInput = {
  nisabBasis: NisabBasis;
  /** When true, use 85 g gold / 595 g silver instead of 87.48 / 612.36. */
  useAltNisabWeights: boolean;
  customNisabAmount: number | null;
  priceUnit: PriceUnit;
  goldPrice: number | null;
  silverPrice: number | null;
  includePersonalJewellery: boolean;
  cashInHand: number | null;
  bankBalances: number | null;
  savings: number | null;
  goldItems: GoldItemInput[];
  silverItems: SilverItemInput[];
  sharesTrading: number | null;
  otherInvestments: number | null;
  cryptocurrency: number | null;
  businessInventory: number | null;
  otherZakatable: number | null;
  moneyOwedToYou: number | null;
  liabilities: number | null;
  alreadyPaid: number | null;
};

export type CategoryCents = {
  cashAndSavings: number;
  gold: number;
  silver: number;
  investmentsAndBusiness: number;
  moneyOwed: number;
  other: number;
};

export type ZakatSuccess = {
  ok: true;
  totalAssetsCents: number;
  liabilitiesCents: number;
  netWealthCents: number;
  nisabValueCents: number;
  nisabBasis: NisabBasis;
  nisabMetalGrams: number | null;
  reachesNisab: boolean;
  zakatDueCents: number;
  alreadyPaidCents: number;
  remainingCents: number;
  categories: CategoryCents;
  working: string;
  goldPureGrams: number;
  silverPureGrams: number;
};

export type ZakatFailure = {
  ok: false;
  error:
    | "missing_gold_price"
    | "missing_silver_price"
    | "missing_custom_nisab"
    | "negative"
    | "overflow"
    | "invalid";
  message: string;
};

export type ZakatResult = ZakatSuccess | ZakatFailure;

export function weightToGrams(weight: number, unit: WeightUnit): number {
  if (unit === "gram") return weight;
  if (unit === "tola") return weight * GRAMS_PER_TOLA;
  return weight * GRAMS_PER_TROY_OUNCE;
}

export function priceToPerGram(price: number, unit: PriceUnit): number {
  if (unit === "per_gram") return price;
  if (unit === "per_tola") return price / GRAMS_PER_TOLA;
  return price / GRAMS_PER_TROY_OUNCE;
}

export function pureGoldGrams(weight: number, unit: WeightUnit, karat: GoldKarat): number {
  return weightToGrams(weight, unit) * (karat / 24);
}

export function pureSilverGrams(
  weight: number,
  unit: WeightUnit,
  purityPercent: number,
): number {
  return weightToGrams(weight, unit) * (purityPercent / 100);
}

export function getNisabGrams(
  basis: Exclude<NisabBasis, "custom">,
  useAlt: boolean,
): number {
  if (basis === "gold") {
    return useAlt ? GOLD_NISAB_GRAMS_ALT : GOLD_NISAB_GRAMS_STANDARD;
  }
  return useAlt ? SILVER_NISAB_GRAMS_ALT : SILVER_NISAB_GRAMS_STANDARD;
}

function moneyOrZero(value: number | null): number {
  if (value === null || value === undefined) return 0;
  return value;
}

function assertNonNegativeMoney(
  value: number | null,
  label: string,
): ZakatFailure | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "invalid",
      message: `Enter a valid number for ${label}.`,
    };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: `${label} cannot be negative.`,
    };
  }
  if (value > MAX_MONEY_AMOUNT) {
    return {
      ok: false,
      error: "overflow",
      message: `Keep ${label} at ${MAX_MONEY_AMOUNT.toLocaleString()} or below.`,
    };
  }
  return null;
}

function assertWeight(
  value: number | null,
  label: string,
): ZakatFailure | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) {
    return {
      ok: false,
      error: value !== null && value < 0 ? "negative" : "invalid",
      message:
        value !== null && value < 0
          ? `${label} cannot be negative.`
          : `Enter a valid weight for ${label}.`,
    };
  }
  if (value > MAX_WEIGHT) {
    return {
      ok: false,
      error: "overflow",
      message: `Keep ${label} at ${MAX_WEIGHT.toLocaleString()} or below.`,
    };
  }
  return null;
}

function formatMajorFromCents(cents: number): string {
  return fromCents(cents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate zakat on wealth from user-entered amounts and metal prices.
 */
export function calculateZakat(input: ZakatInput): ZakatResult {
  const moneyFields: [number | null, string][] = [
    [input.customNisabAmount, "custom nisab"],
    [input.goldPrice, "gold price"],
    [input.silverPrice, "silver price"],
    [input.cashInHand, "cash in hand"],
    [input.bankBalances, "bank balances"],
    [input.savings, "savings"],
    [input.sharesTrading, "shares and funds"],
    [input.otherInvestments, "other investments"],
    [input.cryptocurrency, "cryptocurrency"],
    [input.businessInventory, "business inventory"],
    [input.otherZakatable, "other zakatable assets"],
    [input.moneyOwedToYou, "money owed to you"],
    [input.liabilities, "debts and bills"],
    [input.alreadyPaid, "zakat already paid"],
  ];

  for (const [value, label] of moneyFields) {
    const err = assertNonNegativeMoney(value, label);
    if (err) return err;
  }

  const needsGoldPrice =
    input.nisabBasis === "gold" ||
    input.goldItems.some((item) => item.weight !== null && item.weight > 0);
  const needsSilverPrice =
    input.nisabBasis === "silver" ||
    input.silverItems.some((item) => item.weight !== null && item.weight > 0);

  if (input.nisabBasis === "custom") {
    if (input.customNisabAmount === null) {
      return {
        ok: false,
        error: "missing_custom_nisab",
        message: "Enter a custom nisab amount in your currency.",
      };
    }
  }

  if (needsGoldPrice && (input.goldPrice === null || input.goldPrice === undefined)) {
    return {
      ok: false,
      error: "missing_gold_price",
      message:
        "Enter the price of 24 karat gold (per gram, tola, or troy ounce) to continue.",
    };
  }

  if (
    needsSilverPrice &&
    (input.silverPrice === null || input.silverPrice === undefined)
  ) {
    return {
      ok: false,
      error: "missing_silver_price",
      message:
        "Enter the price of pure silver (per gram, tola, or troy ounce) to continue.",
    };
  }

  const goldPerGram =
    input.goldPrice !== null
      ? priceToPerGram(input.goldPrice, input.priceUnit)
      : 0;
  const silverPerGram =
    input.silverPrice !== null
      ? priceToPerGram(input.silverPrice, input.priceUnit)
      : 0;

  // Accumulate pure metal first, then convert to money once so sub-cent
  // per-item rounding cannot understate the combined holding.
  let goldPureGrams = 0;
  for (const [index, item] of input.goldItems.entries()) {
    const label = `gold item ${index + 1}`;
    const wErr = assertWeight(item.weight, label);
    if (wErr) return wErr;
    if (item.weight === null || item.weight === 0) continue;
    if (!input.includePersonalJewellery && item.personalJewellery) continue;
    goldPureGrams += pureGoldGrams(item.weight, item.unit, item.karat);
  }
  const goldValueCents =
    goldPureGrams > 0 ? toCents(goldPureGrams * goldPerGram) : 0;

  let silverPureGrams = 0;
  for (const [index, item] of input.silverItems.entries()) {
    const label = `silver item ${index + 1}`;
    const wErr = assertWeight(item.weight, label);
    if (wErr) return wErr;
    const purity = item.purityPercent ?? 100;
    if (!Number.isFinite(purity) || purity < 0 || purity > 100) {
      return {
        ok: false,
        error: "invalid",
        message: `Purity for silver item ${index + 1} must be between 0 and 100.`,
      };
    }
    if (item.weight === null || item.weight === 0) continue;
    silverPureGrams += pureSilverGrams(item.weight, item.unit, purity);
  }
  const silverValueCents =
    silverPureGrams > 0 ? toCents(silverPureGrams * silverPerGram) : 0;

  const cashCents = toCents(moneyOrZero(input.cashInHand));
  const bankCents = toCents(moneyOrZero(input.bankBalances));
  const savingsCents = toCents(moneyOrZero(input.savings));
  const cashAndSavings = cashCents + bankCents + savingsCents;

  const sharesCents = toCents(moneyOrZero(input.sharesTrading));
  const otherInvCents = toCents(moneyOrZero(input.otherInvestments));
  const cryptoCents = toCents(moneyOrZero(input.cryptocurrency));
  const inventoryCents = toCents(moneyOrZero(input.businessInventory));
  const investmentsAndBusiness =
    sharesCents + otherInvCents + cryptoCents + inventoryCents;

  const moneyOwed = toCents(moneyOrZero(input.moneyOwedToYou));
  const other = toCents(moneyOrZero(input.otherZakatable));

  const categories: CategoryCents = {
    cashAndSavings,
    gold: goldValueCents,
    silver: silverValueCents,
    investmentsAndBusiness,
    moneyOwed,
    other,
  };

  const totalAssetsCents =
    cashAndSavings +
    goldValueCents +
    silverValueCents +
    investmentsAndBusiness +
    moneyOwed +
    other;

  const liabilitiesCents = toCents(moneyOrZero(input.liabilities));
  const netWealthCents = Math.max(0, totalAssetsCents - liabilitiesCents);

  let nisabValueCents: number;
  let nisabMetalGrams: number | null = null;

  if (input.nisabBasis === "custom") {
    nisabValueCents = toCents(input.customNisabAmount!);
  } else if (input.nisabBasis === "gold") {
    nisabMetalGrams = getNisabGrams("gold", input.useAltNisabWeights);
    nisabValueCents = toCents(nisabMetalGrams * goldPerGram);
  } else {
    nisabMetalGrams = getNisabGrams("silver", input.useAltNisabWeights);
    nisabValueCents = toCents(nisabMetalGrams * silverPerGram);
  }

  const reachesNisab = netWealthCents >= nisabValueCents;
  const zakatDueCents = reachesNisab
    ? Math.round(netWealthCents * ZAKAT_RATE)
    : 0;
  const alreadyPaidCents = toCents(moneyOrZero(input.alreadyPaid));
  const remainingCents = Math.max(0, zakatDueCents - alreadyPaidCents);

  const working = reachesNisab
    ? `${formatMajorFromCents(netWealthCents)} × 2.5% = ${formatMajorFromCents(zakatDueCents)}`
    : `Net wealth is below the nisab (${formatMajorFromCents(nisabValueCents)}), so zakat due is 0.00`;

  return {
    ok: true,
    totalAssetsCents,
    liabilitiesCents,
    netWealthCents,
    nisabValueCents,
    nisabBasis: input.nisabBasis,
    nisabMetalGrams,
    reachesNisab,
    zakatDueCents,
    alreadyPaidCents,
    remainingCents,
    categories,
    working,
    goldPureGrams,
    silverPureGrams,
  };
}
