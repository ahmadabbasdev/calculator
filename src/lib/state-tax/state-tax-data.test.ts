import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import {
  buildStateFaqs,
  buildStatePageSections,
  assertStateFaqsUnique,
} from "@/lib/state-tax/content";
import { buildLlmsTxt, LIVE_CALCULATORS } from "@/lib/calculators";
import { SHOW_STATE_TAX_PILOT } from "@/lib/state-tax/config";
import {
  TESTLAND_CODE,
  assertUniqueFactsAcrossStates,
  assertUniqueMetaDescriptions,
  assertUniqueStateMetaDescriptions,
  assertWaveCaps,
  buildStateMetaDescription,
  buildVerifiedStateLlmsLines,
  getPublishBlockReason,
  getPublishedTaxableStates,
  getVerifiedStateBySlug,
  getVerifiedStateSitemapEntries,
  getVerifiedStates,
  getVerifiedTaxableStates,
  loadAllStateTaxFiles,
  loadRoster,
  stateCodeToSlug,
} from "@/lib/state-tax/load";
import {
  parseStateTaxData,
  type StateTaxData,
} from "@/lib/state-tax/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  isCandidate,
  isStale,
  jaccard,
  metaDescription,
  shingles,
  SIMILARITY_FLAG,
  title,
  uniqueWordsOutsideCalculator,
} from "../../../scripts/states-audit.mjs";

const ZZ_PATH = path.join(process.cwd(), "data", "state-tax", "ZZ.json");
const NO_WAGE = new Set([
  "AK",
  "FL",
  "NV",
  "NH",
  "SD",
  "TN",
  "TX",
  "WA",
  "WY",
]);

function loadTestlandRaw(): StateTaxData {
  return JSON.parse(fs.readFileSync(ZZ_PATH, "utf8")) as StateTaxData;
}

function baseVerifiedRaw(
  overrides: Partial<StateTaxData> = {},
): StateTaxData {
  const day = new Date().toISOString().slice(0, 10);
  return {
    ...loadTestlandRaw(),
    code: "AA",
    name: "Audit State",
    verified: true,
    lastVerified: day,
    taxYear: 2026,
    wave: 1,
    modelFit: "good",
    modelFitReason: "Fits for tests.",
    limits: [],
    sources: [{ label: "Audit Revenue", url: "https://example.test/audit" }],
    notes: [
      { text: "Audit note one.", sourceUrl: "https://example.test/n1" },
      { text: "Audit note two.", sourceUrl: "https://example.test/n2" },
    ],
    facts: [
      {
        label: "F1",
        text: "Unique fact one for audit state.",
        sourceUrl: "https://example.test/f1",
      },
      {
        label: "F2",
        text: "Unique fact two for audit state.",
        sourceUrl: "https://example.test/f2",
      },
      {
        label: "F3",
        text: "Unique fact three for audit state.",
        sourceUrl: "https://example.test/f3",
      },
      {
        label: "F4",
        text: "Unique fact four for audit state.",
        sourceUrl: "https://example.test/f4",
      },
    ],
    ...overrides,
  } as StateTaxData;
}

function baseVerified(overrides: Partial<StateTaxData> = {}): StateTaxData {
  return parseStateTaxData(baseVerifiedRaw(overrides), "test.json");
}

describe("roster integrity", () => {
  it("has 51 entries, unique codes, and exactly nine no-wage-tax states", () => {
    const roster = loadRoster();
    expect(roster).toHaveLength(51);
    const codes = roster.map((e) => e.code);
    expect(new Set(codes).size).toBe(51);
    const noWage = roster.filter((e) => e.status === "no-wage-tax");
    expect(noWage).toHaveLength(9);
    expect(noWage.map((e) => e.code).sort()).toEqual([...NO_WAGE].sort());
    for (const entry of noWage) {
      expect(entry.taxesWages).toBe(false);
      expect(entry.structure).toBe("none");
    }
    for (const entry of roster.filter((e) => e.status !== "no-wage-tax")) {
      expect(entry.taxesWages).toBe(true);
    }
  });

  it("links IL, NC, and VA to verified data-file status", () => {
    const roster = loadRoster();
    for (const code of ["IL", "NC", "VA"] as const) {
      const entry = roster.find((e) => e.code === code)!;
      const file = loadAllStateTaxFiles().find((s) => s.code === code)!;
      expect(entry.structure).toBe(file.structure);
      expect(entry.modelFit).toBe(file.modelFit);
      expect(entry.wave).toBe(file.wave);
      expect(entry.status).toBe(file.verified ? "verified" : "data-ready");
      expect(JSON.stringify(entry)).not.toMatch(/\d+\.\d{2,}/);
    }
  });
});

