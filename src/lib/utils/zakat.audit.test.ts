/**
 * QA / Islamic-finance logic audit for the zakat wealth engine.
 * Asserts the documented calculation model (not a madhhab fatwa):
 * net = assets − liabilities; if net ≥ nisab then zakat = 2.5% of net.
 */
import { describe, expect, it } from "vitest";
import { fromCents, toCents } from "@/lib/utils/money";
import {
  GOLD_NISAB_GRAMS_ALT,
  GOLD_NISAB_GRAMS_STANDARD,
  SILVER_NISAB_GRAMS_ALT,
  SILVER_NISAB_GRAMS_STANDARD,
  ZAKAT_RATE,
  calculateZakat,
  getNisabGrams,
  priceToPerGram,
  pureGoldGrams,
  type ZakatInput,
} from "@/lib/utils/zakat";

function base(overrides: Partial<ZakatInput> = {}): ZakatInput {
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

describe("audit: rate and nisab constants", () => {
  it("zakat rate is exactly 2.5% (1/40)", () => {
    expect(ZAKAT_RATE).toBe(0.025);
    expect(ZAKAT_RATE).toBeCloseTo(1 / 40, 12);
  });

  it("documents both common weight pairs (87.48/612.36 and 85/595)", () => {
    expect(GOLD_NISAB_GRAMS_STANDARD).toBe(87.48);
    expect(SILVER_NISAB_GRAMS_STANDARD).toBe(612.36);
    expect(GOLD_NISAB_GRAMS_ALT).toBe(85);
    expect(SILVER_NISAB_GRAMS_ALT).toBe(595);
    expect(getNisabGrams("gold", false)).toBe(87.48);
    expect(getNisabGrams("silver", false)).toBe(612.36);
    expect(getNisabGrams("gold", true)).toBe(85);
    expect(getNisabGrams("silver", true)).toBe(595);
  });
});

describe("audit edge 1: wealth exactly at vs just below nisab", () => {
  const silverPerGram = 2;
  const standardNisab = SILVER_NISAB_GRAMS_STANDARD * silverPerGram; // 1224.72
  const altNisab = SILVER_NISAB_GRAMS_ALT * silverPerGram; // 1190

  it("just below standard silver nisab → zakat 0", () => {
    const below = Number((standardNisab - 0.01).toFixed(2)); // 1224.71
    const r = calculateZakat(
      base({ cashInHand: below, silverPrice: silverPerGram }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.nisabValueCents)).toBeCloseTo(1224.72, 2);
    expect(r.reachesNisab).toBe(false);
    expect(r.zakatDueCents).toBe(0);
  });

  it("exactly at standard silver nisab → reaches, zakat = 2.5% of net", () => {
    const r = calculateZakat(
      base({ cashInHand: standardNisab, silverPrice: silverPerGram }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reachesNisab).toBe(true);
    expect(r.netWealthCents).toBe(r.nisabValueCents);
    expect(r.zakatDueCents).toBe(Math.round(r.netWealthCents * ZAKAT_RATE));
    expect(fromCents(r.zakatDueCents)).toBeCloseTo(30.62, 2);
  });

  it("one cent above nisab still pays 2.5% of full net (not surplus only)", () => {
    // Classical wealth-zakat model once nisab is met: 2.5% of the whole net pot.
    const r = calculateZakat(
      base({ cashInHand: 1224.73, silverPrice: silverPerGram }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reachesNisab).toBe(true);
    expect(r.zakatDueCents).toBe(Math.round(122473 * 0.025));
    // Must NOT equal 2.5% of (net − nisab) only:
    const surplusOnly = Math.round((122473 - 122472) * 0.025);
    expect(r.zakatDueCents).not.toBe(surplusOnly);
  });

  it("85 g / 595 g silver nisab threshold behaves the same way", () => {
    const below = calculateZakat(
      base({
        useAltNisabWeights: true,
        cashInHand: altNisab - 0.01,
        silverPrice: silverPerGram,
      }),
    );
    const at = calculateZakat(
      base({
        useAltNisabWeights: true,
        cashInHand: altNisab,
        silverPrice: silverPerGram,
      }),
    );
    expect(below.ok && below.reachesNisab).toBe(false);
    expect(below.ok && below.zakatDueCents).toBe(0);
    expect(at.ok && at.reachesNisab).toBe(true);
    expect(at.ok && fromCents(at.nisabValueCents)).toBe(1190);
    expect(at.ok && fromCents(at.zakatDueCents)).toBeCloseTo(29.75, 2);
  });

  it("gold 85 g alt nisab at 100/g → threshold 8,500", () => {
    const r = calculateZakat(
      base({
        nisabBasis: "gold",
        useAltNisabWeights: true,
        goldPrice: 100,
        silverPrice: null,
        cashInHand: 8500,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nisabMetalGrams).toBe(85);
    expect(fromCents(r.nisabValueCents)).toBe(8500);
    expect(r.reachesNisab).toBe(true);
    expect(fromCents(r.zakatDueCents)).toBe(212.5);
  });
});

describe("audit edge 2: mixed assets − liabilities before nisab", () => {
  it("cash + gold jewellery + business stock − debts, silver nisab", () => {
    // Cash/savings 5,000; 50 g of 24k gold @ 80/g = 4,000;
    // business inventory 6,000; liabilities 2,000 → net 13,000
    // silver nisab @ 2/g = 1,224.72 → above; zakat = 325.00
    const r = calculateZakat(
      base({
        cashInHand: 2000,
        bankBalances: 2000,
        savings: 1000,
        goldPrice: 80,
        silverPrice: 2,
        businessInventory: 6000,
        liabilities: 2000,
        goldItems: [
          {
            id: "j1",
            weight: 50,
            unit: "gram",
            karat: 24,
            personalJewellery: true,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.categories.cashAndSavings)).toBe(5000);
    expect(fromCents(r.categories.gold)).toBe(4000);
    expect(fromCents(r.categories.investmentsAndBusiness)).toBe(6000);
    expect(fromCents(r.totalAssetsCents)).toBe(15000);
    expect(fromCents(r.liabilitiesCents)).toBe(2000);
    expect(fromCents(r.netWealthCents)).toBe(13000);
    expect(r.reachesNisab).toBe(true);
    expect(fromCents(r.zakatDueCents)).toBe(325);
  });

  it("debts that pull net below nisab → zakat 0", () => {
    const r = calculateZakat(
      base({
        cashInHand: 2000,
        liabilities: 900,
        silverPrice: 2, // nisab 1224.72; net 1100
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.netWealthCents)).toBe(1100);
    expect(r.reachesNisab).toBe(false);
    expect(r.zakatDueCents).toBe(0);
  });

  it("liabilities exceeding assets clamp net to 0 (never negative zakat)", () => {
    const r = calculateZakat(
      base({
        cashInHand: 500,
        liabilities: 2000,
        silverPrice: 2,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.netWealthCents).toBe(0);
    expect(r.zakatDueCents).toBe(0);
    expect(r.remainingCents).toBe(0);
  });

  it("category cents always sum to totalAssetsCents", () => {
    const r = calculateZakat(
      base({
        cashInHand: 111.11,
        bankBalances: 222.22,
        savings: 333.33,
        goldPrice: 70,
        silverPrice: 2.5,
        sharesTrading: 444.44,
        otherInvestments: 55.55,
        cryptocurrency: 66.66,
        businessInventory: 77.77,
        otherZakatable: 88.88,
        moneyOwedToYou: 99.99,
        goldItems: [
          {
            id: "g",
            weight: 12.5,
            unit: "gram",
            karat: 22,
            personalJewellery: false,
          },
        ],
        silverItems: [
          { id: "s", weight: 100, unit: "gram", purityPercent: 92.5 },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sum =
      r.categories.cashAndSavings +
      r.categories.gold +
      r.categories.silver +
      r.categories.investmentsAndBusiness +
      r.categories.moneyOwed +
      r.categories.other;
    expect(sum).toBe(r.totalAssetsCents);
  });

  it("exempt personal assets are outside the engine (no residence/vehicle fields)", () => {
    // Sanity: only zakatable inputs exist; omitting home/car means they never inflate assets.
    const keys = Object.keys(base()) as (keyof ZakatInput)[];
    expect(keys.join(" ")).not.toMatch(/residence|vehicle|car|home|furniture/i);
  });
});

describe("audit edge 3: floating-point / currency precision", () => {
  it("cent helpers avoid classic 0.1+0.2 drift in totals", () => {
    const r = calculateZakat(
      base({
        cashInHand: 0.1,
        bankBalances: 0.2,
        silverPrice: 2,
        nisabBasis: "custom",
        customNisabAmount: 0.01,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 0.1 + 0.2 in IEEE float is 0.30000000000000004; cents path must yield 30.
    expect(r.categories.cashAndSavings).toBe(30);
    expect(fromCents(r.netWealthCents)).toBe(0.3);
    expect(r.zakatDueCents).toBe(Math.round(30 * 0.025)); // 1 cent
  });

  it("2.5% of awkward nets rounds half-up via Math.round on cents", () => {
    // 33.33 → 3333 cents × 0.025 = 83.325 → 83 cents = 0.83
    const r = calculateZakat(
      base({
        nisabBasis: "custom",
        customNisabAmount: 1,
        cashInHand: 33.33,
        silverPrice: null,
        goldPrice: null,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.zakatDueCents).toBe(83);
  });

  it("price per tola converts to per-gram before valuing metal", () => {
    const perTola = 1166.4; // → 100 per gram
    expect(priceToPerGram(perTola, "per_tola")).toBeCloseTo(100, 10);
    const r = calculateZakat(
      base({
        nisabBasis: "custom",
        customNisabAmount: 1,
        priceUnit: "per_tola",
        goldPrice: perTola,
        silverPrice: null,
        goldItems: [
          {
            id: "1",
            weight: 10,
            unit: "gram",
            karat: 24,
            personalJewellery: false,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(fromCents(r.categories.gold)).toBe(1000);
  });

  it("tiny multi-item gold holdings round from total pure grams, not per row", () => {
    const items = [
      {
        id: "a",
        weight: 0.00004,
        unit: "gram" as const,
        karat: 24 as const,
        personalJewellery: false,
      },
      {
        id: "b",
        weight: 0.00004,
        unit: "gram" as const,
        karat: 24 as const,
        personalJewellery: false,
      },
    ];
    const r = calculateZakat(
      base({
        nisabBasis: "custom",
        customNisabAmount: 1,
        goldPrice: 100,
        silverPrice: null,
        goldItems: items,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Per-item toCents would yield 0+0; aggregate pure×price yields 1 cent.
    expect(r.categories.gold).toBe(1);
  });

  it("multi-item gold valuation matches aggregate pure grams × price (no cent leak)", () => {
    const price = 70;
    const items = [
      {
        id: "a",
        weight: 3.33,
        unit: "gram" as const,
        karat: 22 as const,
        personalJewellery: false,
      },
      {
        id: "b",
        weight: 7.77,
        unit: "gram" as const,
        karat: 18 as const,
        personalJewellery: false,
      },
      {
        id: "c",
        weight: 1.11,
        unit: "gram" as const,
        karat: 14 as const,
        personalJewellery: false,
      },
    ];
    const pureTotal = items.reduce(
      (sum, item) => sum + pureGoldGrams(item.weight, item.unit, item.karat),
      0,
    );
    const expectedCents = toCents(pureTotal * price);

    const r = calculateZakat(
      base({
        nisabBasis: "custom",
        customNisabAmount: 1,
        goldPrice: price,
        silverPrice: null,
        goldItems: items,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.goldPureGrams).toBeCloseTo(pureTotal, 10);
    expect(r.categories.gold).toBe(expectedCents);
  });

  it("never returns NaN or Infinity in success paths", () => {
    const r = calculateZakat(
      base({
        cashInHand: 99999.99,
        savings: 0.01,
        liabilities: 0.01,
        silverPrice: 1.234567,
        goldPrice: 88.88,
        goldItems: [
          {
            id: "1",
            weight: 0.001,
            unit: "troy_oz",
            karat: 21,
            personalJewellery: false,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const n of [
      r.totalAssetsCents,
      r.netWealthCents,
      r.nisabValueCents,
      r.zakatDueCents,
      r.remainingCents,
    ]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(Number.isNaN(n)).toBe(false);
    }
  });
});

describe("audit: jewellery inclusion toggle (scholarly difference)", () => {
  it("excluding personal jewellery can drop net below nisab", () => {
    const shared = {
      nisabBasis: "custom" as const,
      customNisabAmount: 3000,
      goldPrice: 100,
      silverPrice: null as null,
      cashInHand: 500,
      goldItems: [
        {
          id: "worn",
          weight: 40,
          unit: "gram" as const,
          karat: 24 as const,
          personalJewellery: true,
        },
      ],
    };
    const included = calculateZakat(
      base({ ...shared, includePersonalJewellery: true }),
    );
    const excluded = calculateZakat(
      base({ ...shared, includePersonalJewellery: false }),
    );
    expect(included.ok && fromCents(included.netWealthCents)).toBe(4500);
    expect(included.ok && included.reachesNisab).toBe(true);
    expect(excluded.ok && fromCents(excluded.netWealthCents)).toBe(500);
    expect(excluded.ok && excluded.reachesNisab).toBe(false);
    expect(excluded.ok && excluded.zakatDueCents).toBe(0);
  });
});
