import { describe, expect, it } from "vitest";
import { fromCents } from "@/lib/utils/money";
import {
  GOLD_NISAB_GRAMS_ALT,
  GOLD_NISAB_GRAMS_STANDARD,
  GRAMS_PER_TOLA,
  GRAMS_PER_TROY_OUNCE,
  SILVER_NISAB_GRAMS_ALT,
  SILVER_NISAB_GRAMS_STANDARD,
  calculateZakat,
  getNisabGrams,
  pureGoldGrams,
  pureSilverGrams,
  weightToGrams,
  type ZakatInput,
} from "@/lib/utils/zakat";

function baseInput(overrides: Partial<ZakatInput> = {}): ZakatInput {
  return {
    nisabBasis: "silver",
    useAltNisabWeights: false,
    customNisabAmount: null,
    priceUnit: "per_gram",
    goldPrice: null,
    silverPrice: 2,
    includePersonalJewellery: true,
    cashInHand: null,
    bankBalances: null,
    savings: null,
    goldItems: [],
    silverItems: [],
    sharesTrading: null,
    otherInvestments: null,
    cryptocurrency: null,
    businessInventory: null,
    otherZakatable: null,
    moneyOwedToYou: null,
    liabilities: null,
    alreadyPaid: null,
    ...overrides,
  };
}

describe("weight conversions", () => {
  it("7.5 tola = 87.48 g and 52.5 tola = 612.36 g", () => {
    expect(weightToGrams(7.5, "tola")).toBeCloseTo(87.48, 10);
    expect(weightToGrams(52.5, "tola")).toBeCloseTo(612.36, 10);
    expect(7.5 * GRAMS_PER_TOLA).toBeCloseTo(GOLD_NISAB_GRAMS_STANDARD, 10);
    expect(52.5 * GRAMS_PER_TOLA).toBeCloseTo(SILVER_NISAB_GRAMS_STANDARD, 10);
  });

  it("1 troy ounce = 31.1035 g within tolerance", () => {
    expect(weightToGrams(1, "troy_oz")).toBeCloseTo(GRAMS_PER_TROY_OUNCE, 10);
    expect(GRAMS_PER_TROY_OUNCE).toBeCloseTo(31.1035, 10);
  });
});