describe("publish gating", () => {
  it("publishes IL, NC, and VA while the pilot is on", () => {
    expect(SHOW_STATE_TAX_PILOT).toBe(true);
    expect(getPublishedTaxableStates().map((s) => s.code).sort()).toEqual([
      "IL",
      "NC",
      "VA",
    ]);
    expect(
      LIVE_CALCULATORS.some((c) => c.id === "state-income-tax"),
    ).toBe(true);
    expect(getVerifiedStateSitemapEntries(SITE_URL).length).toBe(3);
  });

  it("hides state pages when the pilot is mocked off in production", async () => {
    vi.resetModules();
    vi.doMock("@/lib/state-tax/config", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/lib/state-tax/config")>();
      return { ...actual, SHOW_STATE_TAX_PILOT: false };
    });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");

    const {
      getPublishedTaxableStates: getPublished,
      getPublishedStateBySlug,
      getVerifiedStateSitemapEntries: getSitemap,
      buildVerifiedStateLlmsLines: getLlms,
      canAccessStatePage,
      loadAllStateTaxFiles,
    } = await import("@/lib/state-tax/load");
    const { LIVE_CALCULATORS: live } = await import("@/lib/calculators");

    expect(getPublished()).toEqual([]);
    expect(getSitemap(SITE_URL)).toEqual([]);
    expect(getLlms(SITE_URL)).toEqual([]);
    expect(live.some((c) => c.id === "state-income-tax")).toBe(false);
    const il = loadAllStateTaxFiles().find((s) => s.code === "IL")!;
    expect(canAccessStatePage(il)).toBe(false);
    expect(getPublishedStateBySlug("illinois")).toBeNull();

    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/state-tax/config");
    vi.resetModules();
  });

  it("blocks unverified, poor-fit, stale, over-wave, and incomplete states", () => {
    expect(getPublishBlockReason(loadTestlandRaw())).toBe("testland");
    expect(
      getPublishBlockReason(baseVerifiedRaw({ verified: false, code: "AB" })),
    ).toBe("unverified");
    expect(
      getPublishBlockReason(
        baseVerifiedRaw({
          code: "AC",
          modelFit: "poor",
          modelFitReason: "Local tax.",
        }),
      ),
    ).toBe("poor-fit");
    expect(
      getPublishBlockReason(baseVerifiedRaw({ code: "AD", wave: 99 })),
    ).toBe("wave");
    expect(
      getPublishBlockReason(
        baseVerifiedRaw({ code: "AE", lastVerified: "2020-01-01" }),
      ),
    ).toBe("stale");
    expect(
      getPublishBlockReason(baseVerifiedRaw({ code: "AF", taxYear: 2019 })),
    ).toBe("tax-year");
    expect(
      getPublishBlockReason(
        baseVerifiedRaw({
          code: "AG",
          notes: [
            { text: "Only one note.", sourceUrl: "https://example.test/1" },
          ],
        }),
      ),
    ).toBe("notes");
  });

  it("never surfaces Testland anywhere public", () => {
    expect(getVerifiedStates().some((s) => s.code === TESTLAND_CODE)).toBe(
      false,
    );
    expect(getVerifiedStateBySlug("zz")).toBeNull();
    const slug = stateCodeToSlug(TESTLAND_CODE);
    const sitemapUrls = getVerifiedStateSitemapEntries(SITE_URL).map(
      (e) => e.url,
    );
    expect(sitemapUrls.some((url) => url.includes(`/${slug}`))).toBe(false);
    const llms =
      buildLlmsTxt({ siteName: SITE_NAME, siteUrl: SITE_URL }) +
      buildVerifiedStateLlmsLines(SITE_URL).join("\n");
    expect(llms.toLowerCase()).not.toContain("testland");
  });
});

