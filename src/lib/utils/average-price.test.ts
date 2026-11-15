import { describe, expect, it } from "vitest";
import {
  applyBuyMore,
  calculateAveragePrice,
  requiredPriceForTarget,
  weightedAverageFromRows,
} from "./average-price";

const baseRows = [
  { quantity: 10, price: 100, fee: null },
  { quantity: 20, price: 85, fee: null },
];

describe("weighted average hand-checks", () => {
  it("10 at 100 and 20 at 85 → qty 30, cost 2,700, average 90", () => {
    const base = weightedAverageFromRows(baseRows, false);
    expect("ok" in base).toBe(false);
    if ("ok" in base) return;
    expect(base.totalQuantity).toBeCloseTo(30, 10);
    expect(base.totalCost).toBeCloseTo(2700, 10);
    expect(base.averagePrice).toBeCloseTo(90, 10);
  });

  it("add 30 at 70 → qty 60, cost 4,800, average 80", () => {
    const base = weightedAverageFromRows(baseRows, false);
    if ("ok" in base) return;
    const more = applyBuyMore(base, 30, 70);
    expect("ok" in more).toBe(false);
    if ("ok" in more) return;
    expect(more.totalQuantity).toBeCloseTo(60, 10);
    expect(more.totalCost).toBeCloseTo(4800, 10);
    expect(more.averagePrice).toBeCloseTo(80, 10);
  });

  it("target 85 with 30 extra from base → required price 80", () => {
    const base = weightedAverageFromRows(baseRows, false);
    if ("ok" in base) return;
    const target = requiredPriceForTarget(base, 85, 30);
    expect(target.ok).toBe(true);
    if (!target.ok) return;
    expect(target.requiredPrice).toBeCloseTo(80, 10);
  });

  it("fees 10 and 20 → cost 2,730, average 91", () => {
    const base = weightedAverageFromRows(
      [
        { quantity: 10, price: 100, fee: 10 },
        { quantity: 20, price: 85, fee: 20 },
      ],
      true,
    );
    expect("ok" in base).toBe(false);
    if ("ok" in base) return;
    expect(base.totalCost).toBeCloseTo(2730, 10);
    expect(base.averagePrice).toBeCloseTo(91, 10);
  });

  it("current price 95 on base → value 2,850, gain 150 = 5.56%", () => {
    const result = calculateAveragePrice({
      rows: baseRows,
      includeFees: false,
      buyMoreQuantity: null,
      buyMorePrice: null,
      targetAverage: null,
      targetExtraQuantity: null,
      currentPrice: 95,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.mark) return;
    expect(result.mark.marketValue).toBeCloseTo(2850, 10);
    expect(result.mark.difference).toBeCloseTo(150, 10);
    expect(Number(result.mark.percentVsCost.toFixed(2))).toBe(5.56);
  });

  it("target above average with higher required price is valid", () => {
    const base = weightedAverageFromRows(baseRows, false);
    if ("ok" in base) return;
    const target = requiredPriceForTarget(base, 95, 30);
    expect(target.ok).toBe(true);
    if (!target.ok) return;
    expect(target.requiredPrice).toBeCloseTo(100, 10);
    expect(target.requiredPrice).toBeGreaterThan(base.averagePrice);
  });

  it("target that needs a negative price returns unreachable", () => {
    const base = weightedAverageFromRows(baseRows, false);
    if ("ok" in base) return;
    const target = requiredPriceForTarget(base, 10, 30);
    expect(target.ok).toBe(false);
    if (target.ok) return;
    expect(target.error).toBe("unreachable");
  });

  it("zero-quantity rows ignored; negatives blocked; TZ stable", () => {
    const withZero = weightedAverageFromRows(
      [
        { quantity: 0, price: 50, fee: null },
        { quantity: 10, price: 100, fee: null },
        { quantity: 20, price: 85, fee: null },
      ],
      false,
    );
    expect("ok" in withZero).toBe(false);
    if ("ok" in withZero) return;
    expect(withZero.averagePrice).toBeCloseTo(90, 10);

    const neg = calculateAveragePrice({
      rows: [{ quantity: -1, price: 10, fee: null }],
      includeFees: false,
      buyMoreQuantity: null,
      buyMorePrice: null,
      targetAverage: null,
      targetExtraQuantity: null,
      currentPrice: null,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const input = {
      rows: baseRows,
      includeFees: false,
      buyMoreQuantity: null,
      buyMorePrice: null,
      targetAverage: null,
      targetExtraQuantity: null,
      currentPrice: null,
    };
    const a = calculateAveragePrice(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateAveragePrice(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateAveragePrice(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});
