import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMMON_BTU_SIZES,
  DEFAULT_COMMON_TONS,
  DEFAULT_COOLING_BTU_PER_SQFT,
  SQFT_PER_SQM,
  btuHToKw,
  btuHToTons,
  calculateBtu,
  convertBtuH,
  nextCommonSize,
  roundBtuToNearest100,
  sqmToSqFt,
} from "./btu";

const common = {
  commonBtuSizes: [...DEFAULT_COMMON_BTU_SIZES],
  commonTons: [...DEFAULT_COMMON_TONS],
};

describe("cooling hand-checks", () => {
  it("300 ft², 8 ft, normal, 2 people, no kitchen → 6,000 / 0.50 ton / 1.76 kW", () => {
    const result = calculateBtu({
      mode: "cooling",
      area: 300,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: DEFAULT_COOLING_BTU_PER_SQFT,
      sun: "normal",
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.requiredBtuExact).toBe(6000);
    expect(result.requiredBtuRounded).toBe(6000);
    expect(result.tons).toBeCloseTo(0.5, 10);
    expect(result.kw).toBeCloseTo(1.76, 2);
    expect(result.kw.toFixed(2)).toBe("1.76");
  });

  it("400 ft², 10 ft chain: base, sunny, people, kitchen", () => {
    const base = calculateBtu({
      mode: "cooling",
      area: 400,
      areaUnit: "sqft",
      ceiling: 10,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "normal",
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(base.ok).toBe(true);
    if (!base.ok) return;
    expect(base.requiredBtuRounded).toBe(10000);

    const sunny = calculateBtu({
      mode: "cooling",
      area: 400,
      areaUnit: "sqft",
      ceiling: 10,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "very-sunny",
      sunFraction: 0.1,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(sunny.ok).toBe(true);
    if (!sunny.ok) return;
    expect(sunny.requiredBtuRounded).toBe(11000);

    const people = calculateBtu({
      mode: "cooling",
      area: 400,
      areaUnit: "sqft",
      ceiling: 10,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "very-sunny",
      sunFraction: 0.1,
      people: 4,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(people.ok).toBe(true);
    if (!people.ok) return;
    expect(people.requiredBtuExact).toBe(12200);

    const kitchen = calculateBtu({
      mode: "cooling",
      area: 400,
      areaUnit: "sqft",
      ceiling: 10,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "very-sunny",
      sunFraction: 0.1,
      people: 4,
      btuPerExtraPerson: 600,
      kitchen: true,
      kitchenBtu: 4000,
      ...common,
    });
    expect(kitchen.ok).toBe(true);
    if (!kitchen.ok) return;
    expect(kitchen.requiredBtuExact).toBe(16200);
    expect(kitchen.tons).toBeCloseTo(1.35, 10);
  });

  it("heavily shaded 300 ft² → 5,400; one person adds nothing", () => {
    const shaded = calculateBtu({
      mode: "cooling",
      area: 300,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "heavily-shaded",
      sunFraction: -0.1,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(shaded.ok).toBe(true);
    if (!shaded.ok) return;
    expect(shaded.requiredBtuExact).toBe(5400);

    const one = calculateBtu({
      mode: "cooling",
      area: 300,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "normal",
      sunFraction: 0,
      people: 1,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(one.requiredBtuExact).toBe(6000);
    const peopleAdj = one.adjustments.find((a) => a.id === "people");
    expect(peopleAdj?.btuPerHour).toBe(0);
  });

  it("25 m² at 8 ft → 269.098 ft², 5381.96 exact, 5,400 displayed", () => {
    const sqft = sqmToSqFt(25);
    expect(sqft).toBeCloseTo(269.098, 3);
    expect(sqft).toBeCloseTo(25 * SQFT_PER_SQM, 12);
    const result = calculateBtu({
      mode: "cooling",
      area: 25,
      areaUnit: "sqm",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "normal",
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.areaSqFt).toBeCloseTo(269.097760425, 6);
    expect(result.requiredBtuExact).toBeCloseTo(5381.96, 2);
    expect(result.requiredBtuRounded).toBe(5400);
  });
});

describe("heating hand-checks", () => {
  it("300 ft² at 40 → 12,000 BTU/h = 3.52 kW", () => {
    const result = calculateBtu({
      mode: "heating",
      area: 300,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      climate: "moderate",
      btuPerSqFt: 40,
      ...common,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.requiredBtuRounded).toBe(12000);
    expect(result.kw.toFixed(2)).toBe("3.52");
  });
});

describe("next common size", () => {
  it("6458→7000, 12000 stays, 12001→14000", () => {
    expect(nextCommonSize(6458, DEFAULT_COMMON_BTU_SIZES)).toBe(7000);
    expect(nextCommonSize(12000, DEFAULT_COMMON_BTU_SIZES)).toBe(12000);
    expect(nextCommonSize(12001, DEFAULT_COMMON_BTU_SIZES)).toBe(14000);
  });
});

describe("edge cases / TZ", () => {
  it("out-of-range inputs return error states", () => {
    expect(
      calculateBtu({
        mode: "cooling",
        area: null,
        areaUnit: "sqft",
        ceiling: null,
        heightUnit: "ft",
        btuPerSqFt: 20,
        sun: "normal",
        sunFraction: 0,
        people: 2,
        btuPerExtraPerson: 600,
        kitchen: false,
        kitchenBtu: 4000,
        ...common,
      }).ok,
    ).toBe(false);

    const zero = calculateBtu({
      mode: "cooling",
      area: 0,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "normal",
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error).toBe("zero");

    const neg = calculateBtu({
      mode: "heating",
      area: -10,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      climate: "mild",
      btuPerSqFt: 30,
      ...common,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");
  });

  it("results are identical under different TZ values", () => {
    const input = {
      mode: "cooling" as const,
      area: 300,
      areaUnit: "sqft" as const,
      ceiling: 8,
      heightUnit: "ft" as const,
      btuPerSqFt: 20,
      sun: "normal" as const,
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    };
    const a = calculateBtu(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateBtu(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateBtu(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("never returns NaN or Infinity on success", () => {
    const result = calculateBtu({
      mode: "cooling",
      area: 300,
      areaUnit: "sqft",
      ceiling: 8,
      heightUnit: "ft",
      btuPerSqFt: 20,
      sun: "normal",
      sunFraction: 0,
      people: 2,
      btuPerExtraPerson: 600,
      kitchen: false,
      kitchenBtu: 4000,
      ...common,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number.isFinite(result.requiredBtuExact)).toBe(true);
    expect(Number.isFinite(result.requiredBtuRounded)).toBe(true);
    expect(Number.isFinite(result.kw)).toBe(true);
    expect(Number.isFinite(result.tons)).toBe(true);
  });

  it("convert and helpers stay consistent", () => {
    expect(roundBtuToNearest100(5381.96)).toBe(5400);
    expect(btuHToTons(18000)).toBe(1.5);
    expect(btuHToKw(6000).toFixed(2)).toBe("1.76");
    const conv = convertBtuH(18000);
    expect(conv.ok).toBe(true);
    if (!conv.ok) return;
    expect(conv.tons).toBe(1.5);
  });
});