describe("schema gates", () => {
  it("requires at least four facts on verified states", () => {
    const raw = {
      ...loadTestlandRaw(),
      verified: true,
      code: "AH",
      name: "Half Facts",
      lastVerified: new Date().toISOString().slice(0, 10),
      facts: loadTestlandRaw().facts.slice(0, 2),
      sources: [{ label: "Dept", url: "https://example.test/rev" }],
      notes: [
        { text: "Note one about brackets.", sourceUrl: "https://example.test/1" },
        { text: "Note two about deductions.", sourceUrl: "https://example.test/2" },
      ],
    };
    expect(() => parseStateTaxData(raw, "half-facts.json")).toThrow(/four facts/i);
  });

  it("rejects duplicate facts and duplicate meta descriptions", () => {
    const a = baseVerified({
      code: "AI",
      name: "Alpha",
      facts: [
        { label: "A", text: "Shared duplicate fact text.", sourceUrl: "https://example.test/a" },
        { label: "B", text: "Alpha only fact two.", sourceUrl: "https://example.test/a2" },
        { label: "C", text: "Alpha only fact three.", sourceUrl: "https://example.test/a3" },
        { label: "D", text: "Alpha only fact four.", sourceUrl: "https://example.test/a4" },
      ],
    });
    const b = baseVerified({
      code: "AJ",
      name: "Beta",
      structure: "flat",
      brackets: {
        single: [{ from: 0, to: null, rate: 0.03 }],
        married_joint: [{ from: 0, to: null, rate: 0.03 }],
        head_of_household: [{ from: 0, to: null, rate: 0.03 }],
      },
      standardDeduction: {
        single: 9000,
        married_joint: 18000,
        head_of_household: 12000,
      },
      facts: [
        { label: "A", text: "Shared duplicate fact text.", sourceUrl: "https://example.test/b" },
        { label: "B", text: "Beta only fact two.", sourceUrl: "https://example.test/b2" },
        { label: "C", text: "Beta only fact three.", sourceUrl: "https://example.test/b3" },
        { label: "D", text: "Beta only fact four.", sourceUrl: "https://example.test/b4" },
      ],
    });
    expect(() => assertUniqueFactsAcrossStates([a, b])).toThrow(/Duplicate fact/i);
    expect(buildStateMetaDescription(a)).not.toBe(buildStateMetaDescription(b));
    expect(() => assertUniqueMetaDescriptions([a, b])).not.toThrow();
    // Same description string twice (guards the uniqueness map).
    expect(() => assertUniqueMetaDescriptions([a, { ...a }])).toThrow(
      /Duplicate meta description/i,
    );
  });

  it("fails the wave cap when more than five verified states share a wave", () => {
    const codes = ["QA", "QB", "QC", "QD", "QE", "QF"];
    const waveMates = codes.map((code, i) =>
      baseVerifiedRaw({
        code,
        name: `Wave Mate ${code}`,
        wave: 7,
        facts: [
          {
            label: "1",
            text: `Wave mate ${code} fact one unique ${i}.`,
            sourceUrl: "https://example.test/1",
          },
          {
            label: "2",
            text: `Wave mate ${code} fact two unique ${i}.`,
            sourceUrl: "https://example.test/2",
          },
          {
            label: "3",
            text: `Wave mate ${code} fact three unique ${i}.`,
            sourceUrl: "https://example.test/3",
          },
          {
            label: "4",
            text: `Wave mate ${code} fact four unique ${i}.`,
            sourceUrl: "https://example.test/4",
          },
        ],
      }),
    );
    expect(() => assertWaveCaps(waveMates)).toThrow(/Wave 7 has 6/);
  });

  it("passes uniqueness for the current candidate set on disk", () => {
    expect(() => assertUniqueStateMetaDescriptions()).not.toThrow();
    const candidates = loadAllStateTaxFiles().filter(
      (s) =>
        s.code !== TESTLAND_CODE &&
        s.verified &&
        (s.modelFit === "good" || s.modelFit === "partial"),
    );
    expect(() => assertUniqueFactsAcrossStates(candidates)).not.toThrow();
    expect(() => assertWaveCaps(loadAllStateTaxFiles())).not.toThrow();
  });
});

describe("validation failures", () => {
  it("unsorted / non-contiguous brackets fail validation", () => {
    const raw = loadTestlandRaw();
    raw.brackets.single = [
      { from: 0, to: 10000, rate: 0.02 },
      { from: 15000, to: null, rate: 0.06 },
    ];
    expect(() => parseStateTaxData(raw, "unsorted.json")).toThrow(/contiguous/i);
  });

  it("stale lastVerified on verified state fails validation", () => {
    const raw = {
      ...loadTestlandRaw(),
      verified: true,
      lastVerified: "2020-01-01",
      sources: [{ label: "Dept", url: "https://example.test/rev" }],
      notes: [
        { text: "Note one about brackets.", sourceUrl: "https://example.test/1" },
        { text: "Note two about deductions.", sourceUrl: "https://example.test/2" },
      ],
    };
    expect(() => parseStateTaxData(raw, "stale.json")).toThrow(/400 days/i);
  });
});

