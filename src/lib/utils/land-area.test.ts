import { describe, expect, it } from "vitest";
import {
  areaConversionReferenceRow,
  breakdownFromSqFt,
  calculateLandArea,
  polygonSelfIntersects,
  toSqFt,
} from "./land-area";

describe("plot area hand-checks", () => {
  it("rectangle 50 ft × 90 ft = 4,500 ft² = 16.53 marla = 0.83 kanal", () => {
    const result = calculateLandArea({
      mode: "plot",
      shape: "rectangle",
      length: 50,
      width: 90,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "plot") return;
    expect(result.areaSqFt).toBeCloseTo(4500, 10);
    expect(Number(result.areas.marla.toFixed(2))).toBe(16.53);
    expect(Number(result.areas.kanal.toFixed(2))).toBe(0.83);
    expect(result.areas.sqyd).toBeCloseTo(500, 10);
    expect(Number(result.areas.sqm.toFixed(2))).toBe(418.06);
    expect(Number(result.areas.acre.toFixed(4))).toBe(0.1033);
  });

  it("triangle 30, 40, 50 ft = 600 ft²", () => {
    const result = calculateLandArea({
      mode: "plot",
      shape: "triangle",
      sideA: 30,
      sideB: 40,
      sideC: 50,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "plot") return;
    expect(result.areaSqFt).toBeCloseTo(600, 10);
  });

  it("trapezoid 40 and 60 with height 30 = 1,500", () => {
    const result = calculateLandArea({
      mode: "plot",
      shape: "trapezoid",
      baseA: 40,
      baseB: 60,
      height: 30,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "plot") return;
    expect(result.areaSqFt).toBeCloseTo(1500, 10);
  });

  it("four sides 40, 30, 40, 30 with diagonal 50 = 1,200", () => {
    const result = calculateLandArea({
      mode: "plot",
      shape: "quad",
      sideA: 40,
      sideB: 30,
      sideC: 40,
      sideD: 30,
      diagonal: 50,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "plot") return;
    expect(result.areaSqFt).toBeCloseTo(1200, 10);
  });

  it("polygon shoelace = 2,100; bow-tie flagged as self-intersecting", () => {
    const poly = calculateLandArea({
      mode: "plot",
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
        { x: 60, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 50 },
        { x: 0, y: 50 },
      ],
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(poly.ok).toBe(true);
    if (!poly.ok || poly.mode !== "plot") return;
    expect(poly.areaSqFt).toBeCloseTo(2100, 10);

    const bow = [
      { x: 0, y: 0 },
      { x: 40, y: 30 },
      { x: 40, y: 0 },
      { x: 0, y: 30 },
    ];
    expect(polygonSelfIntersects(bow)).toBe(true);
    const flagged = calculateLandArea({
      mode: "plot",
      shape: "polygon",
      points: bow,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(flagged.ok).toBe(false);
    if (!flagged.ok) expect(flagged.error).toBe("self_intersecting");
  });
});

describe("area conversions", () => {
  it("1 kanal = 20 marla = 5,445 ft² = 605 yd² = 505.86 m²", () => {
    const result = calculateLandArea({
      mode: "convert",
      value: 1,
      unit: "kanal",
      sqftPerMarla: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "convert") return;
    expect(result.areas.marla).toBeCloseTo(20, 10);
    expect(result.areas.sqft).toBeCloseTo(5445, 10);
    expect(result.areas.sqyd).toBeCloseTo(605, 10);
    expect(Number(result.areas.sqm.toFixed(2))).toBe(505.86);
  });

  it("1 marla = 25.29 m²; 1 acre = 8 kanal = 160 marla; 1 hectare ≈ 19.77 kanal", () => {
    const marla = breakdownFromSqFt(toSqFt(1, "marla"));
    expect(Number(marla.sqm.toFixed(2))).toBe(25.29);

    const acre = calculateLandArea({
      mode: "convert",
      value: 1,
      unit: "acre",
      sqftPerMarla: null,
    });
    expect(acre.ok).toBe(true);
    if (!acre.ok || acre.mode !== "convert") return;
    expect(acre.areas.kanal).toBeCloseTo(8, 10);
    expect(acre.areas.marla).toBeCloseTo(160, 10);

    const ha = calculateLandArea({
      mode: "convert",
      value: 1,
      unit: "hectare",
      sqftPerMarla: null,
    });
    expect(ha.ok).toBe(true);
    if (!ha.ok || ha.mode !== "convert") return;
    expect(Number(ha.areas.kanal.toFixed(2))).toBe(19.77);
  });
});

describe("errors and TZ stability", () => {
  it("unreachable triangle returns error; negatives/empty blocked; TZ stable", () => {
    const bad = calculateLandArea({
      mode: "plot",
      shape: "triangle",
      sideA: 1,
      sideB: 2,
      sideC: 10,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("triangle");

    const neg = calculateLandArea({
      mode: "plot",
      shape: "rectangle",
      length: -1,
      width: 10,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const empty = calculateLandArea({
      mode: "plot",
      shape: "rectangle",
      length: null,
      width: null,
      lengthUnit: "ft",
      sqftPerMarla: null,
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");

    const input = {
      mode: "plot" as const,
      shape: "rectangle" as const,
      length: 50,
      width: 90,
      lengthUnit: "ft" as const,
      sqftPerMarla: null,
    };
    const a = calculateLandArea(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateLandArea(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateLandArea(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    const row = areaConversionReferenceRow(1, "kanal");
    expect(row.sqft).toBeCloseTo(5445, 10);
  });
});
