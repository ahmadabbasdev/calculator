import { describe, expect, it } from "vitest";
import {
  calculateAddSubtract,
  calculateTimeBetween,
  calculateTimecard,
  durationFromMinutes,
  formatClockTime,
  formatDecimalHours,
  formatDurationCompact,
  formatDurationLong,
  parseDateInput,
  parseTimeInput,
} from "@/lib/utils/time-duration";

describe("parseTimeInput", () => {
  it("parses HH:MM", () => {
    expect(parseTimeInput("09:00")).toEqual({
      hours: 9,
      minutes: 0,
      minutesFromMidnight: 540,
    });
    expect(parseTimeInput("17:30")).toEqual({
      hours: 17,
      minutes: 30,
      minutesFromMidnight: 1050,
    });
  });

  it("rejects invalid times", () => {
    expect(parseTimeInput("")).toBeNull();
    expect(parseTimeInput("25:00")).toBeNull();
    expect(parseTimeInput("12:60")).toBeNull();
  });
});

describe("parseDateInput (UTC-stable)", () => {
  it("parses calendar dates via Date.UTC", () => {
    expect(parseDateInput("2026-03-15")).toBe(
      Date.UTC(2026, 2, 15) / (24 * 60 * 60 * 1000),
    );
  });

  it("rejects invalid dates", () => {
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });
});

