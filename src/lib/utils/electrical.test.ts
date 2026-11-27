import { describe, expect, it } from "vitest";
import {
  SQRT3,
  ampsFromKva,
  ampsToWatts,
  calculateElectrical,
  kvaFromAmps,
  kvaToKw,
  kwToKva,
  wattsAmpsReferenceRow,
  wattsToAmps,
} from "./electrical";

describe("watts and amps hand-checks", () => {
  it("DC 12 V, 60 W → 5 A", () => {
    const result = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "dc",
      voltage: 12,
      watts: 60,
      amps: null,
      powerFactor: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "watts-amps") return;
    expect(result.amps).toBeCloseTo(5, 10);
    expect(wattsToAmps(60, 12, "dc", 1)).toBeCloseTo(5, 10);
  });

  it("single-phase 1,000 W, 230 V, PF 1.00 → 4.3478 A; PF 0.8 → 5.4348 A", () => {
    const pf1 = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "single",
      voltage: 230,
      watts: 1000,
      amps: null,
      powerFactor: 1,
    });
    expect(pf1.ok).toBe(true);
    if (!pf1.ok || pf1.tab !== "watts-amps") return;
    expect(Number(pf1.amps.toFixed(4))).toBe(4.3478);
    expect(Number(pf1.amps.toFixed(2))).toBe(4.35);

    const pf08 = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "single",
      voltage: 230,
      watts: 1000,
      amps: null,
      powerFactor: 0.8,
    });
    expect(pf08.ok).toBe(true);
    if (!pf08.ok || pf08.tab !== "watts-amps") return;
    expect(Number(pf08.amps.toFixed(4))).toBe(5.4348);
    expect(Number(pf08.amps.toFixed(2))).toBe(5.43);
  });

  it("three-phase 10,000 W, 400 V, PF 0.8 → 18.0422 A", () => {
    const result = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "three",
      voltage: 400,
      watts: 10_000,
      amps: null,
      powerFactor: 0.8,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "watts-amps") return;
    expect(Number(result.amps.toFixed(4))).toBe(18.0422);
    expect(Number(result.amps.toFixed(2))).toBe(18.04);
  });

  it("amps to watts: 10 A, 120 V, PF 1 → 1,200 W", () => {
    const result = calculateElectrical({
      tab: "watts-amps",
      direction: "amps-to-watts",
      circuit: "single",
      voltage: 120,
      watts: null,
      amps: 10,
      powerFactor: 1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "watts-amps") return;
    expect(result.watts).toBeCloseTo(1200, 10);
    expect(ampsToWatts(10, 120, "single", 1)).toBeCloseTo(1200, 10);
  });
});

describe("kVA and kW hand-checks", () => {
  it("5 kVA at PF 0.8 → 4 kW; 4 kW at PF 0.8 → 5 kVA", () => {
    const toKw = calculateElectrical({
      tab: "kva-kw",
      direction: "kva-to-kw",
      circuit: "single",
      voltage: null,
      kva: 5,
      kw: null,
      amps: null,
      powerFactor: 0.8,
    });
    expect(toKw.ok).toBe(true);
    if (!toKw.ok || toKw.tab !== "kva-kw") return;
    expect(toKw.kw).toBeCloseTo(4, 10);
    expect(kvaToKw(5, 0.8)).toBeCloseTo(4, 10);

    const toKva = calculateElectrical({
      tab: "kva-kw",
      direction: "kw-to-kva",
      circuit: "single",
      voltage: null,
      kva: null,
      kw: 4,
      amps: null,
      powerFactor: 0.8,
    });
    expect(toKva.ok).toBe(true);
    if (!toKva.ok || toKva.tab !== "kva-kw") return;
    expect(toKva.kva).toBeCloseTo(5, 10);
    expect(kwToKva(4, 0.8)).toBeCloseTo(5, 10);
  });

  it("three-phase 400 V, 20 A → 13.856 kVA and 11.085 kW at PF 0.8", () => {
    const result = calculateElectrical({
      tab: "kva-kw",
      direction: "amps-to-kva",
      circuit: "three",
      voltage: 400,
      kva: null,
      kw: null,
      amps: 20,
      powerFactor: 0.8,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "kva-kw") return;
    expect(Number(result.kva.toFixed(3))).toBe(13.856);
    expect(Number(result.apparentVa.toFixed(2))).toBe(13856.41);
    expect(result.kw).not.toBeNull();
    expect(Number(result.kw!.toFixed(3))).toBe(11.085);
    expect(kvaFromAmps(20, 400, "three")).toBeCloseTo(SQRT3 * 400 * 20 / 1000, 10);
    expect(ampsFromKva(13.8564064, 400, "three")).toBeCloseTo(20, 4);
  });
});

describe("Ohm's law hand-checks", () => {
  it("V 12, R 6 → I 2 A and P 24 W", () => {
    const result = calculateElectrical({
      tab: "ohms",
      voltage: 12,
      current: null,
      resistance: 6,
      power: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "ohms") return;
    expect(result.current).toBeCloseTo(2, 10);
    expect(result.power).toBeCloseTo(24, 10);
  });

  it("P 100 W, V 230 V → I 0.4348 A and R 529 Ω", () => {
    const result = calculateElectrical({
      tab: "ohms",
      voltage: 230,
      current: null,
      resistance: null,
      power: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.tab !== "ohms") return;
    expect(Number(result.current.toFixed(4))).toBe(0.4348);
    expect(result.resistance).toBeCloseTo(529, 10);
  });
});

describe("edge cases / TZ", () => {
  it("invalid inputs return error states; never NaN/Infinity; TZ stable", () => {
    const empty = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "dc",
      voltage: null,
      watts: 60,
      amps: null,
      powerFactor: null,
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");

    const neg = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "dc",
      voltage: -12,
      watts: 60,
      amps: null,
      powerFactor: null,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const badPf = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "single",
      voltage: 230,
      watts: 1000,
      amps: null,
      powerFactor: 1.2,
    });
    expect(badPf.ok).toBe(false);
    if (!badPf.ok) expect(badPf.error).toBe("power_factor");

    const zeroPf = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "single",
      voltage: 230,
      watts: 1000,
      amps: null,
      powerFactor: 0,
    });
    expect(zeroPf.ok).toBe(false);
    if (!zeroPf.ok) expect(zeroPf.error).toBe("power_factor");

    const ok = calculateElectrical({
      tab: "watts-amps",
      direction: "watts-to-amps",
      circuit: "dc",
      voltage: 12,
      watts: 60,
      amps: null,
      powerFactor: null,
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok || ok.tab !== "watts-amps") return;
    expect(Number.isFinite(ok.amps)).toBe(true);
    expect(Number.isNaN(ok.amps)).toBe(false);

    const input = {
      tab: "watts-amps" as const,
      direction: "watts-to-amps" as const,
      circuit: "single" as const,
      voltage: 230,
      watts: 1000,
      amps: null,
      powerFactor: 1,
    };
    const a = calculateElectrical(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateElectrical(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateElectrical(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    const row = wattsAmpsReferenceRow({ watts: 1000, voltage: 230 });
    expect(Number(row.amps.toFixed(4))).toBe(4.3478);
  });
});
