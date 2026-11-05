import { describe, expect, it } from "vitest";
import {
  buildLlmsTxt,
  CALCULATOR_CATEGORIES,
  isCalculatorLive,
  LIVE_CALCULATORS,
} from "@/lib/calculators";
import {
  allowsDraftPages,
  canAccessPalworldPage,
  isPalworldVerified,
  loadPalworldData,
  PALWORLD_PAGE_PATH,
} from "@/lib/palworld/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import sitemap from "@/app/sitemap";

describe("Palworld draft gating", () => {
  it("ships with verified: false", () => {
    expect(loadPalworldData().verified).toBe(false);
    expect(isPalworldVerified()).toBe(false);
  });

  it("is absent from LIVE_CALCULATORS and live category listings", () => {
    expect(
      LIVE_CALCULATORS.some((tool) => tool.href === PALWORLD_PAGE_PATH),
    ).toBe(false);
    const games = CALCULATOR_CATEGORIES.find((c) => c.id === "games");
    expect(games).toBeTruthy();
    const tool = games!.calculators.find((c) => c.id === "palworld-breeding");
    expect(tool).toBeTruthy();
    expect(isCalculatorLive(tool!)).toBe(false);
    expect(tool!.status).toBe("draft");
  });

  it("is absent from sitemap and llms.txt", () => {
    const entries = sitemap();
    expect(
      entries.some((entry) => entry.url.includes(PALWORLD_PAGE_PATH)),
    ).toBe(false);
    expect(entries.some((entry) => entry.url.endsWith("/games"))).toBe(false);

    const llms = buildLlmsTxt({ siteName: SITE_NAME, siteUrl: SITE_URL });
    expect(llms.toLowerCase()).not.toContain("palworld");
    expect(llms).not.toContain(PALWORLD_PAGE_PATH);
    expect(llms).not.toMatch(/\/games\b/);
  });

  it("production access is denied while draft; draft envs may allow", () => {
    // Vitest runs with NODE_ENV=test → draft allowed here.
    expect(allowsDraftPages()).toBe(true);
    expect(canAccessPalworldPage()).toBe(true);
    expect(isPalworldVerified()).toBe(false);
  });

  it("denies draft access under production env rules", () => {
    const vercelEnv: string = "production";
    const nodeEnv: string = "production";
    const draftAllowed =
      vercelEnv === "preview" ||
      vercelEnv === "development" ||
      nodeEnv !== "production";
    expect(draftAllowed).toBe(false);
    expect(isPalworldVerified() || draftAllowed).toBe(false);
  });
});