describe("calculateTimeBetween", () => {
  it("09:00 to 17:30 = 8 h 30 min = 510 minutes = 8.5 decimal hours", () => {
    const r = calculateTimeBetween({
      startTime: "09:00",
      endTime: "17:30",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.duration.totalMinutes).toBe(510);
    expect(r.duration.hours).toBe(8);
    expect(r.duration.minutes).toBe(30);
    expect(r.duration.decimalHours).toBe(8.5);
    expect(formatDecimalHours(r.duration)).toBe("8.50");
    expect(formatDurationLong(r.duration)).toBe("8 hours 30 minutes");
    expect(formatDurationCompact(r.duration)).toBe("8 h 30 min");
  });

  it("22:00 to 06:00 overnight = 8 h 00 min", () => {
    const r = calculateTimeBetween({
      startTime: "22:00",
      endTime: "06:00",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.overnight).toBe(true);
    expect(r.nextDayNote).toBe("End time is on the next day");
    expect(r.duration.totalMinutes).toBe(480);
    expect(formatDurationCompact(r.duration)).toBe("8 h 00 min");
  });

  it("09:00 to 17:00 with 30 minute break = 7 h 30 min = 7.5", () => {
    const r = calculateTimeBetween({
      startTime: "09:00",
      endTime: "17:00",
      startDate: "",
      endDate: "",
      breakMinutes: 30,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.duration.totalMinutes).toBe(450);
    expect(r.duration.decimalHours).toBe(7.5);
    expect(r.working).toContain("minus 30 min break");
  });

  it("same start and end = 0 minutes", () => {
    const r = calculateTimeBetween({
      startTime: "12:00",
      endTime: "12:00",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.duration.totalMinutes).toBe(0);
  });

  it("same start and end with next-day box = 24 h 00 min", () => {
    const r = calculateTimeBetween({
      startTime: "12:00",
      endTime: "12:00",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.duration.totalMinutes).toBe(1440);
    expect(formatDurationCompact(r.duration)).toBe("24 h 00 min");
  });

  it("break longer than duration returns error, never negative", () => {
    const r = calculateTimeBetween({
      startTime: "09:00",
      endTime: "10:00",
      startDate: "",
      endDate: "",
      breakMinutes: 90,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("break_exceeds");
    expect(r.message.toLowerCase()).toContain("break");
  });

  it("overnight override off returns an error, not a negative duration", () => {
    const r = calculateTimeBetween({
      startTime: "22:00",
      endTime: "06:00",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("end_before_start");
  });

  it("dated multi-day span uses Date.UTC arithmetic", () => {
    const r = calculateTimeBetween({
      startTime: "09:00",
      endTime: "09:00",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      breakMinutes: 0,
      treatEndAsNextDay: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.duration.totalMinutes).toBe(1440);
  });
});

describe("calculateAddSubtract", () => {
  it("10:30 + 2 h 45 min = 13:15, same day", () => {
    const r = calculateAddSubtract({
      startTime: "10:30",
      startDate: "",
      days: 0,
      hours: 2,
      minutes: 45,
      operation: "add",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resultTime.hours).toBe(13);
    expect(r.resultTime.minutes).toBe(15);
    expect(r.dayOffset).toBe(0);
    expect(formatClockTime(r.resultTime, "24h")).toBe("13:15");
  });

  it("00:30 − 90 minutes = 23:00, previous day", () => {
    const r = calculateAddSubtract({
      startTime: "00:30",
      startDate: "",
      days: 0,
      hours: 1,
      minutes: 30,
      operation: "subtract",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatClockTime(r.resultTime, "24h")).toBe("23:00");
    expect(r.dayOffset).toBe(-1);
    expect(r.dayLabel).toBe("previous day");
  });

  it("23:30 + 1 h 45 min = 01:15, next day", () => {
    const r = calculateAddSubtract({
      startTime: "23:30",
      startDate: "",
      days: 0,
      hours: 1,
      minutes: 45,
      operation: "add",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatClockTime(r.resultTime, "24h")).toBe("01:15");
    expect(r.dayOffset).toBe(1);
    expect(r.dayLabel).toBe("next day");
  });

  it("caps days at 3650", () => {
    const r = calculateAddSubtract({
      startTime: "12:00",
      startDate: "",
      days: 3651,
      hours: 0,
      minutes: 0,
      operation: "add",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("days_cap");
  });
});

describe("calculateTimecard", () => {
  it("8 h 00 + 7 h 30 + 4 h 15 = 19 h 45 min = 19.75", () => {
    const r = calculateTimecard([
      {
        id: "1",
        label: "Mon",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 0,
      },
      {
        id: "2",
        label: "Tue",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
      },
      {
        id: "3",
        label: "Wed",
        startTime: "08:00",
        endTime: "12:15",
        breakMinutes: 0,
      },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total.totalMinutes).toBe(19 * 60 + 45);
    expect(r.total.decimalHours).toBe(19.75);
    expect(formatDurationCompact(r.total)).toBe("19 h 45 min");
    expect(r.filledRowCount).toBe(3);
  });

  it("marks overnight rows", () => {
    const r = calculateTimecard([
      {
        id: "1",
        label: "Night",
        startTime: "22:00",
        endTime: "06:00",
        breakMinutes: 0,
      },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].overnight).toBe(true);
    expect(r.rows[0].duration?.totalMinutes).toBe(480);
  });
});

describe("TZ stability", () => {
  it("results match under reported process TZ (wall-clock UTC math)", () => {
    // Explicit sanity: overnight and dated spans must not depend on local offset.
    const overnight = calculateTimeBetween({
      startTime: "22:00",
      endTime: "06:00",
      startDate: "",
      endDate: "",
      breakMinutes: 0,
      treatEndAsNextDay: true,
    });
    expect(overnight.ok && overnight.duration.totalMinutes).toBe(480);

    const dated = calculateTimeBetween({
      startTime: "00:00",
      endTime: "00:00",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      breakMinutes: 0,
      treatEndAsNextDay: false,
    });
    expect(dated.ok && dated.duration.totalMinutes).toBe(1440);

    const add = calculateAddSubtract({
      startTime: "23:30",
      startDate: "2026-03-28",
      days: 0,
      hours: 2,
      minutes: 0,
      operation: "add",
    });
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    expect(formatClockTime(add.resultTime, "24h")).toBe("01:30");
    expect(add.resultDate).toBe("2026-03-29");
  });

  it("durationFromMinutes never returns negatives", () => {
    expect(durationFromMinutes(-10).totalMinutes).toBe(0);
  });
});
