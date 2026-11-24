/**
 * Gold jewellery value arithmetic from user-entered 24K prices.
 * No live quotes, history, or predictions — pure math only.
 */

export const GRAMS_PER_TOLA = 11.664;
export const GRAMS_PER_MASHA = GRAMS_PER_TOLA / 12; // 0.972
export const GRAMS_PER_RATTI = GRAMS_PER_MASHA / 8; // 0.1215
export const GRAMS_PER_TROY_OUNCE = 31.1034768;

export const STANDARD_KARATS = [24, 22, 21, 20, 18, 14, 10, 9] as const;
export type StandardKarat = (typeof STANDARD_KARATS)[number];

export type GoldWeightUnit = "gram" | "tola" | "masha" | "troy_oz";
export type GoldPriceUnit = "per_gram" | "per_tola" | "per_troy_oz";

export type MakingChargeMode =
  | "none"
  | "percent_of_gold"
  | "per_gram"
  | "fixed_total";

export type TaxBase = "gold_wastage_making" | "making_only";

export type GoldPurityMode = "karat" | "custom";

export type GoldMode = "jewellery" | "old-gold";

export type KaratPurityRow = {
  karat: StandardKarat;
  purityPercent: number;
  fraction: number;
};

export type JewellerySuccess = {
  ok: true;
  mode: "jewellery";
  netWeightGrams: number;
  pureGoldGrams: number;
  goldValue: number;
  wastageAmount: number;
  makingCharges: number;
  taxAmount: number;
  subtotalBeforeTax: number;
  totalPrice: number;
  effectivePerGram: number;
  pricePerGram24k: number;
  purityPercent: number;
  working: string;
};

export type OldGoldSuccess = {
  ok: true;
  mode: "old-gold";
  netWeightGrams: number;
  pureGoldGrams: number;
  grossValue: number;
  dealerDeductionAmount: number;
  estimatedValue: number;
  pricePerGram24k: number;
  purityPercent: number;
  working: string;
};

export type GoldValueFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid"
    | "negative"
    | "stone_weight"
    | "purity"
    | "making"
    | "tax";
  message: string;
};

export type GoldValueResult =
  | JewellerySuccess
  | OldGoldSuccess
  | GoldValueFailure;

export const WEIGHT_UNITS: { id: GoldWeightUnit; label: string }[] = [
  { id: "gram", label: "Grams" },
  { id: "tola", label: "Tola" },
  { id: "masha", label: "Masha" },
  { id: "troy_oz", label: "Troy ounce" },
];

export const PRICE_UNITS: { id: GoldPriceUnit; label: string }[] = [
  { id: "per_gram", label: "Per gram" },
  { id: "per_tola", label: "Per tola" },
  { id: "per_troy_oz", label: "Per troy ounce" },
];

export const MAKING_MODES: { id: MakingChargeMode; label: string }[] = [
  { id: "none", label: "None" },
  { id: "percent_of_gold", label: "% of gold value" },
  { id: "per_gram", label: "Fixed per gram" },
  { id: "fixed_total", label: "Fixed total" },
];

export const TAX_BASES: { id: TaxBase; label: string }[] = [
  { id: "gold_wastage_making", label: "Gold + wastage + making" },
  { id: "making_only", label: "Making charges only" },
];

/** Round half-up to `digits` decimal places. */
export function roundMoney(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** digits;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function karatToPurityPercent(karat: number): number {
  return (karat / 24) * 100;
}

export function karatPurityTable(): KaratPurityRow[] {
  return STANDARD_KARATS.map((karat) => ({
    karat,
    purityPercent: karatToPurityPercent(karat),
    fraction: karat / 24,
  }));
}

export function weightToGrams(
  weight: number,
  unit: GoldWeightUnit,
): number {
  if (unit === "gram") return weight;
  if (unit === "tola") return weight * GRAMS_PER_TOLA;
  if (unit === "masha") return weight * GRAMS_PER_MASHA;
  return weight * GRAMS_PER_TROY_OUNCE;
}

export function priceToPerGram(
  price: number,
  unit: GoldPriceUnit,
): number {
  if (unit === "per_gram") return price;
  if (unit === "per_tola") return price / GRAMS_PER_TOLA;
  return price / GRAMS_PER_TROY_OUNCE;
}

function resolvePurityPercent(input: {
  purityMode: GoldPurityMode;
  karat: number | null;
  customPurityPercent: number | null;
}): { ok: true; purityPercent: number } | GoldValueFailure {
  if (input.purityMode === "karat") {
    if (input.karat === null) {
      return {
        ok: false,
        error: "empty",
        message: "Choose a karat or enter a custom purity percent.",
      };
    }
    if (!Number.isFinite(input.karat) || input.karat <= 0 || input.karat > 24) {
      return {
        ok: false,
        error: "purity",
        message: "Karat must be greater than 0 and at most 24.",
      };
    }
    return { ok: true, purityPercent: karatToPurityPercent(input.karat) };
  }

  if (input.customPurityPercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a custom purity percent.",
    };
  }
  if (
    !Number.isFinite(input.customPurityPercent) ||
    input.customPurityPercent < 0 ||
    input.customPurityPercent > 100
  ) {
    return {
      ok: false,
      error: "purity",
      message: "Custom purity must be between 0 and 100%.",
    };
  }
  return { ok: true, purityPercent: input.customPurityPercent };
}

