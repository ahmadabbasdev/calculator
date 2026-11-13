import { describe, expect, it } from "vitest";
import {
  calculateBatteryBackup,
  convertVaWatts,
  formatRuntimeLabel,
  hoursToHoursMinutes,
  runtimeReferenceRow,
} from "./battery-backup";

describe("runtime hand-checks", () => {
  it("12 V 150 Ah, usable 50%, health 100%, eff 85%, load 300 W → 900 Wh, 2.55 h", () => {
    const result = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "runtime") return;
    expect(result.nominalWh).toBeCloseTo(1800, 10);
    expect(result.usableWh).toBeCloseTo(900, 10);
    expect(result.runtimeHours).toBeCloseTo(2.55, 10);
    expect(result.runtimeWholeHours).toBe(2);
    expect(result.runtimeMinutes).toBe(33);
    expect(formatRuntimeLabel(result.runtimeHours)).toBe("2 h 33 min");
  });

  it("same with usable 100% and efficiency 100% → 6.00 h", () => {
    const result = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 100,
      healthPercent: 100,
      efficiencyPercent: 100,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "runtime") return;
    expect(result.usableWh).toBeCloseTo(1800, 10);
    expect(result.runtimeHours).toBeCloseTo(6, 10);
  });

  it("two 12 V 100 Ah in series (24 V, 100 Ah) → 1,200 Wh; 2.55 h", () => {
    const result = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 100,
      series: 2,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 400,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "runtime") return;
    expect(result.packVoltage).toBeCloseTo(24, 10);
    expect(result.packAh).toBeCloseTo(100, 10);
    expect(result.usableWh).toBeCloseTo(1200, 10);
    expect(result.runtimeHours).toBeCloseTo(2.55, 10);
  });

  it("two in parallel (12 V, 200 Ah) → 1,200 Wh; 2.55 h", () => {
    const result = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 100,
      series: 1,
      strings: 2,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 400,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "runtime") return;
    expect(result.packVoltage).toBeCloseTo(12, 10);
    expect(result.packAh).toBeCloseTo(200, 10);
    expect(result.usableWh).toBeCloseTo(1200, 10);
    expect(result.runtimeHours).toBeCloseTo(2.55, 10);
  });

  it("health 80% on the first case → 720 Wh; 2.04 h = 2 h 2 min", () => {
    const result = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 80,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "runtime") return;
    expect(result.usableWh).toBeCloseTo(720, 10);
    expect(result.runtimeHours).toBeCloseTo(2.04, 10);
    expect(hoursToHoursMinutes(result.runtimeHours)).toEqual({
      hours: 2,
      minutes: 2,
    });
  });
});

describe("needed pack hand-checks", () => {
  it("500 W for 4 h → 4,705.88 Wh; 24 V / 12 V 150 Ah → 2×2 = 4 batteries, 6.12 h", () => {
    const result = calculateBatteryBackup({
      mode: "needed",
      loadWatts: 500,
      appliances: null,
      loadMode: "watts",
      backupHours: 4,
      systemVoltage: 24,
      batteryVoltage: 12,
      batteryAh: 150,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      inverterRatingWatts: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== "needed") return;
    expect(Number(result.requiredWh.toFixed(2))).toBe(4705.88);
    expect(Number(result.requiredPackAh.toFixed(2))).toBe(196.08);
    expect(result.series).toBe(2);
    expect(result.strings).toBe(2);
    expect(result.totalBatteries).toBe(4);
    expect(result.actualRuntimeHours).toBeCloseTo(6.12, 10);
  });
});

describe("VA helper, warnings, edges", () => {
  it("1,000 VA at PF 0.7 = 700 W; 700 W at 0.7 = 1,000 VA", () => {
    const toW = convertVaWatts({
      direction: "va-to-w",
      va: 1000,
      watts: null,
      powerFactor: 0.7,
    });
    expect(toW.ok).toBe(true);
    if (!toW.ok) return;
    expect(toW.watts).toBeCloseTo(700, 10);

    const toVa = convertVaWatts({
      direction: "w-to-va",
      va: null,
      watts: 700,
      powerFactor: 0.7,
    });
    expect(toVa.ok).toBe(true);
    if (!toVa.ok) return;
    expect(toVa.va).toBeCloseTo(1000, 10);
  });

  it("load above inverter rating shows warning; voltage mismatch message", () => {
    const over = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 900,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: 800,
    });
    expect(over.ok).toBe(true);
    if (!over.ok || over.mode !== "runtime") return;
    expect(over.inverterWarning).toBe(true);

    const mismatch = calculateBatteryBackup({
      mode: "needed",
      loadWatts: 500,
      appliances: null,
      loadMode: "watts",
      backupHours: 4,
      systemVoltage: 24,
      batteryVoltage: 10,
      batteryAh: 150,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      inverterRatingWatts: null,
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) {
      expect(mismatch.error).toBe("voltage_mismatch");
      expect(mismatch.message.toLowerCase()).toContain("divide evenly");
    }
  });

  it("invalid inputs return error states; never NaN/Infinity; TZ stable", () => {
    const neg = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: -12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.error).toBe("negative");

    const badPct = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 0,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(badPct.ok).toBe(false);
    if (!badPct.ok) expect(badPct.error).toBe("percent");

    const empty = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: null,
      batteryAh: null,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: null,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("empty");

    const ok = calculateBatteryBackup({
      mode: "runtime",
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts",
      inverterRatingWatts: null,
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok || ok.mode !== "runtime") return;
    expect(Number.isFinite(ok.usableWh)).toBe(true);
    expect(Number.isFinite(ok.runtimeHours)).toBe(true);
    expect(Number.isNaN(ok.runtimeHours)).toBe(false);

    const input = {
      mode: "runtime" as const,
      batteryVoltage: 12,
      batteryAh: 150,
      series: 1,
      strings: 1,
      usablePercent: 50,
      healthPercent: 100,
      efficiencyPercent: 85,
      loadWatts: 300,
      appliances: null,
      loadMode: "watts" as const,
      inverterRatingWatts: null,
    };
    const a = calculateBatteryBackup(input);
    const prev = process.env.TZ;
    process.env.TZ = "America/New_York";
    const b = calculateBatteryBackup(input);
    process.env.TZ = "Asia/Tokyo";
    const c = calculateBatteryBackup(input);
    process.env.TZ = prev;
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    const row = runtimeReferenceRow({
      batteryVoltage: 12,
      batteryAh: 150,
      loadWatts: 300,
    });
    expect(row.usableWh).toBeCloseTo(900, 10);
    expect(row.runtimeHours).toBeCloseTo(2.55, 10);
  });
});
