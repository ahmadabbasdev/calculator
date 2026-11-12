import { describe, expect, it } from "vitest";
import {
  buildLifetimeView,
  calculateSolar,
  productionReferenceRow,
  yearSavings,
  yieldPerKw,
} from "./solar";

describe("size system hand-checks", () => {
  it("7,300 kWh, 5 sun, 20% losses, 100% share, 500 W → 5 kW / 10 panels", () => {
    const result = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.yieldPerKw).toBe(1460);
    expect(result.neededKw).toBeCloseTo(5, 10);
    expect(result.panelCount).toBe(10);
    expect(result.installedKw).toBeCloseTo(5, 10);
    expect(result.annualProductionKwh).toBeCloseTo(7300, 10);
    expect(result.systemCost).toBeCloseTo(4000, 10);
    expect(result.year1Savings).toBeCloseTo(1460, 10);
    expect(result.simplePaybackYears).toBeCloseTo(2.74, 2);
    expect(Number(result.simplePaybackYears!.toFixed(2))).toBe(2.74);
    expect(result.roofAreaM2).toBeCloseTo(22, 10);
  });

  it("same with 50% share → 2.5 kW / 5 panels", () => {
    const result = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 50,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.neededKw).toBeCloseTo(2.5, 10);
    expect(result.panelCount).toBe(5);
    expect(result.annualProductionKwh).toBeCloseTo(3650, 10);
    expect(result.systemCost).toBeCloseTo(2000, 10);
    expect(result.year1Savings).toBeCloseTo(730, 10);
    expect(Number(result.simplePaybackYears!.toFixed(2))).toBe(2.74);
  });

  it("monthly 500 kWh with excess value 0% and 50%", () => {
    const base = {
      mode: "size" as const,
      useKwh: 500,
      usePeriod: "month" as const,
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    };
    const zero = calculateSolar({ ...base, excessValuePercent: 0 });
    expect(zero.ok).toBe(true);
    if (!zero.ok) return;
    expect(zero.annualUseKwh).toBe(6000);
    expect(zero.neededKw).toBeCloseTo(4.1096, 4);
    expect(zero.panelCount).toBe(9);
    expect(zero.installedKw).toBeCloseTo(4.5, 10);
    expect(zero.annualProductionKwh).toBeCloseTo(6570, 10);
    expect(zero.usedOnSiteKwh).toBeCloseTo(6000, 10);
    expect(zero.excessKwh).toBeCloseTo(570, 10);
    expect(zero.year1Savings).toBeCloseTo(1200, 10);

    const half = calculateSolar({ ...base, excessValuePercent: 50 });
    expect(half.ok).toBe(true);
    if (!half.ok) return;
    expect(half.year1Savings).toBeCloseTo(1257, 10);
  });
});

describe("lifetime view", () => {
  it("no degradation / price increase over 25 years", () => {
    const life = buildLifetimeView({
      year1Savings: 1460,
      systemCost: 4000,
      lifetimeYears: 25,
      degradationFraction: 0,
      priceIncreaseFraction: 0,
    });
    expect(life.lifetimeSavings).toBeCloseTo(36500, 10);
    expect(life.lifetimeNet).toBeCloseTo(32500, 10);
  });

  it("1% degradation: year savings and payback 2.76", () => {
    expect(yearSavings(1460, 1, 0.01, 0)).toBeCloseTo(1460, 10);
    expect(yearSavings(1460, 2, 0.01, 0)).toBeCloseTo(1445.4, 10);
    expect(yearSavings(1460, 3, 0.01, 0)).toBeCloseTo(1430.95, 2);

    const result = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 1,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.yearRows[0]!.savings).toBeCloseTo(1460, 10);
    expect(result.yearRows[1]!.savings).toBeCloseTo(1445.4, 10);
    expect(result.yearRows[2]!.savings).toBeCloseTo(1430.95, 2);
    expect(Number(result.paybackYearInterpolated!.toFixed(2))).toBe(2.76);
  });
});

describe("edge cases / TZ", () => {
  it("missing price leaves money fields empty; missing sun is empty state", () => {
    const noPrice = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: null,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(noPrice.ok).toBe(true);
    if (!noPrice.ok) return;
    expect(noPrice.year1Savings).toBeNull();
    expect(noPrice.simplePaybackYears).toBeNull();
    // cost still available when cost/watt entered
    expect(noPrice.systemCost).toBeCloseTo(4000, 10);

    const noCost = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: null,
      pricePerKwh: 0.2,
      costPerWatt: null,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(noCost.ok).toBe(true);
    if (!noCost.ok) return;
    expect(noCost.systemCost).toBeNull();
    expect(noCost.simplePaybackYears).toBeNull();
    expect(noCost.year1Savings).toBeCloseTo(1460, 10);

    const noSun = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: null,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: null,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(noSun.ok).toBe(false);
    if (!noSun.ok) expect(noSun.error).toBe("empty");
  });

  it("negatives blocked; never NaN/Infinity; TZ stable", () => {
    const neg = calculateSolar({
      mode: "size",
      useKwh: -1,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: null,
      pricePerKwh: null,
      costPerWatt: null,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const ok = calculateSolar({
      mode: "size",
      useKwh: 7300,
      usePeriod: "year",
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(Number.isFinite(ok.installedKw)).toBe(true);
    expect(Number.isFinite(ok.annualProductionKwh)).toBe(true);

    const input = {
      mode: "size" as const,
      useKwh: 7300,
      usePeriod: "year" as const,
      sunHours: 5,
      lossesPercent: 20,
      sharePercent: 100,
      panelWatts: 500,
      panelAreaM2: 2.2,
      pricePerKwh: 0.2,
      costPerWatt: 0.8,
      excessValuePercent: 0,
      degradationPercent: 0,
      priceIncreasePercent: 0,
      lifetimeYears: 25,
    };
    const a = calculateSolar(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateSolar(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateSolar(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("produce mode and reference helper use same yield", () => {
    expect(yieldPerKw(5, 0.2)).toBe(1460);
    const produced = calculateSolar({
      mode: "produce",
      sizeMode: "kw",
      systemKw: 5,
      panelCount: null,
      panelWatts: 500,
      sunHours: 5,
      lossesPercent: 20,
      pricePerKwh: 0.2,
    });
    expect(produced.ok).toBe(true);
    if (!produced.ok) return;
    expect(produced.annualProductionKwh).toBeCloseTo(7300, 10);
    expect(produced.year1Savings).toBeCloseTo(1460, 10);

    const row = productionReferenceRow(5, 5, 20);
    expect(row.annualProductionKwh).toBeCloseTo(7300, 10);
  });
});
