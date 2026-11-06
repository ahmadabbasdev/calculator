import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  calculateOvulation,
  formatDisplayDateWithWeekday,
  toDateInputValue,
} from "@/lib/utils/ovulation";

function iso(d: Date): string {
  return toDateInputValue(d);
}

describe("calculateOvulation — hand-checked cycles", () => {
  it("LMP 2026-01-01, cycle 28, luteal 14", () => {
    const r = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 28,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c0 = r.cycles[0]!;
    expect(iso(c0.nextPeriod)).toBe("2026-01-29");
    expect(iso(c0.ovulation)).toBe("2026-01-15");
    expect(iso(c0.fertileStart)).toBe("2026-01-10");
    expect(iso(c0.fertileEnd)).toBe("2026-01-15");
    expect(formatDisplayDateWithWeekday(c0.ovulation)).toMatch(/Thursday/);
  });

  it("LMP 2026-01-01, cycle 32, luteal 14", () => {
    const r = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 32,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c0 = r.cycles[0]!;
    expect(iso(c0.nextPeriod)).toBe("2026-02-02");
    expect(iso(c0.ovulation)).toBe("2026-01-19");
    expect(iso(c0.fertileStart)).toBe("2026-01-14");
    expect(iso(c0.fertileEnd)).toBe("2026-01-19");
  });

  it("LMP 2026-01-01, cycle 35, luteal 12", () => {
    const r = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 35,
      lutealLength: 12,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c0 = r.cycles[0]!;
    expect(iso(c0.nextPeriod)).toBe("2026-02-05");
    expect(iso(c0.ovulation)).toBe("2026-01-24");
    expect(iso(c0.fertileStart)).toBe("2026-01-19");
    expect(iso(c0.fertileEnd)).toBe("2026-01-24");
  });

  it("next-cycle rows advance by the cycle length", () => {
    const r = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 28,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cycles).toHaveLength(4);
    expect(iso(r.cycles[1]!.periodStart)).toBe("2026-01-29");
    expect(iso(r.cycles[1]!.ovulation)).toBe("2026-02-12");
    expect(iso(r.cycles[2]!.periodStart)).toBe("2026-02-26");
    expect(iso(r.cycles[3]!.periodStart)).toBe("2026-03-26");
  });

  it("handles leap-year LMP and month boundaries", () => {
    const r = calculateOvulation({
      lmpDate: "2024-02-20",
      cycleLength: 28,
      lutealLength: 14,
      today: new Date(2024, 2, 1),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(iso(r.cycles[0]!.nextPeriod)).toBe("2024-03-19");
    expect(iso(r.cycles[0]!.ovulation)).toBe("2024-03-05");
    expect(iso(r.cycles[0]!.fertileStart)).toBe("2024-02-29");
    expect(iso(r.cycles[0]!.fertileEnd)).toBe("2024-03-05");
  });

  it("rejects out-of-range cycle and luteal lengths", () => {
    const cycle = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 20,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(cycle.ok).toBe(false);
    if (!cycle.ok) expect(cycle.error).toBe("cycle_out_of_range");

    const luteal = calculateOvulation({
      lmpDate: "2026-01-01",
      cycleLength: 28,
      lutealLength: 9,
      today: new Date(2026, 0, 10),
    });
    expect(luteal.ok).toBe(false);
    if (!luteal.ok) expect(luteal.error).toBe("luteal_out_of_range");
  });

  it("rejects future LMP when today is provided", () => {
    const r = calculateOvulation({
      lmpDate: "2026-06-01",
      cycleLength: 28,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("future_lmp");
  });

  it("allows past LMP dates", () => {
    const r = calculateOvulation({
      lmpDate: "2025-06-01",
      cycleLength: 28,
      lutealLength: 14,
      today: new Date(2026, 0, 10),
    });
    expect(r.ok).toBe(true);
  });
});

describe("timezone stability", () => {
  it("returns the same ISO dates under UTC and Asia/Karachi", () => {
    const code = `
const { addDays, format, parseISO, startOfDay, isValid } = require("date-fns");
function parseLocalDate(value) {
  const parsed = parseISO(String(value).trim());
  return isValid(parsed) ? startOfDay(parsed) : null;
}
function iso(d) { return format(d, "yyyy-MM-dd"); }
const lmp = parseLocalDate("2026-01-01");
const next = addDays(lmp, 28);
const ov = addDays(next, -14);
const start = addDays(ov, -5);
console.log([iso(next), iso(ov), iso(start), iso(ov)].join("|"));
`;

    const utc = spawnSync(process.execPath, ["-e", code], {
      env: { ...process.env, TZ: "UTC" },
      encoding: "utf8",
    });
    const karachi = spawnSync(process.execPath, ["-e", code], {
      env: { ...process.env, TZ: "Asia/Karachi" },
      encoding: "utf8",
    });
    expect(utc.status).toBe(0);
    expect(karachi.status).toBe(0);
    expect(utc.stdout.trim()).toBe(
      "2026-01-29|2026-01-15|2026-01-10|2026-01-15",
    );
    expect(karachi.stdout.trim()).toBe(utc.stdout.trim());
  });
});
