import { describe, expect, it } from "vitest";
import { KM_PER_MILE, formatDuration, formatPace } from "@/lib/utils/pace";
import {
  DEFAULT_RIEGEL_EXPONENT,
  calculateRacePredictions,
  predictRaceTime,
  roundHalfUp,
} from "./race-predictor";

describe("Riegel predictions — 5K in 25:00", () => {
  it("to 10K ≈ 52:07", () => {
    const t2 = predictRaceTime(1500, 5, 10, DEFAULT_RIEGEL_EXPONENT);
    expect(t2).toBeCloseTo(1500 * 2 ** 1.06, 6);
    expect(roundHalfUp(t2)).toBe(3127);
    expect(formatDuration(t2)).toBe("52:07");
  });

  it("to marathon ≈ 3:59:47", () => {
    const t2 = predictRaceTime(1500, 5, 42.195, DEFAULT_RIEGEL_EXPONENT);
    expect(t2).toBeCloseTo(1500 * (42.195 / 5) ** 1.06, 4);
    expect(formatDuration(t2)).toBe("3:59:47");
  });
});

describe("same distance and monotonicity", () => {
  it("same distance returns the same time exactly", () => {
    expect(predictRaceTime(1500, 5, 5, 1.06)).toBe(1500);
    const result = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const inputRow = result.rows.find((r) => r.isInput);
    expect(inputRow?.timeSeconds).toBe(1500);
  });

  it("a longer target never gives a shorter time", () => {
    const result = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (let i = 1; i < result.rows.length; i += 1) {
      expect(result.rows[i]!.timeSeconds).toBeGreaterThanOrEqual(
        result.rows[i - 1]!.timeSeconds,
      );
    }
  });
});

describe("exponent 1.00", () => {
  it("gives pure pace extrapolation (5K 25:00 → 10K 50:00)", () => {
    const t2 = predictRaceTime(1500, 5, 10, 1.0);
    expect(t2).toBe(3000);
    expect(formatDuration(t2)).toBe("50:00");
  });
});

describe("paces match pace helpers", () => {
  it("sec/km and sec/mile use the same factor as Pace Calculator", () => {
    const result = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const row of result.rows) {
      const expectedSecPerKm = row.timeSeconds / row.distanceKm;
      const expectedSecPerMile = expectedSecPerKm * KM_PER_MILE;
      expect(row.secPerKm).toBeCloseTo(expectedSecPerKm, 10);
      expect(row.secPerMile).toBeCloseTo(expectedSecPerMile, 10);
      expect(formatPace(row.secPerKm)).toBe(formatPace(expectedSecPerKm));
      expect(formatPace(row.secPerMile)).toBe(formatPace(expectedSecPerMile));
    }
  });
});

describe("edge cases", () => {
  it("out-of-range and empty inputs return error states", () => {
    expect(
      calculateRacePredictions({ distanceKm: null, timeSeconds: null }).ok,
    ).toBe(false);
    const zero = calculateRacePredictions({ distanceKm: 0, timeSeconds: 1500 });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error).toBe("zero");
    const neg = calculateRacePredictions({ distanceKm: -1, timeSeconds: 1500 });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");
    const low = calculateRacePredictions({ distanceKm: 0.5, timeSeconds: 1500 });
    expect(low.ok).toBe(false);
    if (!low.ok) expect(low.error).toBe("range");
    const high = calculateRacePredictions({ distanceKm: 101, timeSeconds: 1500 });
    expect(high.ok).toBe(false);
    if (!high.ok) expect(high.error).toBe("range");
    const exp = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.2,
    });
    expect(exp.ok).toBe(false);
    if (!exp.ok) expect(exp.error).toBe("range");
  });

  it("never returns NaN or Infinity on success", () => {
    const result = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const row of result.rows) {
      expect(Number.isFinite(row.timeSeconds)).toBe(true);
      expect(Number.isFinite(row.secPerKm)).toBe(true);
      expect(Number.isFinite(row.secPerMile)).toBe(true);
    }
  });

  it("results are identical under different TZ values", () => {
    const a = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    process.env.TZ = "Asia/Tokyo";
    const c = calculateRacePredictions({
      distanceKm: 5,
      timeSeconds: 1500,
      exponent: 1.06,
    });
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});