function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Jewellery price: gold value + wastage + making + tax from the user's 24K price.
 */
export function calculateJewelleryPrice(input: {
  weight: number | null;
  weightUnit: GoldWeightUnit;
  stoneWeightGrams: number | null;
  purityMode: GoldPurityMode;
  karat: number | null;
  customPurityPercent: number | null;
  price24k: number | null;
  priceUnit: GoldPriceUnit;
  makingMode: MakingChargeMode;
  makingValue: number | null;
  wastagePercent: number | null;
  taxPercent: number | null;
  taxBase: TaxBase;
}): GoldValueResult {
  const {
    weight,
    weightUnit,
    stoneWeightGrams,
    purityMode,
    karat,
    customPurityPercent,
    price24k,
    priceUnit,
    makingMode,
    makingValue,
    wastagePercent,
    taxPercent,
    taxBase,
  } = input;

  if (weight === null || price24k === null) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter the jewellery weight and your 24K gold price to see a total.",
    };
  }

  if (!Number.isFinite(weight) || !Number.isFinite(price24k)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for weight and 24K price.",
    };
  }

  if (weight < 0 || price24k < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Weight and 24K price cannot be negative.",
    };
  }

  if (weight === 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Weight must be greater than zero.",
    };
  }

  const stone = stoneWeightGrams ?? 0;
  if (!Number.isFinite(stone) || stone < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Stone or other weight must be zero or more.",
    };
  }

  const grossGrams = weightToGrams(weight, weightUnit);
  if (!Number.isFinite(grossGrams) || grossGrams <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Converted weight must be greater than zero.",
    };
  }

  if (stone > grossGrams) {
    return {
      ok: false,
      error: "stone_weight",
      message:
        "Deducted stone or other weight cannot exceed the gross jewellery weight.",
    };
  }

  const purity = resolvePurityPercent({
    purityMode,
    karat,
    customPurityPercent,
  });
  if (!purity.ok) return purity;

  const wastage = wastagePercent ?? 0;
  const tax = taxPercent ?? 0;
  if (!Number.isFinite(wastage) || wastage < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Wastage percent must be zero or more.",
    };
  }
  if (!Number.isFinite(tax) || tax < 0) {
    return {
      ok: false,
      error: "tax",
      message: "Tax percent must be zero or more.",
    };
  }

  const pricePerGram24k = priceToPerGram(price24k, priceUnit);
  if (!Number.isFinite(pricePerGram24k) || pricePerGram24k < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Converted 24K price per gram is not valid.",
    };
  }

  const netWeightGrams = grossGrams - stone;
  if (netWeightGrams <= 0) {
    return {
      ok: false,
      error: "stone_weight",
      message: "Net gold weight must be greater than zero after deductions.",
    };
  }

  const pureGoldGrams = netWeightGrams * (purity.purityPercent / 100);
  const goldValue = pureGoldGrams * pricePerGram24k;
  const wastageAmount = goldValue * (wastage / 100);

  let makingCharges = 0;
  if (makingMode === "none") {
    makingCharges = 0;
  } else {
    if (makingValue === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter making charges for the selected making mode.",
      };
    }
    if (!Number.isFinite(makingValue) || makingValue < 0) {
      return {
        ok: false,
        error: "making",
        message: "Making charges cannot be negative.",
      };
    }
    if (makingMode === "percent_of_gold") {
      makingCharges = goldValue * (makingValue / 100);
    } else if (makingMode === "per_gram") {
      makingCharges = makingValue * netWeightGrams;
    } else {
      makingCharges = makingValue;
    }
  }

  const subtotalBeforeTax = goldValue + wastageAmount + makingCharges;
  const taxBaseAmount =
    taxBase === "making_only" ? makingCharges : subtotalBeforeTax;
  const taxAmount = taxBaseAmount * (tax / 100);
  const totalPrice = subtotalBeforeTax + taxAmount;
  const effectivePerGram = totalPrice / netWeightGrams;

  if (
    !Number.isFinite(goldValue) ||
    !Number.isFinite(totalPrice) ||
    !Number.isFinite(effectivePerGram)
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  return {
    ok: true,
    mode: "jewellery",
    netWeightGrams,
    pureGoldGrams,
    goldValue,
    wastageAmount,
    makingCharges,
    taxAmount,
    subtotalBeforeTax,
    totalPrice,
    effectivePerGram,
    pricePerGram24k,
    purityPercent: purity.purityPercent,
    working: `Net ${formatNum(netWeightGrams, 4)} g × ${formatNum(purity.purityPercent, 4)}% purity → ${formatNum(pureGoldGrams, 4)} g pure × ${formatNum(pricePerGram24k, 4)}/g = ${formatNum(goldValue, 2)}; + wastage ${formatNum(wastageAmount, 2)} + making ${formatNum(makingCharges, 2)} + tax ${formatNum(taxAmount, 2)} = ${formatNum(totalPrice, 2)}.`,
  };
}

