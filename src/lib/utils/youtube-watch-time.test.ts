import { describe, expect, it } from "vitest";
import {
  averageViewSecondsFromPercent,
  calculateWatchTime,
  hoursFromViews,
  monthsToTarget,
  viewsNeededForHours,
  viewsNeededReferenceRow,
} from "./youtube-watch-time";

describe("views needed", () => {
  it("4,000 hours at 3:00 average = 80,000 views", () => {
    expect(viewsNeededForHours(4000, 180)).toBe(80_000);
    const result = calculateWatchTime({
      mode: "views",
      targetHours: 4000,
      averageMinutes: 3,
      averageSeconds: 0,
      videoMinutes: null,
      videoSeconds: null,
      percentViewed: null,
      usePercentOfLength: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "views") return;
    expect(result.viewsNeeded).toBe(80_000);
  });

  it("4,000 hours at 4:30 = 53,334 views (ceil of 53,333.33)", () => {
    expect(viewsNeededForHours(4000, 270)).toBe(53_334);
    const result = calculateWatchTime({
      mode: "views",
      targetHours: 4000,
      averageMinutes: 4,
      averageSeconds: 30,
      videoMinutes: null,
      videoSeconds: null,
      percentViewed: null,
      usePercentOfLength: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "views") return;
    expect(result.viewsNeeded).toBe(53_334);
  });

  it("10:00 video at 45% viewed = 4:30", () => {
    expect(averageViewSecondsFromPercent(600, 45)).toBeCloseTo(270, 10);
    const result = calculateWatchTime({
      mode: "views",
      targetHours: 4000,
      averageMinutes: null,
      averageSeconds: null,
      videoMinutes: 10,
      videoSeconds: 0,
      percentViewed: 45,
      usePercentOfLength: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "views") return;
    expect(result.averageViewSeconds).toBeCloseTo(270, 10);
    expect(result.viewsNeeded).toBe(53_334);
  });
});

describe("hours from views and one video", () => {
  it("12,000 views at 4:30 = 900 hours", () => {
    expect(hoursFromViews(12_000, 270)).toBeCloseTo(900, 10);
  });

  it("1,000 views of 10-minute video at 45% = 75 hours", () => {
    const result = calculateWatchTime({
      mode: "video",
      videoMinutes: 10,
      videoSeconds: 0,
      percentViewed: 45,
      views: 1000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "video") return;
    expect(result.averageViewSeconds).toBeCloseTo(270, 10);
    expect(result.totalHours).toBeCloseTo(75, 10);
  });
});

describe("timeline", () => {
  it("3,400 remaining at 250/month with 0% growth = 13.6 months", () => {
    const flat = monthsToTarget({
      remainingHours: 3400,
      monthlyHours: 250,
      growthRate: 0,
    });
    expect(Number(flat.interpolatedMonths.toFixed(1))).toBe(13.6);

    const result = calculateWatchTime({
      mode: "timeline",
      currentHours: 600,
      monthlyHours: 250,
      growthPercent: 0,
      targetHours: 4000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "timeline") return;
    expect(result.remainingHours).toBeCloseTo(3400, 10);
    expect(Number(result.interpolatedMonths.toFixed(1))).toBe(13.6);
  });

  it("3,400 remaining at 250/month with 10% growth reaches in month 10 (~9.01)", () => {
    const grown = monthsToTarget({
      remainingHours: 3400,
      monthlyHours: 250,
      growthRate: 0.1,
    });
    expect(Number(grown.cumulativeBefore.toFixed(2))).toBe(3394.87);
    expect(grown.monthReached).toBe(10);
    expect(Number(grown.interpolatedMonths.toFixed(2))).toBe(9.01);

    const result = calculateWatchTime({
      mode: "timeline",
      currentHours: 600,
      monthlyHours: 250,
      growthPercent: 10,
      targetHours: 4000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "timeline") return;
    expect(result.monthReached).toBe(10);
    expect(Number(result.interpolatedMonths.toFixed(2))).toBe(9.01);
  });
});

describe("errors and TZ stability", () => {
  it("zero duration or negative input returns error; TZ stable", () => {
    const zero = calculateWatchTime({
      mode: "views",
      targetHours: 4000,
      averageMinutes: 0,
      averageSeconds: 0,
      videoMinutes: null,
      videoSeconds: null,
      percentViewed: null,
      usePercentOfLength: false,
    });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error).toBe("zero");

    const neg = calculateWatchTime({
      mode: "views",
      targetHours: -1,
      averageMinutes: 3,
      averageSeconds: 0,
      videoMinutes: null,
      videoSeconds: null,
      percentViewed: null,
      usePercentOfLength: false,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const input = {
      mode: "views" as const,
      targetHours: 4000,
      averageMinutes: 3,
      averageSeconds: 0,
      videoMinutes: null,
      videoSeconds: null,
      percentViewed: null,
      usePercentOfLength: false,
    };
    const a = calculateWatchTime(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateWatchTime(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateWatchTime(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    const row = viewsNeededReferenceRow(4000, 180);
    expect(row.viewsNeeded).toBe(80_000);
  });
});