describe("nisab values", () => {
  it("silver price 2 per gram, silver nisab 612.36 g → 1,224.72", () => {
    const r = calculateZakat(
      baseInput({
        cashInHand: 0,
        silverPrice: 2,
        nisabBasis: "silver",
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.nisabValueCents)).toBeCloseTo(1224.72, 2);
  });

  it("gold price 100 per gram, gold nisab 87.48 g → 8,748.00", () => {
    const r = calculateZakat(
      baseInput({
        nisabBasis: "gold",
        goldPrice: 100,
        silverPrice: null,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.nisabValueCents)).toBe(8748);
  });

  it("85 g / 595 g option changes the nisab", () => {
    expect(getNisabGrams("gold", true)).toBe(GOLD_NISAB_GRAMS_ALT);
    expect(getNisabGrams("silver", true)).toBe(SILVER_NISAB_GRAMS_ALT);
    const silver = calculateZakat(
      baseInput({
        useAltNisabWeights: true,
        silverPrice: 2,
        cashInHand: 0,
      }),
    );
    expect(silver.ok).toBe(true);
    if (!silver.ok) return;
    expect(fromCents(silver.nisabValueCents)).toBeCloseTo(595 * 2, 2);
  });

  it("custom nisab overrides metal prices", () => {
    const r = calculateZakat(
      baseInput({
        nisabBasis: "custom",
        customNisabAmount: 5000,
        goldPrice: null,
        silverPrice: null,
        cashInHand: 10000,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.nisabValueCents)).toBe(5000);
    expect(fromCents(r.zakatDueCents)).toBe(250);
  });
});

describe("calculateZakat cash and thresholds", () => {
  it("cash 10,000 only, silver nisab at 2 per gram → zakat 250.00", () => {
    const r = calculateZakat(baseInput({ cashInHand: 10000, silverPrice: 2 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.netWealthCents)).toBe(10000);
    expect(r.reachesNisab).toBe(true);
    expect(fromCents(r.zakatDueCents)).toBe(250);
    expect(r.working).toContain("2.5%");
  });

  it("net wealth 1,000 with nisab 1,224.72 → zakat 0", () => {
    const r = calculateZakat(baseInput({ cashInHand: 1000, silverPrice: 2 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reachesNisab).toBe(false);
    expect(fromCents(r.zakatDueCents)).toBe(0);
  });

  it("net wealth exactly 1,224.72 reaches nisab, zakat 30.62", () => {
    const r = calculateZakat(
      baseInput({ cashInHand: 1224.72, silverPrice: 2 }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reachesNisab).toBe(true);
    expect(fromCents(r.nisabValueCents)).toBeCloseTo(1224.72, 2);
    expect(fromCents(r.zakatDueCents)).toBeCloseTo(30.62, 2);
  });

  it("assets 20,000 debts 5,000 above nisab → net 15,000 zakat 375", () => {
    const r = calculateZakat(
      baseInput({
        cashInHand: 20000,
        liabilities: 5000,
        silverPrice: 2,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.netWealthCents)).toBe(15000);
    expect(fromCents(r.zakatDueCents)).toBe(375);
  });

  it("already paid reduces remaining; overpayment → remaining 0", () => {
    const partial = calculateZakat(
      baseInput({
        cashInHand: 20000,
        liabilities: 5000,
        alreadyPaid: 100,
        silverPrice: 2,
      }),
    );
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(fromCents(partial.zakatDueCents)).toBe(375);
    expect(fromCents(partial.remainingCents)).toBe(275);

    const over = calculateZakat(
      baseInput({
        cashInHand: 20000,
        liabilities: 5000,
        alreadyPaid: 500,
        silverPrice: 2,
      }),
    );
    expect(over.ok).toBe(true);
    if (!over.ok) return;
    expect(fromCents(over.remainingCents)).toBe(0);
  });
});

describe("gold and silver items", () => {
  it("100 g of 22 karat gold at 70/g → value 6,416.67, zakat 160.42", () => {
    const pure = pureGoldGrams(100, "gram", 22);
    expect(pure).toBeCloseTo(91.6667, 4);
    const r = calculateZakat(
      baseInput({
        nisabBasis: "custom",
        customNisabAmount: 1,
        goldPrice: 70,
        silverPrice: null,
        goldItems: [
          {
            id: "1",
            weight: 100,
            unit: "gram",
            karat: 22,
            personalJewellery: false,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.categories.gold)).toBeCloseTo(6416.67, 2);
    expect(fromCents(r.zakatDueCents)).toBeCloseTo(160.42, 2);
  });

  it("1,000 g silver at 92.5% purity = 925 g pure", () => {
    expect(pureSilverGrams(1000, "gram", 92.5)).toBeCloseTo(925, 10);
    const r = calculateZakat(
      baseInput({
        silverPrice: 2,
        silverItems: [
          {
            id: "1",
            weight: 1000,
            unit: "gram",
            purityPercent: 92.5,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.silverPureGrams).toBeCloseTo(925, 6);
    expect(fromCents(r.categories.silver)).toBeCloseTo(1850, 2);
  });

  it("Include personal jewellery off removes marked items", () => {
    const withJewellery = calculateZakat(
      baseInput({
        nisabBasis: "custom",
        customNisabAmount: 1,
        goldPrice: 100,
        includePersonalJewellery: true,
        goldItems: [
          {
            id: "1",
            weight: 10,
            unit: "gram",
            karat: 24,
            personalJewellery: true,
          },
        ],
      }),
    );
    const without = calculateZakat(
      baseInput({
        nisabBasis: "custom",
        customNisabAmount: 1,
        goldPrice: 100,
        includePersonalJewellery: false,
        goldItems: [
          {
            id: "1",
            weight: 10,
            unit: "gram",
            karat: 24,
            personalJewellery: true,
          },
        ],
      }),
    );
    expect(withJewellery.ok && fromCents(withJewellery.categories.gold)).toBe(
      1000,
    );
    expect(without.ok && fromCents(without.categories.gold)).toBe(0);
  });
});

describe("missing prices and edges", () => {
  it("missing required silver price returns error, never a number", () => {
    const r = calculateZakat(
      baseInput({
        nisabBasis: "silver",
        silverPrice: null,
        cashInHand: 10000,
      }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("missing_silver_price");
  });

  it("missing gold price when gold items present returns error", () => {
    const r = calculateZakat(
      baseInput({
        nisabBasis: "custom",
        customNisabAmount: 100,
        goldPrice: null,
        silverPrice: null,
        goldItems: [
          {
            id: "1",
            weight: 5,
            unit: "gram",
            karat: 24,
            personalJewellery: false,
          },
        ],
      }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("missing_gold_price");
  });

  it("rejects negatives", () => {
    const r = calculateZakat(baseInput({ cashInHand: -10, silverPrice: 2 }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("negative");
  });
});