/**
 * Value of old gold: pure grams × 24K price, optional dealer deduction %.
 */
export function calculateOldGoldValue(input: {
  weight: number | null;
  weightUnit: GoldWeightUnit;
  purityMode: GoldPurityMode;
  karat: number | null;
  customPurityPercent: number | null;
  price24k: number | null;
  priceUnit: GoldPriceUnit;
  dealerDeductionPercent: number | null;
}): GoldValueResult {
  const {
    weight,
    weightUnit,
    purityMode,
    karat,
    customPurityPercent,
    price24k,
    priceUnit,
    dealerDeductionPercent,
  } = input;

  if (weight === null || price24k === null) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter the weight and your 24K gold price to estimate old-gold value.",
    };
  }

  if (!Number.isFinite(weight) || !Number.isFinite(price24k)) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter valid numbers for weight and 24K price.",
    };
  }

  if (weight < 0 || price24k < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Weight and 24K price cannot be negative.",
    };
  }

  if (weight === 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Weight must be greater than zero.",
    };
  }

  const purity = resolvePurityPercent({
    purityMode,
    karat,
    customPurityPercent,
  });
  if (!purity.ok) return purity;

  const deduction = dealerDeductionPercent ?? 0;
  if (!Number.isFinite(deduction) || deduction < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Dealer deduction percent must be zero or more.",
    };
  }
  if (deduction > 100) {
    return {
      ok: false,
      error: "invalid",
      message: "Dealer deduction percent cannot exceed 100%.",
    };
  }

  const netWeightGrams = weightToGrams(weight, weightUnit);
  if (!Number.isFinite(netWeightGrams) || netWeightGrams <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Converted weight must be greater than zero.",
    };
  }

  const pricePerGram24k = priceToPerGram(price24k, priceUnit);
  const pureGoldGrams = netWeightGrams * (purity.purityPercent / 100);
  const grossValue = pureGoldGrams * pricePerGram24k;
  const dealerDeductionAmount = grossValue * (deduction / 100);
  const estimatedValue = grossValue - dealerDeductionAmount;

  if (!Number.isFinite(estimatedValue)) {
    return {
      ok: false,
      error: "invalid",
      message: "That combination produces a number too large to display.",
    };
  }

  return {
    ok: true,
    mode: "old-gold",
    netWeightGrams,
    pureGoldGrams,
    grossValue,
    dealerDeductionAmount,
    estimatedValue,
    pricePerGram24k,
    purityPercent: purity.purityPercent,
    working: `${formatNum(netWeightGrams, 4)} g × ${formatNum(purity.purityPercent, 4)}% → ${formatNum(pureGoldGrams, 4)} g pure × ${formatNum(pricePerGram24k, 4)}/g = ${formatNum(grossValue, 2)}${deduction > 0 ? `; minus ${formatNum(deduction, 2)}% deduction = ${formatNum(estimatedValue, 2)}` : ""}.`,
  };
}

export function calculateGoldValue(input: {
  mode: GoldMode;
  weight: number | null;
  weightUnit: GoldWeightUnit;
  stoneWeightGrams?: number | null;
  purityMode: GoldPurityMode;
  karat: number | null;
  customPurityPercent: number | null;
  price24k: number | null;
  priceUnit: GoldPriceUnit;
  makingMode?: MakingChargeMode;
  makingValue?: number | null;
  wastagePercent?: number | null;
  taxPercent?: number | null;
  taxBase?: TaxBase;
  dealerDeductionPercent?: number | null;
}): GoldValueResult {
  if (input.mode === "jewellery") {
    return calculateJewelleryPrice({
      weight: input.weight,
      weightUnit: input.weightUnit,
      stoneWeightGrams: input.stoneWeightGrams ?? null,
      purityMode: input.purityMode,
      karat: input.karat,
      customPurityPercent: input.customPurityPercent,
      price24k: input.price24k,
      priceUnit: input.priceUnit,
      makingMode: input.makingMode ?? "none",
      makingValue: input.makingValue ?? null,
      wastagePercent: input.wastagePercent ?? null,
      taxPercent: input.taxPercent ?? null,
      taxBase: input.taxBase ?? "gold_wastage_making",
    });
  }
  return calculateOldGoldValue({
    weight: input.weight,
    weightUnit: input.weightUnit,
    purityMode: input.purityMode,
    karat: input.karat,
    customPurityPercent: input.customPurityPercent,
    price24k: input.price24k,
    priceUnit: input.priceUnit,
    dealerDeductionPercent: input.dealerDeductionPercent ?? null,
  });
}
