import { describe, expect, it } from "vitest";
import {
  calculateFuelCost,
  convertEfficiency,
  efficiencyReferenceRow,
} from "./fuel-cost";

describe("trip cost hand-checks", () => {
  it("300 km at 12 km/L and 280 per litre → 25 L, cost 7,000, 23.33 per km", () => {
    const result = calculateFuelCost({
      mode: "trip",
      distance: 300,
      distanceUnit: "km",
      efficiency: 12,
      efficiencyUnit: "km_l",
      fuelPrice: 280,
      fuelPriceUnit: "per_litre",
      roundTrip: false,
      tolls: null,
      otherCosts: null,
      people: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "trip") return;
    expect(result.fuelLitres).toBeCloseTo(25, 10);
    expect(result.fuelCost).toBeCloseTo(7000, 10);
    expect(Number(result.costPerKm.toFixed(2))).toBe(23.33);
  });

  it("round trip with tolls and 4 people", () => {
    const result = calculateFuelCost({
      mode: "trip",
      distance: 300,
      distanceUnit: "km",
      efficiency: 12,
      efficiencyUnit: "km_l",
      fuelPrice: 280,
      fuelPriceUnit: "per_litre",
      roundTrip: true,
      tolls: 500,
      otherCosts: null,
      people: 4,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "trip") return;
    expect(result.distanceKm).toBeCloseTo(600, 10);
    expect(result.fuelLitres).toBeCloseTo(50, 10);
    expect(result.fuelCost).toBeCloseTo(14000, 10);
    expect(result.totalCost).toBeCloseTo(14500, 10);
    expect(result.costPerPerson).toBeCloseTo(3625, 10);
  });

  it("200 miles at 25 MPG (US) and 3.50 per gallon → 8 gal, 30.28 L, cost 28", () => {
    const result = calculateFuelCost({
      mode: "trip",
      distance: 200,
      distanceUnit: "mi",
      efficiency: 25,
      efficiencyUnit: "mpg_us",
      fuelPrice: 3.5,
      fuelPriceUnit: "per_us_gallon",
      roundTrip: false,
      tolls: null,
      otherCosts: null,
      people: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "trip") return;
    expect(Number(result.fuelUsGallons.toFixed(2))).toBe(8);
    expect(Number(result.fuelLitres.toFixed(2))).toBe(30.28);
    expect(Number(result.fuelCost.toFixed(2))).toBe(28);
  });
});

describe("efficiency conversions", () => {
  it("8 L/100 km = 12.50 km/L = 29.40 MPG US = 35.31 MPG UK", () => {
    const e = convertEfficiency(8, "l_100km");
    expect(Number(e.kmPerLitre.toFixed(2))).toBe(12.5);
    expect(Number(e.mpgUs.toFixed(2))).toBe(29.4);
    expect(Number(e.mpgUk.toFixed(2))).toBe(35.31);
  });

  it("30 MPG (US) = 7.84 L/100 km = 12.75 km/L", () => {
    const e = convertEfficiency(30, "mpg_us");
    expect(Number(e.litresPer100km.toFixed(2))).toBe(7.84);
    expect(Number(e.kmPerLitre.toFixed(2))).toBe(12.75);
  });

  it("450 km with 36 L = 12.50 km/L = 8.00 L/100 km", () => {
    const result = calculateFuelCost({
      mode: "efficiency",
      distance: 450,
      distanceUnit: "km",
      fuelUsed: 36,
      fuelUsedUnit: "litre",
      fuelPrice: null,
      fuelPriceUnit: "per_litre",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "efficiency") return;
    expect(Number(result.efficiency.kmPerLitre.toFixed(2))).toBe(12.5);
    expect(Number(result.efficiency.litresPer100km.toFixed(2))).toBe(8);
  });
});

describe("errors and TZ stability", () => {
  it("zero distance or efficiency returns empty/zero state; TZ stable", () => {
    const zeroDist = calculateFuelCost({
      mode: "trip",
      distance: 0,
      distanceUnit: "km",
      efficiency: 12,
      efficiencyUnit: "km_l",
      fuelPrice: 280,
      fuelPriceUnit: "per_litre",
      roundTrip: false,
      tolls: null,
      otherCosts: null,
      people: null,
    });
    expect(zeroDist.ok).toBe(false);
    if (!zeroDist.ok) expect(zeroDist.error).toBe("zero");

    const empty = calculateFuelCost({
      mode: "trip",
      distance: null,
      distanceUnit: "km",
      efficiency: null,
      efficiencyUnit: "km_l",
      fuelPrice: null,
      fuelPriceUnit: "per_litre",
      roundTrip: false,
      tolls: null,
      otherCosts: null,
      people: null,
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");

    const input = {
      mode: "convert" as const,
      efficiency: 8,
      efficiencyUnit: "l_100km" as const,
    };
    const a = calculateFuelCost(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateFuelCost(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateFuelCost(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    const row = efficiencyReferenceRow(8, "l_100km");
    expect(Number(row.kmPerLitre.toFixed(2))).toBe(12.5);
  });
});
