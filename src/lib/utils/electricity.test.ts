import { describe, expect, it } from "vitest";
import {
  calculateElectricity,
  calculateTieredCharge,
  monthlyKwhReferenceRow,
  runningKwh,
  standbyKwh,
  wattsFromAmpsVolts,
} from "./electricity";

describe("single appliance hand-checks", () => {
  it("100 W, 5 h/day, 30 days, price 0.20 → 0.5/day, 15/month, cost 3.00 / 36.00", () => {
    const result = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: 100,
      amps: null,
      volts: null,
      hoursPerDay: 5,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: 0.2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "appliance") return;
    expect(result.kwhPerDay).toBeCloseTo(0.5, 10);
    expect(result.kwhPerMonth).toBeCloseTo(15, 10);
    expect(result.kwhPerYear).toBeCloseTo(180, 10);
    expect(result.costPerMonth).toBeCloseTo(3, 10);
    expect(result.costPerYear).toBeCloseTo(36, 10);
  });

  it("2.5 A at 230 V = 575 W; 4 h/day × 30 = 69.0 kWh/month", () => {
    expect(wattsFromAmpsVolts(2.5, 230)).toBeCloseTo(575, 10);
    const result = calculateElectricity({
      mode: "appliance",
      powerMode: "amps-volts",
      watts: null,
      amps: 2.5,
      volts: 230,
      hoursPerDay: 4,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "appliance") return;
    expect(result.watts).toBeCloseTo(575, 10);
    expect(result.kwhPerMonth).toBeCloseTo(69, 10);
  });

  it("150 W, 24 h/day, 30 days at 40% = 43.2 kWh/month", () => {
    const result = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: 150,
      amps: null,
      volts: null,
      hoursPerDay: 24,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 40,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "appliance") return;
    expect(result.kwhPerMonth).toBeCloseTo(43.2, 10);
  });

  it("3 fans of 75 W, 8 h/day, 30 days = 54 kWh/month", () => {
    const result = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: 75,
      amps: null,
      volts: null,
      hoursPerDay: 8,
      daysPerMonth: 30,
      quantity: 3,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "appliance") return;
    expect(result.kwhPerMonth).toBeCloseTo(54, 10);
  });

  it("standby 5 W for 20 h/day over 30 days = 3.0 kWh/month", () => {
    expect(
      standbyKwh({ standbyWatts: 5, standbyHoursPerDay: 20, days: 30 }),
    ).toBeCloseTo(3, 10);
    const result = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: 100,
      amps: null,
      volts: null,
      hoursPerDay: 0,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: 5,
      standbyHoursPerDay: 20,
      pricePerKwh: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "appliance") return;
    expect(result.kwhPerMonth).toBeCloseTo(3, 10);
  });
});

describe("tiered billing hand-checks", () => {
  const tiers = [
    { upToUnits: 100, pricePerUnit: 10 },
    { upToUnits: 200, pricePerUnit: 15 },
    { upToUnits: null, pricePerUnit: 20 },
  ];

  it("incremental 250 units → 3,500; with fixed 100 and tax 10% → 3,960", () => {
    const tiered = calculateTieredCharge({
      units: 250,
      tiers,
      method: "incremental",
    });
    expect(tiered.ok).toBe(true);
    if (!tiered.ok) return;
    expect(tiered.charge).toBeCloseTo(3500, 10);

    const bill = calculateElectricity({
      mode: "bill",
      appliances: [
        {
          label: "Load",
          watts: 1000,
          quantity: 1,
          hoursPerDay: 250 / 30,
          daysPerMonth: 30,
          dutyPercent: 100,
        },
      ],
      pricePerKwh: null,
      useTiers: true,
      tiers: [
        { upToUnits: 100, pricePerUnit: 10 },
        { upToUnits: 200, pricePerUnit: 15 },
        { upToUnits: null, pricePerUnit: 20 },
      ],
      tierMethod: "incremental",
      fixedCharge: 100,
      taxPercent: 10,
    });
    expect(bill.ok).toBe(true);
    if (!bill.ok || bill.mode !== "bill") return;
    expect(bill.totalKwhPerMonth).toBeCloseTo(250, 10);
    expect(bill.energyCharge).toBeCloseTo(3500, 10);
    expect(bill.totalBill).toBeCloseTo(3960, 10);
  });

  it("whole bill: 250 → 5,000; 150 → 2,250; exactly 100 → 1,000", () => {
    const a = calculateTieredCharge({ units: 250, tiers, method: "whole" });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.charge).toBeCloseTo(5000, 10);

    const b = calculateTieredCharge({ units: 150, tiers, method: "whole" });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    expect(b.charge).toBeCloseTo(2250, 10);

    const c = calculateTieredCharge({ units: 100, tiers, method: "whole" });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    expect(c.charge).toBeCloseTo(1000, 10);
  });
});

