import { describe, expect, it } from "vitest";
import {
  KM_PER_MILE,
  calculatePace,
  convertPaceSpeed,
  findDistance,
  findPace,
  findTime,
  formatDuration,
  formatPace,
  roundHalfUp,
} from "./pace";

describe("pace rounding and formatting", () => {
  it("rounds half-up and carries (5:59.6 → 6:00)", () => {
    expect(roundHalfUp(359.6)).toBe(360);
    expect(formatPace(359.6)).toBe("6:00");
    expect(formatDuration(359.6)).toBe("6:00");
  });

  it("formats hours when needed", () => {
    expect(formatDuration(13924)).toBe("3:52:04");
    expect(formatDuration(7595)).toBe("2:06:35");
  });
});

describe("find pace — 5 km in 25:00", () => {
  it("returns 5:00/km, 8:03/mi, 12.00 km/h, 7.46 mph", () => {
    const result = findPace({
      distance: 5,
      distanceUnit: "km",
      timeSeconds: 25 * 60,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(formatPace(result.secPerKm)).toBe("5:00");
    // 300 * 1.609344 = 482.8032 → 8:02.8 → 8:03
    expect(result.secPerMile).toBeCloseTo(482.8032, 6);
    expect(formatPace(result.secPerMile)).toBe("8:03");
    expect(result.kmh).toBeCloseTo(12, 6);
    expect(Number(result.mph.toFixed(2))).toBe(7.46);
  });
});

describe("find time — race distances", () => {
  it("marathon at 5:30/km → 3:52:04", () => {
    const result = findTime({
      distance: 42.195,
      distanceUnit: "km",
      paceSeconds: 5 * 60 + 30,
      paceUnit: "min-per-km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalSeconds).toBeCloseTo(42.195 * 330, 6);
    expect(formatDuration(result.totalSeconds!)).toBe("3:52:04");
  });

  it("half marathon at 6:00/km → 2:06:35", () => {
    const result = findTime({
      distance: 21.0975,
      distanceUnit: "km",
      paceSeconds: 6 * 60,
      paceUnit: "min-per-km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(formatDuration(result.totalSeconds!)).toBe("2:06:35");
  });
});

describe("convert — 8:00 per mile", () => {
  it("→ 4:58/km, 7.50 mph, 12.07 km/h", () => {
    const result = convertPaceSpeed({
      value: 8 * 60,
      kind: "min-per-mile",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 480 / 1.609344 ≈ 298.258 → 4:58
    expect(result.secPerKm).toBeCloseTo(480 / KM_PER_MILE, 6);
    expect(formatPace(result.secPerKm)).toBe("4:58");
    expect(Number(result.mph.toFixed(2))).toBe(7.5);
    expect(Number(result.kmh.toFixed(2))).toBe(12.07);
  });
});

describe("find distance", () => {
  it("1 hour at 6:00/km → 10.00 km", () => {
    const result = findDistance({
      timeSeconds: 3600,
      paceSeconds: 6 * 60,
      paceUnit: "min-per-km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.distanceKm).toBeCloseTo(10, 6);
    expect(Number(result.distanceKm!.toFixed(2))).toBe(10);
  });

  it("45 minutes at 9:00/mi → 5.00 mi = 8.05 km", () => {
    const result = findDistance({
      timeSeconds: 45 * 60,
      paceSeconds: 9 * 60,
      paceUnit: "min-per-mile",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.distanceMiles).toBeCloseTo(5, 6);
    expect(Number(result.distanceKm!.toFixed(2))).toBe(8.05);
  });
});

describe("convert — 10 km/h", () => {
  it("→ 6:00/km, 9:39/mi, 6.21 mph", () => {
    const result = convertPaceSpeed({ value: 10, kind: "kmh" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(formatPace(result.secPerKm)).toBe("6:00");
    // 360 * 1.609344 = 579.36384 → 9:39.4 → 9:39
    expect(result.secPerMile).toBeCloseTo(579.36384, 5);
    expect(formatPace(result.secPerMile)).toBe("9:39");
    expect(Number(result.mph.toFixed(2))).toBe(6.21);
  });
});

describe("splits — 10.5 km at 5:00/km", () => {
  it("10 full km + final 0.5 km at 2:30, total 52:30", () => {
    const result = findTime({
      distance: 10.5,
      distanceUnit: "km",
      paceSeconds: 5 * 60,
      paceUnit: "min-per-km",
      splitUnit: "km",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.splits).toHaveLength(11);
    expect(result.splits.filter((s) => !s.partial)).toHaveLength(10);
    const last = result.splits[result.splits.length - 1]!;
    expect(last.partial).toBe(true);
    expect(last.distance).toBeCloseTo(0.5, 6);
    expect(formatDuration(last.splitSeconds)).toBe("2:30");
    expect(formatDuration(result.totalSeconds!)).toBe("52:30");
    expect(formatDuration(last.cumulativeSeconds)).toBe("52:30");
  });
});

describe("edge cases", () => {
  it("zero and empty return error states", () => {
    expect(findPace({ distance: null, distanceUnit: "km", timeSeconds: null }).ok).toBe(
      false,
    );
    expect(findPace({ distance: 0, distanceUnit: "km", timeSeconds: 60 }).error).toBe(
      "zero",
    );
    expect(findPace({ distance: 5, distanceUnit: "km", timeSeconds: 0 }).error).toBe(
      "zero",
    );
  });

  it("negatives are blocked", () => {
    expect(
      findPace({ distance: -1, distanceUnit: "km", timeSeconds: 60 }).error,
    ).toBe("negative");
    expect(
      findTime({
        distance: 5,
        distanceUnit: "km",
        paceSeconds: -1,
        paceUnit: "min-per-km",
      }).error,
    ).toBe("negative");
  });

  it("never returns NaN or Infinity on success", () => {
    const result = calculatePace({
      mode: "find-pace",
      distance: 5,
      distanceUnit: "km",
      timeSeconds: 1500,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const n of [
      result.secPerKm,
      result.secPerMile,
      result.kmh,
      result.mph,
      result.totalSeconds!,
    ]) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("results are identical under different TZ values", () => {
    const a = findTime({
      distance: 42.195,
      distanceUnit: "km",
      paceSeconds: 330,
      paceUnit: "min-per-km",
    });
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = findTime({
      distance: 42.195,
      distanceUnit: "km",
      paceSeconds: 330,
      paceUnit: "min-per-km",
    });
    process.env.TZ = "Asia/Tokyo";
    const c = findTime({
      distance: 42.195,
      distanceUnit: "km",
      paceSeconds: 330,
      paceUnit: "min-per-km",
    });
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});

// Re-export buildSplits usage sanity via findPace
describe("buildSplits export sanity", () => {
  it("exports KM_PER_MILE exact factor", () => {
    expect(KM_PER_MILE).toBe(1.609344);
  });
});
