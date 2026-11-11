import { describe, expect, it } from "vitest";
import { findPace, formatDuration, formatPace, KM_PER_MILE } from "@/lib/utils/pace";
import {
  MARATHON_KM,
  HALF_MARATHON_KM,
  buildGoalSplits,
  buildPaceChart,
  csvEscape,
  halfPaces,
  paceChartToCsv,
  rowFromFinishTime,
} from "./pace-chart";

describe("marathon 4:00:00 even splits", () => {
  it("pace 5:41/km, 9:09/mi; checkpoints match", () => {
    const goal = 4 * 3600;
    const result = buildGoalSplits({
      distanceKm: MARATHON_KM,
      goalSeconds: goal,
      plan: "even",
      splitUnit: "km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(formatPace(result.avgSecPerKm)).toBe("5:41");
    expect(formatPace(result.avgSecPerKm * KM_PER_MILE)).toBe("9:09");

    const byLabel = Object.fromEntries(
      result.checkpoints.map((c) => [c.label, c.cumulativeSeconds]),
    );
    // Half marathon point at even pace is exactly half the time
    expect(formatDuration(byLabel["Half marathon"]!)).toBe("2:00:00");
    expect(formatDuration(byLabel["5 km"]!)).toBe("28:26");
    expect(formatDuration(byLabel["10 km"]!)).toBe("56:53");
    expect(formatDuration(byLabel["30 km"]!)).toBe("2:50:38");
    expect(formatDuration(byLabel["40 km"]!)).toBe("3:47:31");
  });
});

describe("marathon 3:30:00", () => {
  it("pace 4:59/km, 8:01/mi", () => {
    const row = rowFromFinishTime(MARATHON_KM, 3.5 * 3600);
    expect(formatPace(row.secPerKm)).toBe("4:59");
    expect(formatPace(row.secPerMile)).toBe("8:01");
  });
});

describe("half marathon 2:00:00", () => {
  it("pace 5:41/km, 9:09/mi; 10 km split 56:53", () => {
    const result = buildGoalSplits({
      distanceKm: HALF_MARATHON_KM,
      goalSeconds: 2 * 3600,
      plan: "even",
      splitUnit: "km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(formatPace(result.avgSecPerKm)).toBe("5:41");
    expect(formatPace(result.avgSecPerKm * KM_PER_MILE)).toBe("9:09");
    const ten = result.checkpoints.find((c) => c.label === "10 km");
    expect(ten).toBeTruthy();
    expect(formatDuration(ten!.cumulativeSeconds)).toBe("56:53");
  });
});

describe("symmetric pacing plan", () => {
  it("first + second half equals goal; s=0 matches even", () => {
    const goal = 4 * 3600;
    for (const percent of [0, 1, 2, 3, 4, 5]) {
      const plan = percent === 0 ? "even" : "slower-first";
      const result = buildGoalSplits({
        distanceKm: MARATHON_KM,
        goalSeconds: goal,
        plan,
        skewPercent: percent === 0 ? null : percent,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(
        Math.abs(
          result.firstHalfSeconds + result.secondHalfSeconds - goal,
        ),
      ).toBeLessThan(0.001);
    }
    const even = buildGoalSplits({
      distanceKm: MARATHON_KM,
      goalSeconds: goal,
      plan: "even",
    });
    const zeroSkew = halfPaces(goal / MARATHON_KM, "even", 0);
    expect(even.ok).toBe(true);
    if (!even.ok) return;
    expect(zeroSkew.firstSecPerKm).toBeCloseTo(even.avgSecPerKm, 10);
    expect(zeroSkew.secondSecPerKm).toBeCloseTo(even.avgSecPerKm, 10);
  });
});

describe("chart rows match Pace Calculator", () => {
  it("every row equals findPace for same distance and time", () => {
    const chart = buildPaceChart({
      distanceKm: 5,
      startSeconds: 20 * 60,
      endSeconds: 30 * 60,
      stepSeconds: 60,
    });
    expect(chart.ok).toBe(true);
    if (!chart.ok) return;
    for (const row of chart.rows) {
      const pace = findPace({
        distance: 5,
        distanceUnit: "km",
        timeSeconds: row.finishSeconds,
      });
      expect(pace.ok).toBe(true);
      if (!pace.ok) return;
      expect(row.secPerKm).toBeCloseTo(pace.secPerKm, 10);
      expect(row.secPerMile).toBeCloseTo(pace.secPerMile, 10);
      expect(row.kmh).toBeCloseTo(pace.kmh, 10);
      expect(row.mph).toBeCloseTo(pace.mph, 10);
    }
  });
});

describe("CSV safety", () => {
  it("labels beginning with = get a leading apostrophe", () => {
    expect(csvEscape("=1+1")).toBe("'=1+1");
    expect(csvEscape("+foo")).toBe("'+foo");
    expect(csvEscape("-bar")).toBe("'-bar");
    expect(csvEscape("@x")).toBe("'@x");
    const csv = paceChartToCsv(
      [rowFromFinishTime(5, 1500)],
      5,
    );
    expect(csv).toContain("25:00");
    expect(csv.split("\n")[0]).toContain("finish_time");
  });
});

describe("edge cases / TZ", () => {
  it("empty and invalid return error states", () => {
    expect(
      buildPaceChart({
        distanceKm: null,
        startSeconds: null,
        endSeconds: null,
        stepSeconds: null,
      }).ok,
    ).toBe(false);
    const zero = buildGoalSplits({ distanceKm: 0, goalSeconds: 3600 });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error).toBe("zero");
  });

  it("results are identical under different TZ values", () => {
    const a = buildGoalSplits({
      distanceKm: MARATHON_KM,
      goalSeconds: 14400,
      plan: "even",
    });
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = buildGoalSplits({
      distanceKm: MARATHON_KM,
      goalSeconds: 14400,
      plan: "even",
    });
    process.env.TZ = "Asia/Tokyo";
    const c = buildGoalSplits({
      distanceKm: MARATHON_KM,
      goalSeconds: 14400,
      plan: "even",
    });
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});
