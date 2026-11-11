import { describe, expect, it } from "vitest";
import {
  CM_PER_INCH,
  METERS_PER_MILE,
  calculateSteps,
  estimateStepLengthCm,
  formatWalkTime,
  inchesToCm,
  metersToSteps,
  stepsToMeters,
} from "./steps";

describe("unit conversions", () => {
  it("30 inches equals 76.2 cm exactly", () => {
    expect(inchesToCm(30)).toBe(76.2);
    expect(30 * CM_PER_INCH).toBe(76.2);
  });
});

describe("steps to distance — 10,000 at 76.2 cm", () => {
  it("→ 7,620.0 m = 7.62 km = 4.73 miles = 25,000 ft", () => {
    const result = calculateSteps({
      mode: "steps-to-distance",
      steps: 10000,
      stepLength: 76.2,
      stepLengthUnit: "cm",
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meters).toBeCloseTo(7620, 6);
    expect(Number(result.km.toFixed(2))).toBe(7.62);
    expect(Number(result.miles.toFixed(2))).toBe(4.73);
    expect(result.feet).toBeCloseTo(25000, 6);
  });
});

describe("distance to steps", () => {
  it("1 mile at 76.2 cm → exactly 2,112 steps", () => {
    const result = calculateSteps({
      mode: "distance-to-steps",
      distance: 1,
      distanceUnit: "miles",
      stepLength: 76.2,
      stepLengthUnit: "cm",
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(METERS_PER_MILE / 0.762).toBeCloseTo(2112, 10);
    expect(result.steps).toBe(2112);
  });

  it("5 km at 70 cm → 7,143 steps", () => {
    const result = calculateSteps({
      mode: "distance-to-steps",
      distance: 5,
      distanceUnit: "km",
      stepLength: 70,
      stepLengthUnit: "cm",
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(5000 / 0.7).toBeCloseTo(7142.857142, 5);
    expect(result.steps).toBe(7143);
  });
});

describe("estimate from height", () => {
  it("175 cm at 41.5% → 72.625 cm; 10,000 steps = 7,262.5 m = 7.26 km", () => {
    expect(estimateStepLengthCm(175, "cm", 41.5)).toBeCloseTo(72.625, 6);
    const result = calculateSteps({
      mode: "steps-to-distance",
      steps: 10000,
      stepLengthMode: "from-height",
      height: 175,
      heightUnit: "cm",
      heightPercent: 41.5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stepLengthCm).toBeCloseTo(72.625, 6);
    expect(result.meters).toBeCloseTo(7262.5, 6);
    expect(Number(result.km.toFixed(2))).toBe(7.26);
  });
});

describe("time to walk", () => {
  it("10,000 steps at 100 spm → 1 h 40 min", () => {
    const result = calculateSteps({
      mode: "time-to-walk",
      steps: 10000,
      cadence: 100,
      stepLength: 76.2,
      stepLengthUnit: "cm",
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalMinutes).toBe(100);
    expect(formatWalkTime(result.totalMinutes!)).toBe("1 h 40 min");
    expect(result.hours).toBe(1);
    expect(result.minutesPart).toBe(40);
  });
});

describe("round trip", () => {
  it("distance → steps → distance within one step length", () => {
    const stepM = 0.762;
    const originalM = METERS_PER_MILE;
    const steps = metersToSteps(originalM, stepM);
    const back = stepsToMeters(steps, stepM);
    expect(Math.abs(back - originalM)).toBeLessThanOrEqual(stepM);
  });
});

describe("edge cases", () => {
  it("invalid / zero / negative return error states", () => {
    expect(
      calculateSteps({
        mode: "steps-to-distance",
        steps: null,
        stepLength: 76.2,
        stepLengthMode: "known",
      }).ok,
    ).toBe(false);
    const zero = calculateSteps({
      mode: "steps-to-distance",
      steps: 0,
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error).toBe("zero");
    const negSteps = calculateSteps({
      mode: "steps-to-distance",
      steps: -1,
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    expect(negSteps.ok).toBe(false);
    if (!negSteps.ok) expect(negSteps.error).toBe("negative");
    const negDist = calculateSteps({
      mode: "distance-to-steps",
      distance: -2,
      distanceUnit: "km",
      stepLength: 70,
      stepLengthMode: "known",
    });
    expect(negDist.ok).toBe(false);
    if (!negDist.ok) expect(negDist.error).toBe("negative");
  });

  it("unusual step length still calculates with a note", () => {
    const result = calculateSteps({
      mode: "steps-to-distance",
      steps: 1000,
      stepLength: 15,
      stepLengthUnit: "cm",
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.notes.length).toBeGreaterThan(0);
    expect(result.meters).toBeCloseTo(150, 6);
  });

  it("never returns NaN or Infinity on success", () => {
    const result = calculateSteps({
      mode: "steps-to-distance",
      steps: 10000,
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const n of [result.meters, result.km, result.miles, result.feet]) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("results are identical under different TZ values", () => {
    const a = calculateSteps({
      mode: "distance-to-steps",
      distance: 1,
      distanceUnit: "miles",
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateSteps({
      mode: "distance-to-steps",
      distance: 1,
      distanceUnit: "miles",
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    process.env.TZ = "Asia/Tokyo";
    const c = calculateSteps({
      mode: "distance-to-steps",
      distance: 1,
      distanceUnit: "miles",
      stepLength: 76.2,
      stepLengthMode: "known",
    });
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});
