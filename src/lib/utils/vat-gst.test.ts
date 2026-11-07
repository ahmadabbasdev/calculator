import { describe, expect, it } from "vitest";
import {
  calculateVatGst,
  roundMoneyHalfUp,
  splitTaxEvenly,
} from "@/lib/utils/vat-gst";

describe("calculateVatGst — hand-checked cases", () => {
  it("adds 18% to 1,000", () => {
    const r = calculateVatGst({
      mode: "add",
      net: 1000,
      gross: null,
      ratePercent: 18,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tax).toBe(180);
    expect(r.gross).toBe(1180);
    expect(r.working).toContain("180.00");
  });

  it("removes 18% from 1,180", () => {
    const r = calculateVatGst({
      mode: "remove",
      net: null,
      gross: 1180,
      ratePercent: 18,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.net).toBe(1000);
    expect(r.tax).toBe(180);
  });

  it("adds 5% to 99.99 with half-up tax 5.00", () => {
    const r = calculateVatGst({
      mode: "add",
      net: 99.99,
      gross: null,
      ratePercent: 5,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tax).toBe(5);
    expect(r.gross).toBe(104.99);
  });

  it("removes 5% from 104.99 back to 99.99", () => {
    const r = calculateVatGst({
      mode: "remove",
      net: null,
      gross: 104.99,
      ratePercent: 5,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.net).toBe(99.99);
    expect(r.tax).toBe(5);
  });

  it("removes 20% from 120", () => {
    const r = calculateVatGst({
      mode: "remove",
      net: null,
      gross: 120,
      ratePercent: 20,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.net).toBe(100);
    expect(r.tax).toBe(20);
  });

  it("removes 7.5% from 107.50", () => {
    const r = calculateVatGst({
      mode: "remove",
      net: null,
      gross: 107.5,
      ratePercent: 7.5,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.net).toBe(100);
    expect(r.tax).toBe(7.5);
  });

  it("finds the rate from net 250 and gross 287.50", () => {
    const r = calculateVatGst({
      mode: "find-rate",
      net: 250,
      gross: 287.5,
      ratePercent: null,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ratePercent).toBe(15);
    expect(r.tax).toBe(37.5);
  });

  it("handles 0% rate with tax 0", () => {
    const r = calculateVatGst({
      mode: "add",
      net: 1000,
      gross: null,
      ratePercent: 0,
      splitTax: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tax).toBe(0);
    expect(r.gross).toBe(1000);
  });

  it("splits tax into parts that sum exactly", () => {
    expect(splitTaxEvenly(180)).toEqual({ partA: 90, partB: 90 });
    const odd = splitTaxEvenly(0.05);
    expect(roundMoneyHalfUp(odd.partA + odd.partB)).toBe(0.05);
  });

  it("round-trips add-then-remove and remove-then-add within 0.01", () => {
    const net = 99.99;
    const rate = 5;
    const added = calculateVatGst({
      mode: "add",
      net,
      gross: null,
      ratePercent: rate,
      splitTax: false,
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const removed = calculateVatGst({
      mode: "remove",
      net: null,
      gross: added.gross,
      ratePercent: rate,
      splitTax: false,
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(Math.abs(removed.net - net)).toBeLessThanOrEqual(0.01);

    const gross = 104.99;
    const rem = calculateVatGst({
      mode: "remove",
      net: null,
      gross,
      ratePercent: rate,
      splitTax: false,
    });
    expect(rem.ok).toBe(true);
    if (!rem.ok) return;
    const addBack = calculateVatGst({
      mode: "add",
      net: rem.net,
      gross: null,
      ratePercent: rate,
      splitTax: false,
    });
    expect(addBack.ok).toBe(true);
    if (!addBack.ok) return;
    expect(Math.abs(addBack.gross - gross)).toBeLessThanOrEqual(0.01);
  });

  it("blocks negative prices and out-of-range rates", () => {
    const neg = calculateVatGst({
      mode: "add",
      net: -10,
      gross: null,
      ratePercent: 10,
      splitTax: false,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative_price");

    const rate = calculateVatGst({
      mode: "add",
      net: 100,
      gross: null,
      ratePercent: 101,
      splitTax: false,
    });
    expect(rate.ok).toBe(false);
    if (!rate.ok) expect(rate.error).toBe("rate_out_of_range");
  });

  it("returns empty state when inputs are missing", () => {
    const r = calculateVatGst({
      mode: "add",
      net: null,
      gross: null,
      ratePercent: 18,
      splitTax: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("empty");
  });
});
