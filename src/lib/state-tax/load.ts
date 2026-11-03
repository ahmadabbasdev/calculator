import fs from "node:fs";
import path from "node:path";
import {
  parseStateTaxData,
  type StateTaxData,
} from "@/lib/state-tax/schema";

export {
  buildStateMetaDescription,
  buildStatePageTitle,
  formatRatePercent,
  hubHref,
  stateCodeToSlug,
  stateHref,
  slugToStateCode,
  topMarginalRate,
} from "@/lib/state-tax/format";

import {
  assertUniqueStateMetaDescriptions as assertUniqueMeta,
  stateCodeToSlug,
  slugToStateCode,
} from "@/lib/state-tax/format";

const DATA_DIR = path.join(process.cwd(), "data", "state-tax");

/** Fictional fixture code — never published. */
export const TESTLAND_CODE = "ZZ";

function isDataFile(name: string): boolean {
  return (
    name.endsWith(".json") &&
    !name.startsWith("_") &&
    !name.startsWith(".")
  );
}

function readStateFile(filePath: string): StateTaxData {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  return parseStateTaxData(raw, path.basename(filePath));
}

/** All valid JSON state files (including unverified Testland). */
export function loadAllStateTaxFiles(): StateTaxData[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`State tax data directory missing: ${DATA_DIR}`);
  }
  const files = fs.readdirSync(DATA_DIR).filter(isDataFile).sort();
  return files.map((file) => readStateFile(path.join(DATA_DIR, file)));
}

/**
 * States eligible for public surfaces (hub table, sitemap links for none,
 * and calculator pages for flat/progressive).
 * Excludes Testland and any unverified record.
 */
export function getVerifiedStates(): StateTaxData[] {
  return loadAllStateTaxFiles().filter(
    (state) => state.verified && state.code !== TESTLAND_CODE,
  );
}

/** Verified states that get a dedicated calculator page. */
export function getVerifiedTaxableStates(): StateTaxData[] {
  return getVerifiedStates().filter((state) => state.structure !== "none");
}

/** Verified no-income-tax states (hub table only). */
export function getVerifiedNoneStates(): StateTaxData[] {
  return getVerifiedStates().filter((state) => state.structure === "none");
}

export function getVerifiedStateBySlug(slug: string): StateTaxData | null {
  const code = slugToStateCode(slug);
  return (
    getVerifiedTaxableStates().find((state) => state.code === code) ?? null
  );
}

/** Sitemap entries for verified taxable state pages (lastmod = lastVerified). */
export function getVerifiedStateSitemapEntries(siteUrl: string): {
  url: string;
  lastModified: Date;
  changeFrequency: "yearly";
  priority: number;
}[] {
  const origin = siteUrl.replace(/\/$/, "");
  return getVerifiedTaxableStates().map((state) => ({
    url: `${origin}/finance/state-income-tax-calculator/${stateCodeToSlug(state.code)}`,
    lastModified: new Date(`${state.lastVerified}T00:00:00.000Z`),
    changeFrequency: "yearly" as const,
    priority: 0.65,
  }));
}

/** Extra llms.txt lines for verified taxable state pages (never includes Testland). */
export function buildVerifiedStateLlmsLines(siteUrl: string): string[] {
  const origin = siteUrl.replace(/\/$/, "");
  const states = getVerifiedTaxableStates();
  if (states.length === 0) return [];
  const lines: string[] = ["## Verified state income tax pages", ""];
  for (const state of states) {
    lines.push(
      `- [${state.name} State Income Tax](${origin}/finance/state-income-tax-calculator/${stateCodeToSlug(state.code)}): Tax year ${state.taxYear}, ${state.structure} schedule (verified ${state.lastVerified}).`,
    );
  }
  lines.push("");
  return lines;
}

/** Build-time gate: verified taxable pages must have unique meta descriptions. */
export function assertUniqueStateMetaDescriptions(
  states: StateTaxData[] = getVerifiedTaxableStates(),
): void {
  assertUniqueMeta(states);
}
