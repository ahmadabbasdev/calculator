import { describe, expect, it } from "vitest";
import {
  calculateProfitMargin,
  marginToMarkup,
  markupToMargin,
} from "@/lib/utils/profit-margin";

describe("calculateProfitMargin", () => {
  it("from cost and price: cost 60, price 100", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profit).toBe(40);
    expect(result.marginPercent).toBe(40);
    expect(result.markupPercent).toBe(66.67);
  });

  it("price from margin: cost 80, margin 20%", () => {
    const result = calculateProfitMargin({
      mode: "price-from-margin",
      cost: 80,
      price: null,
      marginPercent: 20,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.price).toBe(100);
    expect(result.profit).toBe(20);
    expect(result.markupPercent).toBe(25);
  });

  it("price from markup: cost 80, markup 25%", () => {
    const result = calculateProfitMargin({
      mode: "price-from-markup",
      cost: 80,
      price: null,
      marginPercent: null,
      markupPercent: 25,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.price).toBe(100);
    expect(result.marginPercent).toBe(20);
  });

  it("cost from price and margin: price 100, margin 30%", () => {
    const result = calculateProfitMargin({
      mode: "cost-from-margin",
      cost: null,
      price: 100,
      marginPercent: 30,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cost).toBe(70);
  });

  it("converts margin 20% to markup 25% and markup 50% to margin 33.33%", () => {
    const toMarkup = marginToMarkup(20);
    expect(toMarkup.ok).toBe(true);
    if (toMarkup.ok) expect(toMarkup.markupPercent).toBe(25);

    const toMargin = markupToMargin(50);
    expect(toMargin.ok).toBe(true);
    if (toMargin.ok) expect(toMargin.marginPercent).toBe(33.33);
  });

  it("allows a loss: cost 120, price 100", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 120,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profit).toBe(-20);
    expect(result.marginPercent).toBe(-20);
    expect(result.markupPercent).toBe(-16.67);
  });

  it("scales totals for 250 units at cost 60 and price 100", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: 250,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalRevenue).toBe(25000);
    expect(result.totalCost).toBe(15000);
    expect(result.totalProfit).toBe(10000);
  });

  it("applies marketplace fee percent and fixed fee", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: 10,
      fixedFee: 1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.netRevenue).toBe(89);
    expect(result.profit).toBe(29);
    expect(result.marginPercent).toBe(29);
    expect(result.markupPercent).toBe(48.33);
  });

  it("blocks margin of 100% or more in price and cost modes", () => {
    const fromMargin = calculateProfitMargin({
      mode: "price-from-margin",
      cost: 80,
      price: null,
      marginPercent: 100,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(fromMargin.ok).toBe(false);
    if (!fromMargin.ok) expect(fromMargin.error).toBe("margin_too_high");

    const fromPrice = calculateProfitMargin({
      mode: "cost-from-margin",
      cost: null,
      price: 100,
      marginPercent: 100,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(fromPrice.ok).toBe(false);
    if (!fromPrice.ok) expect(fromPrice.error).toBe("margin_too_high");
  });

  it("reports margin undefined when price is 0", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 0,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("margin_undefined");
  });

  it("blocks negative inputs", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: -10,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("negative");
  });

  it("returns empty for missing required fields", () => {
    const result = calculateProfitMargin({
      mode: "from-cost-price",
      cost: null,
      price: null,
      marginPercent: null,
      markupPercent: null,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("empty");
  });

  it("rejects a number too large to display and ignores timezone", () => {
    const huge = calculateProfitMargin({
      mode: "price-from-markup",
      cost: Number.MAX_VALUE,
      price: null,
      marginPercent: null,
      markupPercent: 50,
      units: null,
      feePercent: null,
      fixedFee: null,
    });
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.error).toBe("invalid");

    const before = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";
    const a = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: 250,
      feePercent: 10,
      fixedFee: 1,
    });
    process.env.TZ = "America/New_York";
    const b = calculateProfitMargin({
      mode: "from-cost-price",
      cost: 60,
      price: 100,
      marginPercent: null,
      markupPercent: null,
      units: 250,
      feePercent: 10,
      fixedFee: 1,
    });
    process.env.TZ = before;
    expect(a).toEqual(b);
  });
});
