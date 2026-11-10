import { describe, expect, it } from "vitest";
import {
  calculateFreelanceRate,
  calculateFindRate,
  calculateTakeHome,
  projectQuoteFromRate,
  roundMoney,
} from "@/lib/utils/freelance-rate";

describe("freelance-rate — hand-checked cases", () => {
  it("finds rate for 60,000 take-home with standard costs", () => {
    const r = calculateFindRate({
      takeHome: 60000,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "find-rate") return;
    expect(r.billableHours).toBe(1150);
    expect(r.revenueNeeded).toBeCloseTo(81000, 2);
    expect(r.hourlyRate).toBeCloseTo(70.43, 2);
  });

  it("raises revenue and rate with a 20% platform fee", () => {
    const r = calculateFindRate({
      takeHome: 60000,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 20,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "find-rate") return;
    expect(r.revenueNeeded).toBeCloseTo(101250, 2);
    expect(r.hourlyRate).toBeCloseTo(88.04, 2);
  });

  it("applies a 10% profit buffer", () => {
    const r = calculateFindRate({
      takeHome: 60000,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 0,
      bufferPercent: 10,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "find-rate") return;
    expect(r.revenueWithBuffer).toBeCloseTo(89100, 2);
    expect(r.hourlyRate).toBeCloseTo(77.48, 2);
  });

  it("handles zero tax and zero expenses", () => {
    const r = calculateFindRate({
      takeHome: 30000,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 0,
      weeksOff: 4,
      billableHoursPerWeek: 20,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "find-rate") return;
    expect(r.billableHours).toBe(960);
    expect(r.hourlyRate).toBeCloseTo(31.25, 2);
  });

  it("quotes a project from an unrounded hourly rate", () => {
    expect(projectQuoteFromRate(70.4348, 10)).toBeCloseTo(704.35, 2);
  });

  it("estimates take-home from a known rate", () => {
    const r = calculateTakeHome({
      hourlyRate: 80,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok || r.mode !== "take-home") return;
    expect(r.billableHours).toBe(1150);
    expect(r.annualRevenue).toBeCloseTo(92000, 2);
    expect(r.profit).toBeCloseTo(86000, 2);
    expect(r.takeHome).toBeCloseTo(68800, 2);
  });

  it("round-trips find-rate into take-home within 0.01", () => {
    const found = calculateFindRate({
      takeHome: 60000,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(found.ok).toBe(true);
    if (!found.ok || found.mode !== "find-rate") return;

    const back = calculateTakeHome({
      hourlyRate: found.hourlyRate,
      expenses: 6000,
      expensePeriod: "yearly",
      taxRatePercent: 20,
      weeksOff: 6,
      billableHoursPerWeek: 25,
      platformFeePercent: 0,
    });
    expect(back.ok).toBe(true);
    if (!back.ok || back.mode !== "take-home") return;
    expect(Math.abs(back.takeHome - 60000)).toBeLessThanOrEqual(0.01);
  });

  it("returns error states for invalid inputs", () => {
    expect(
      calculateFreelanceRate({
        mode: "find-rate",
        takeHome: null,
        expenses: null,
        expensePeriod: "yearly",
        taxRatePercent: null,
        weeksOff: null,
        billableHoursPerWeek: null,
      }).ok,
    ).toBe(false);

    const weeks = calculateFindRate({
      takeHome: 10000,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 10,
      weeksOff: 52,
      billableHoursPerWeek: 20,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(weeks.ok).toBe(false);
    if (!weeks.ok) expect(weeks.error).toBe("weeks_off");

    const tax = calculateFindRate({
      takeHome: 10000,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 100,
      weeksOff: 4,
      billableHoursPerWeek: 20,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(tax.ok).toBe(false);
    if (!tax.ok) expect(tax.error).toBe("tax");

    const fee = calculateFindRate({
      takeHome: 10000,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 10,
      weeksOff: 4,
      billableHoursPerWeek: 20,
      platformFeePercent: 100,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(fee.ok).toBe(false);
    if (!fee.ok) expect(fee.error).toBe("fee");

    const neg = calculateFindRate({
      takeHome: -1,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 10,
      weeksOff: 4,
      billableHoursPerWeek: 20,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const hours = calculateFindRate({
      takeHome: 10000,
      expenses: 0,
      expensePeriod: "yearly",
      taxRatePercent: 10,
      weeksOff: 4,
      billableHoursPerWeek: 0,
      platformFeePercent: 0,
      bufferPercent: 0,
      projectHours: null,
      revisionBufferPercent: null,
    });
    expect(hours.ok).toBe(false);
    if (!hours.ok) expect(hours.error).toBe("hours");
  });

  it("rounds money half-up for display helpers", () => {
    expect(roundMoney(70.4348)).toBe(70.43);
    expect(roundMoney(704.348)).toBe(704.35);
  });
});
