import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/state-tax/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/state-tax/config")>();
  return {
    ...actual,
    SHOW_STATE_TAX_PILOT: true,
  };
});

describe("published state pages (pilot on)", () => {
  it("exposes illinois, north-carolina, and virginia as indexable pages with real links", async () => {
    const {
      getPublishedTaxableStates,
      getPublishedStateBySlug,
      getVerifiedStateSitemapEntries,
      buildVerifiedStateLlmsLines,
      nestStateLinesUnderHub,
      stateSlug,
      stateHref,
      buildStatePageTitle,
      buildStateMetaDescription,
      hubHref,
    } = await import("@/lib/state-tax/load");
    const { SITE_URL } = await import("@/lib/site");
    const { buildLlmsTxt, LIVE_CALCULATOR_COUNT, LIVE_CALCULATORS } =
      await import("@/lib/calculators");
    const { StateTaxDirectoryLinks } = await import(
      "@/components/calculators/StateTaxDirectoryLinks"
    );
    const { buildStatePageSections } = await import("@/lib/state-tax/content");

    const published = getPublishedTaxableStates();
    expect(published.map((s) => s.code).sort()).toEqual(["IL", "NC", "VA"]);

    const expected = [
      { code: "IL", slug: "illinois", h1: "Illinois State Income Tax Calculator" },
      {
        code: "NC",
        slug: "north-carolina",
        h1: "North Carolina State Income Tax Calculator",
      },
      {
        code: "VA",
        slug: "virginia",
        h1: "Virginia State Income Tax Calculator",
      },
    ];

    for (const item of expected) {
      const state = getPublishedStateBySlug(item.slug);
      // Non-null → page renders (HTTP 200); null would notFound() (404).
      expect(state, `${item.slug} should resolve`).not.toBeNull();
      expect(state!.code).toBe(item.code);
      expect(stateSlug(state!)).toBe(item.slug);
      expect(`${state!.name} State Income Tax Calculator`).toBe(item.h1);
      expect(stateHref(state!)).toBe(
        `/finance/state-income-tax-calculator/${item.slug}`,
      );
      expect(buildStatePageTitle(state!).length).toBeGreaterThan(10);
      expect(buildStateMetaDescription(state!)).toContain(state!.name);
      expect(buildStatePageSections(state!).length).toBeGreaterThanOrEqual(5);
    }

    const sitemap = getVerifiedStateSitemapEntries(SITE_URL);
    expect(sitemap).toHaveLength(3);
    for (const item of expected) {
      const entry = sitemap.find((e) => e.url.endsWith(`/${item.slug}`));
      expect(entry).toBeTruthy();
      const state = published.find((s) => s.code === item.code)!;
      expect(
        entry!.lastModified.toISOString().startsWith(state.lastVerified),
      ).toBe(true);
    }

    const html = renderToStaticMarkup(<StateTaxDirectoryLinks />);
    expect(html).toContain('href="/finance/state-income-tax-calculator/illinois"');
    expect(html).toContain(
      'href="/finance/state-income-tax-calculator/north-carolina"',
    );
    expect(html).toContain('href="/finance/state-income-tax-calculator/virginia"');

    const catalog = buildLlmsTxt({
      siteName: "CalcDaily",
      siteUrl: SITE_URL,
    });
    const llms = nestStateLinesUnderHub(
      catalog,
      buildVerifiedStateLlmsLines(SITE_URL),
    );
    expect(llms).toContain(hubHref());
    expect(llms).toContain("/illinois");
    expect(llms).toContain("/north-carolina");
    expect(llms).toContain("/virginia");

    expect(
      LIVE_CALCULATORS.filter((c) => c.id === "state-income-tax"),
    ).toHaveLength(1);
    expect(LIVE_CALCULATOR_COUNT).toBe(LIVE_CALCULATORS.length);
  });
});
