import { describe, expect, it } from "vitest";
import {
  GRAMS_PER_MASHA,
  GRAMS_PER_TOLA,
  GRAMS_PER_TROY_OUNCE,
  calculateGoldValue,
  calculateJewelleryPrice,
  calculateOldGoldValue,
  karatPurityTable,
  karatToPurityPercent,
  priceToPerGram,
  weightToGrams,
} from "./gold-value";

describe("gold-value constants and conversions", () => {
  it("defines tola, masha, ratti and troy ounce in grams", () => {
    expect(GRAMS_PER_TOLA).toBeCloseTo(11.664, 10);
    expect(GRAMS_PER_MASHA).toBeCloseTo(0.972, 10);
    expect(GRAMS_PER_MASHA / 8).toBeCloseTo(0.1215, 10);
    expect(GRAMS_PER_TROY_OUNCE).toBeCloseTo(31.1034768, 10);
  });

  it("6 masha = 5.832 g", () => {
    expect(weightToGrams(6, "masha")).toBeCloseTo(5.832, 10);
  });

  it("2,332.80 per tola equals 200 per gram", () => {
    expect(priceToPerGram(2332.8, "per_tola")).toBeCloseTo(200, 10);
  });

  it("6,220.70 per troy ounce is about 200 per gram", () => {
    expect(priceToPerGram(6220.7, "per_troy_oz")).toBeCloseTo(200, 2);
  });

  it("builds karat → purity rows from karat ÷ 24", () => {
    const rows = karatPurityTable();
    expect(rows.find((r) => r.karat === 22)?.purityPercent).toBeCloseTo(
      karatToPurityPercent(22),
      10,
    );
    expect(rows.find((r) => r.karat === 18)?.fraction).toBeCloseTo(0.75, 10);
  });
});

describe("jewellery price hand-checks (24K = 200 / g)", () => {
  const base22k10g = {
    weight: 10 as number | null,
    weightUnit: "gram" as const,
    stoneWeightGrams: null as number | null,
    purityMode: "karat" as const,
    karat: 22 as number | null,
    customPurityPercent: null as number | null,
    price24k: 200 as number | null,
    priceUnit: "per_gram" as const,
    makingMode: "none" as const,
    makingValue: null as number | null,
    wastagePercent: 0 as number | null,
    taxPercent: 0 as number | null,
    taxBase: "gold_wastage_making" as const,
  };

  it("10 g of 22K → pure 9.1667 g, value 1,833.33", () => {
    const r = calculateJewelleryPrice(base22k10g);
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.pureGoldGrams).toBeCloseTo(9.1667, 4);
    expect(r.goldValue).toBeCloseTo(1833.33, 2);
    expect(r.totalPrice).toBeCloseTo(1833.33, 2);
  });

  it("making 8% → 146.67; total 1,980.00", () => {
    const r = calculateJewelleryPrice({
      ...base22k10g,
      makingMode: "percent_of_gold",
      makingValue: 8,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.makingCharges).toBeCloseTo(146.67, 2);
    expect(r.totalPrice).toBeCloseTo(1980, 2);
  });

  it("3% tax on subtotal → 59.40; total 2,039.40", () => {
    const r = calculateJewelleryPrice({
      ...base22k10g,
      makingMode: "percent_of_gold",
      makingValue: 8,
      taxPercent: 3,
      taxBase: "gold_wastage_making",
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.taxAmount).toBeCloseTo(59.4, 2);
    expect(r.totalPrice).toBeCloseTo(2039.4, 2);
  });

  it("3% tax on making only → 4.40; total 1,984.40", () => {
    const r = calculateJewelleryPrice({
      ...base22k10g,
      makingMode: "percent_of_gold",
      makingValue: 8,
      taxPercent: 3,
      taxBase: "making_only",
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.taxAmount).toBeCloseTo(4.4, 2);
    expect(r.totalPrice).toBeCloseTo(1984.4, 2);
  });

  it("1 tola of 22K at 2,332.80/tola with making 100/g", () => {
    const r = calculateJewelleryPrice({
      weight: 1,
      weightUnit: "tola",
      stoneWeightGrams: null,
      purityMode: "karat",
      karat: 22,
      customPurityPercent: null,
      price24k: 2332.8,
      priceUnit: "per_tola",
      makingMode: "per_gram",
      makingValue: 100,
      wastagePercent: 0,
      taxPercent: 0,
      taxBase: "gold_wastage_making",
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.pureGoldGrams).toBeCloseTo(10.692, 3);
    expect(r.goldValue).toBeCloseTo(2138.4, 2);
    expect(r.makingCharges).toBeCloseTo(1166.4, 2);
    expect(r.totalPrice).toBeCloseTo(3304.8, 2);
  });

  it("gross 12 g with 2 g stones at 18K → net 10, pure 7.5, value 1,500", () => {
    const r = calculateJewelleryPrice({
      ...base22k10g,
      weight: 12,
      stoneWeightGrams: 2,
      karat: 18,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.netWeightGrams).toBeCloseTo(10, 10);
    expect(r.pureGoldGrams).toBeCloseTo(7.5, 10);
    expect(r.goldValue).toBeCloseTo(1500, 2);
  });

  it("custom purity 91.6% on 10 g → 9.16 g, value 1,832", () => {
    const r = calculateJewelleryPrice({
      ...base22k10g,
      purityMode: "custom",
      karat: null,
      customPurityPercent: 91.6,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "jewellery") return;
    expect(r.pureGoldGrams).toBeCloseTo(9.16, 10);
    expect(r.goldValue).toBeCloseTo(1832, 2);
  });
});

describe("old gold value", () => {
  it("10 g of 22K with 5% dealer deduction → 1,741.67", () => {
    const r = calculateOldGoldValue({
      weight: 10,
      weightUnit: "gram",
      purityMode: "karat",
      karat: 22,
      customPurityPercent: null,
      price24k: 200,
      priceUnit: "per_gram",
      dealerDeductionPercent: 5,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "old-gold") return;
    expect(r.estimatedValue).toBeCloseTo(1741.67, 2);
  });
});

describe("edge cases", () => {
  it("blocks stone weight above gross, negatives, and empty inputs", () => {
    const stone = calculateJewelleryPrice({
      weight: 10,
      weightUnit: "gram",
      stoneWeightGrams: 12,
      purityMode: "karat",
      karat: 22,
      customPurityPercent: null,
      price24k: 200,
      priceUnit: "per_gram",
      makingMode: "none",
      makingValue: null,
      wastagePercent: 0,
      taxPercent: 0,
      taxBase: "gold_wastage_making",
    });
    expect(stone.ok).toBe(false);
    if (!stone.ok) expect(stone.error).toBe("stone_weight");

    const neg = calculateGoldValue({
      mode: "jewellery",
      weight: -1,
      weightUnit: "gram",
      purityMode: "karat",
      karat: 22,
      customPurityPercent: null,
      price24k: 200,
      priceUnit: "per_gram",
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const empty = calculateGoldValue({
      mode: "old-gold",
      weight: null,
      weightUnit: "gram",
      purityMode: "karat",
      karat: 22,
      customPurityPercent: null,
      price24k: null,
      priceUnit: "per_gram",
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");
  });
});