describe("bill shares, edges, TZ", () => {
  it("zero usage still shows fixed charge and tax; shares sum to 100%", () => {
    const zero = calculateElectricity({
      mode: "bill",
      appliances: [
        {
          label: "Fan",
          watts: null,
          quantity: null,
          hoursPerDay: null,
          daysPerMonth: null,
          dutyPercent: null,
        },
      ],
      pricePerKwh: 0.2,
      useTiers: false,
      tiers: [],
      tierMethod: "incremental",
      fixedCharge: 100,
      taxPercent: 10,
    });
    expect(zero.ok).toBe(true);
    if (!zero.ok || zero.mode !== "bill") return;
    expect(zero.totalKwhPerMonth).toBe(0);
    expect(zero.energyCharge).toBeCloseTo(0, 10);
    expect(zero.fixedCharge).toBeCloseTo(100, 10);
    expect(zero.taxAmount).toBeCloseTo(10, 10);
    expect(zero.totalBill).toBeCloseTo(110, 10);

    const multi = calculateElectricity({
      mode: "bill",
      appliances: [
        {
          label: "Fan",
          watts: 75,
          quantity: 2,
          hoursPerDay: 8,
          daysPerMonth: 30,
          dutyPercent: 100,
        },
        {
          label: "Light",
          watts: 40,
          quantity: 1,
          hoursPerDay: 5,
          daysPerMonth: 30,
          dutyPercent: 100,
        },
      ],
      pricePerKwh: 0.2,
      useTiers: false,
      tiers: [],
      tierMethod: "incremental",
      fixedCharge: 0,
      taxPercent: 0,
    });
    expect(multi.ok).toBe(true);
    if (!multi.ok || multi.mode !== "bill") return;
    const shareSum = multi.shares.reduce((s, row) => s + row.sharePercent, 0);
    expect(shareSum).toBeCloseTo(100, 6);
    const kwhSum = multi.shares.reduce((s, row) => s + row.kwhPerMonth, 0);
    expect(kwhSum).toBeCloseTo(multi.totalKwhPerMonth, 10);
  });

  it("descending tiers, negatives and empty inputs return errors; TZ stable", () => {
    const descending = calculateTieredCharge({
      units: 50,
      tiers: [
        { upToUnits: 200, pricePerUnit: 10 },
        { upToUnits: 100, pricePerUnit: 15 },
        { upToUnits: null, pricePerUnit: 20 },
      ],
      method: "incremental",
    });
    expect(descending.ok).toBe(false);
    if (!descending.ok) expect(descending.error).toBe("tiers");

    const neg = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: -10,
      amps: null,
      volts: null,
      hoursPerDay: 5,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: 0.2,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const empty = calculateElectricity({
      mode: "appliance",
      powerMode: "watts",
      watts: null,
      amps: null,
      volts: null,
      hoursPerDay: null,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: null,
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");

    const input = {
      mode: "appliance" as const,
      powerMode: "watts" as const,
      watts: 100,
      amps: null,
      volts: null,
      hoursPerDay: 5,
      daysPerMonth: 30,
      quantity: 1,
      dutyPercent: 100,
      standbyWatts: null,
      standbyHoursPerDay: null,
      pricePerKwh: 0.2,
    };
    const a = calculateElectricity(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateElectricity(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateElectricity(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    expect(runningKwh({ watts: 100, quantity: 1, hoursPerDay: 5, days: 30, dutyPercent: 100 })).toBeCloseTo(15, 10);
    const row = monthlyKwhReferenceRow({ watts: 100, hoursPerDay: 5 });
    expect(row.kwhPerMonth).toBeCloseTo(15, 10);
  });
});