describe("state page content gates", () => {
  it("taxable state pages expose at least 5 data-driven sections", () => {
    const sample = baseVerified({ code: "AL", name: "Auditland" });
    const sections = buildStatePageSections(sample);
    expect(sections.length).toBeGreaterThanOrEqual(5);
  });

  it("FAQ and meta text stay unique across distinct verified-like states", () => {
    const a = baseVerified({
      code: "AM",
      name: "Alpha Meta",
      standardDeduction: {
        single: 1000,
        married_joint: 2000,
        head_of_household: 1500,
      },
      facts: [
        { label: "1", text: "Alpha meta fact one.", sourceUrl: "https://example.test/1" },
        { label: "2", text: "Alpha meta fact two.", sourceUrl: "https://example.test/2" },
        { label: "3", text: "Alpha meta fact three.", sourceUrl: "https://example.test/3" },
        { label: "4", text: "Alpha meta fact four.", sourceUrl: "https://example.test/4" },
      ],
    });
    const b = baseVerified({
      code: "AN",
      name: "Beta Meta",
      structure: "flat",
      brackets: {
        single: [{ from: 0, to: null, rate: 0.03 }],
        married_joint: [{ from: 0, to: null, rate: 0.03 }],
        head_of_household: [{ from: 0, to: null, rate: 0.03 }],
      },
      standardDeduction: {
        single: 9000,
        married_joint: 18000,
        head_of_household: 12000,
      },
      facts: [
        { label: "1", text: "Beta meta fact one.", sourceUrl: "https://example.test/1" },
        { label: "2", text: "Beta meta fact two.", sourceUrl: "https://example.test/2" },
        { label: "3", text: "Beta meta fact three.", sourceUrl: "https://example.test/3" },
        { label: "4", text: "Beta meta fact four.", sourceUrl: "https://example.test/4" },
      ],
    });
    expect(buildStateMetaDescription(a)).not.toBe(buildStateMetaDescription(b));
    expect(() => assertStateFaqsUnique([a, b])).not.toThrow();
    expect(buildStateFaqs(a)[0]!.answer).not.toBe(buildStateFaqs(b)[0]!.answer);
  });
});

describe("states:audit script", () => {
  it("exports helpers and flags high similarity pairs", () => {
    const a = {
      code: "X1",
      name: "One",
      verified: true,
      modelFit: "good",
      structure: "flat",
      taxYear: 2026,
      lastVerified: "2026-11-04",
      notes: [
        {
          text: "The same shared editorial sentence appears here for testing overlap detection thoroughly.",
        },
      ],
      facts: [
        {
          text: "The same shared editorial sentence appears here for testing overlap detection thoroughly.",
        },
      ],
      limits: [],
      localTaxNote: "",
      sources: [{ label: "A" }],
      brackets: { single: [{ rate: 0.01 }] },
    };
    const b = {
      ...a,
      code: "X2",
      name: "Two",
      notes: [
        {
          text: "The same shared editorial sentence appears here for testing overlap detection thoroughly.",
        },
      ],
      facts: [
        {
          text: "The same shared editorial sentence appears here for testing overlap detection thoroughly.",
        },
      ],
    };
    expect(isCandidate(a)).toBe(true);
    expect(uniqueWordsOutsideCalculator(a)).toBeGreaterThan(0);
    const sim = jaccard(
      shingles(
        `${a.notes[0].text} ${a.facts[0].text}`,
      ),
      shingles(
        `${b.notes[0].text} ${b.facts[0].text}`,
      ),
    );
    expect(sim).toBeGreaterThan(SIMILARITY_FLAG);
    expect(title(a)).toContain("One");
    expect(metaDescription(a)).toContain("tax year");
    expect(
      isStale({
        verified: true,
        lastVerified: "2020-01-01",
        taxYear: 2026,
      }),
    ).toBe(true);
  });

  it("runs via npm and prints a summary", () => {
    const result = spawnSync("node", ["scripts/states-audit.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/candidates=/);
    expect(result.stdout).toMatch(/Stale states/);
  });
});
