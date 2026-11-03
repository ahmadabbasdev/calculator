import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildStateFaqs,
  buildStatePageSections,
  assertStateFaqsUnique,
} from "@/lib/state-tax/content";
import { buildLlmsTxt } from "@/lib/calculators";
import {
  TESTLAND_CODE,
  assertUniqueStateMetaDescriptions,
  buildStateMetaDescription,
  buildVerifiedStateLlmsLines,
  getVerifiedStateBySlug,
  getVerifiedStateSitemapEntries,
  getVerifiedStates,
  getVerifiedTaxableStates,
  loadAllStateTaxFiles,
  stateCodeToSlug,
} from "@/lib/state-tax/load";
import { parseStateTaxData, type StateTaxData } from "@/lib/state-tax/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const ZZ_PATH = path.join(process.cwd(), "data", "state-tax", "ZZ.json");

function loadTestlandRaw(): StateTaxData {
  return JSON.parse(fs.readFileSync(ZZ_PATH, "utf8")) as StateTaxData;
}

describe("state tax data loading and exclusion", () => {
  it("loads Testland with verified: false", () => {
    const all = loadAllStateTaxFiles();
    const zz = all.find((s) => s.code === TESTLAND_CODE);
    expect(zz).toBeTruthy();
    expect(zz!.verified).toBe(false);
    expect(zz!.name).toBe("Testland");
  });

  it("excludes Testland and unverified states from verified lists", () => {
    const verified = getVerifiedStates();
    expect(verified.some((s) => s.code === TESTLAND_CODE)).toBe(false);
    expect(verified.every((s) => s.verified)).toBe(true);
    expect(getVerifiedTaxableStates().some((s) => s.code === TESTLAND_CODE)).toBe(
      false,
    );
    expect(getVerifiedStateBySlug("zz")).toBeNull();
    expect(getVerifiedStateBySlug(stateCodeToSlug(TESTLAND_CODE))).toBeNull();
  });

  it("excludes Testland from routes, sitemap, hub lists, and llms.txt", () => {
    const slug = stateCodeToSlug(TESTLAND_CODE);
    expect(getVerifiedTaxableStates().map((s) => stateCodeToSlug(s.code))).not.toContain(
      slug,
    );
    const sitemapUrls = getVerifiedStateSitemapEntries(SITE_URL).map((e) => e.url);
    expect(sitemapUrls.some((url) => url.includes(`/${slug}`))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("testland"))).toBe(false);

    const llms =
      buildLlmsTxt({ siteName: SITE_NAME, siteUrl: SITE_URL }) +
      buildVerifiedStateLlmsLines(SITE_URL).join("\n");
    expect(llms.toLowerCase()).not.toContain("testland");
    expect(llms).not.toMatch(/\/zz\b/i);
    expect(llms).not.toContain(`state-income-tax-calculator/${slug}`);
  });

  it("meta description uniqueness check passes for current verified set", () => {
    expect(() => assertUniqueStateMetaDescriptions()).not.toThrow();
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

  it("missing source on verified state fails validation", () => {
    const raw = {
      ...loadTestlandRaw(),
      verified: true,
      sources: [],
      notes: [
        { text: "Note one about brackets.", sourceUrl: "https://example.test/1" },
        { text: "Note two about deductions.", sourceUrl: "https://example.test/2" },
      ],
      lastVerified: new Date().toISOString().slice(0, 10),
    };
    expect(() => parseStateTaxData(raw, "nosource.json")).toThrow(/source/i);
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
    expect(() => parseStateTaxData(raw, "stale.json")).toThrow(/450 days/i);
  });

  it("verified: false is parseable but excluded from public lists", () => {
    const raw = loadTestlandRaw();
    expect(raw.verified).toBe(false);
    const parsed = parseStateTaxData(raw, "ZZ.json");
    expect(parsed.verified).toBe(false);
    expect(getVerifiedStates().some((s) => s.code === parsed.code)).toBe(false);
  });
});

describe("state page content gates", () => {
  it("taxable state pages expose at least 5 data-driven sections", () => {
    const sample: StateTaxData = {
      ...loadTestlandRaw(),
      verified: true,
      code: "AA",
      name: "Audit State",
      lastVerified: new Date().toISOString().slice(0, 10),
      sources: [{ label: "Audit Revenue", url: "https://example.test/audit" }],
      notes: [
        { text: "Audit note one.", sourceUrl: "https://example.test/n1" },
        { text: "Audit note two.", sourceUrl: "https://example.test/n2" },
      ],
      localTaxNote: "No local income tax in this sample.",
    };
    const sections = buildStatePageSections(sample);
    expect(sections.length).toBeGreaterThanOrEqual(5);
    expect(sections).toEqual(
      expect.arrayContaining([
        "calculator",
        "brackets",
        "deductions",
        "examples",
        "notes",
        "sources",
        "verified",
        "local-tax",
      ]),
    );
  });

  it("FAQ and meta text stay unique across distinct verified-like states", () => {
    const day = new Date().toISOString().slice(0, 10);
    const a: StateTaxData = {
      ...loadTestlandRaw(),
      code: "AA",
      name: "Alpha",
      verified: true,
      lastVerified: day,
      standardDeduction: { single: 1000, married_joint: 2000, head_of_household: 1500 },
      sources: [{ label: "Alpha DOR", url: "https://example.test/alpha" }],
      notes: [
        { text: "Alpha note A.", sourceUrl: "https://example.test/a1" },
        { text: "Alpha note B.", sourceUrl: "https://example.test/a2" },
      ],
    };
    const b: StateTaxData = {
      ...loadTestlandRaw(),
      code: "BB",
      name: "Beta",
      verified: true,
      lastVerified: day,
      structure: "flat",
      brackets: {
        single: [{ from: 0, to: null, rate: 0.03 }],
        married_joint: [{ from: 0, to: null, rate: 0.03 }],
        head_of_household: [{ from: 0, to: null, rate: 0.03 }],
      },
      standardDeduction: { single: 9000, married_joint: 18000, head_of_household: 12000 },
      sources: [{ label: "Beta DOR", url: "https://example.test/beta" }],
      notes: [
        { text: "Beta note A.", sourceUrl: "https://example.test/b1" },
        { text: "Beta note B.", sourceUrl: "https://example.test/b2" },
      ],
    };
    expect(buildStateMetaDescription(a)).not.toBe(buildStateMetaDescription(b));
    expect(() => assertUniqueStateMetaDescriptions([a, b])).not.toThrow();
    expect(() => assertStateFaqsUnique([a, b])).not.toThrow();
    expect(buildStateFaqs(a)[0]!.answer).not.toBe(buildStateFaqs(b)[0]!.answer);
  });
});
