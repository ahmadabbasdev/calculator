import fs from "node:fs";
import path from "node:path";
import { SHOW_STATE_TAX_PILOT } from "@/lib/state-tax/config";
import {
  assertUniqueFactsAcrossStates,
  assertUniqueMetaDescriptions,
  assertWaveCaps,
  canAccessStatePage,
  getPublishBlockReason,
  isStatePublished,
  isStateTaxSurfaceEnabled,
  TESTLAND_CODE,
} from "@/lib/state-tax/publish";
import {
  parseStateTaxData,
  rosterFileSchema,
  type RosterEntry,
  type StateTaxData,
} from "@/lib/state-tax/schema";

export {
  buildStateMetaDescription,
  buildStatePageTitle,
  formatRatePercent,
  hubHref,
  stateCodeToSlug,
  stateHref,
  stateSlug,
  slugToStateCode,
  topMarginalRate,
} from "@/lib/state-tax/format";

export {
  SHOW_STATE_TAX_PILOT,
  PUBLISHED_WAVE,
  CURRENT_TAX_YEAR,
  MAX_STATE_TAX_VERIFIED_AGE_DAYS,
  MAX_STATES_PER_WAVE,
  NO_WAGE_TAX_CODES,
} from "@/lib/state-tax/config";

export {
  canAccessStatePage,
  getPublishBlockReason,
  isStatePublished,
  isStateTaxSurfaceEnabled,
  TESTLAND_CODE,
  daysSinceLastVerified,
  assertUniqueFactsAcrossStates,
  assertUniqueMetaDescriptions,
  assertWaveCaps,
} from "@/lib/state-tax/publish";

import { stateSlug } from "@/lib/state-tax/format";

const DATA_DIR = path.join(process.cwd(), "data", "state-tax");
const ROSTER_PATH = path.join(DATA_DIR, "roster.json");

function isDataFile(name: string): boolean {
  return (
    name.endsWith(".json") &&
    !name.startsWith("_") &&
    name !== "roster.json" &&
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

export function loadRoster(): RosterEntry[] {
  const raw = JSON.parse(fs.readFileSync(ROSTER_PATH, "utf8")) as unknown;
  const parsed = rosterFileSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid roster.json: ${details}`);
  }
  return parsed.data.states;
}

/** States that pass every publish rule (and pilot is on). */
export function getPublishedTaxableStates(): StateTaxData[] {
  return loadAllStateTaxFiles().filter(
    (state) => state.structure !== "none" && isStatePublished(state),
  );
}

/**
 * @deprecated Prefer getPublishedTaxableStates — kept as alias for call sites.
 */
export function getVerifiedTaxableStates(): StateTaxData[] {
  return getPublishedTaxableStates();
}

/** Verified non-Testland files (may still fail publish gates). */
export function getVerifiedStates(): StateTaxData[] {
  return loadAllStateTaxFiles().filter(
    (state) => state.verified && state.code !== TESTLAND_CODE,
  );
}

/** No-wage-tax roster rows for the hub table (names only). */
export function getNoWageTaxRosterEntries(): RosterEntry[] {
  if (!isStateTaxSurfaceEnabled()) return [];
  return loadRoster().filter((entry) => entry.status === "no-wage-tax");
}

/** Poor-fit verified states for optional hub listing (no links). */
export function getPoorFitListedStates(): StateTaxData[] {
  if (!SHOW_STATE_TAX_PILOT) return [];
  return loadAllStateTaxFiles().filter(
    (state) =>
      state.verified &&
      state.code !== TESTLAND_CODE &&
      state.modelFit === "poor" &&
      state.structure !== "none",
  );
}

export function getPublishedStateBySlug(slug: string): StateTaxData | null {
  const normalized = slug.trim().toLowerCase();
  const state =
    loadAllStateTaxFiles().find((item) => {
      if (stateSlug(item) === normalized) return true;
      // Accept legacy two-letter code slugs during transition.
      return item.code.toLowerCase() === normalized;
    }) ?? null;
  if (!state) return null;
  if (!canAccessStatePage(state)) return null;
  if (state.structure === "none") return null;
  return state;
}

/** @deprecated Prefer getPublishedStateBySlug */
export function getVerifiedStateBySlug(slug: string): StateTaxData | null {
  return getPublishedStateBySlug(slug);
}

export function getVerifiedStateSitemapEntries(siteUrl: string): {
  url: string;
  lastModified: Date;
  changeFrequency: "yearly";
  priority: number;
}[] {
  if (!SHOW_STATE_TAX_PILOT) return [];
  const origin = siteUrl.replace(/\/$/, "");
  return getPublishedTaxableStates().map((state) => ({
    url: `${origin}/finance/state-income-tax-calculator/${stateSlug(state)}`,
    lastModified: new Date(`${state.lastVerified}T00:00:00.000Z`),
    changeFrequency: "yearly" as const,
    priority: 0.65,
  }));
}

/** Nested bullets for llms.txt under the hub entry. */
export function buildVerifiedStateLlmsLines(siteUrl: string): string[] {
  if (!SHOW_STATE_TAX_PILOT) return [];
  const origin = siteUrl.replace(/\/$/, "");
  const states = getPublishedTaxableStates();
  if (states.length === 0) return [];
  return states.map(
    (state) =>
      `  - [${state.name} State Income Tax](${origin}/finance/state-income-tax-calculator/${stateSlug(state)}): Tax year ${state.taxYear}, ${state.structure} schedule (verified ${state.lastVerified}).`,
  );
}

/** Insert nested state lines immediately under the hub catalog entry. */
export function nestStateLinesUnderHub(
  catalog: string,
  stateLines: string[],
): string {
  if (stateLines.length === 0) return catalog;
  const marker = "/finance/state-income-tax-calculator)";
  const idx = catalog.indexOf(marker);
  if (idx < 0) {
    return `${catalog.trimEnd()}\n\n## State income tax pages\n\n${stateLines.map((l) => l.trim()).join("\n")}\n`;
  }
  const lineEnd = catalog.indexOf("\n", idx);
  const insertAt = lineEnd === -1 ? catalog.length : lineEnd;
  return (
    catalog.slice(0, insertAt) +
    "\n" +
    stateLines.join("\n") +
    catalog.slice(insertAt)
  );
}

/** Data integrity gates for uniqueness, wave caps, and fact collisions. */
export function assertStateTaxBuildGates(): void {
  const all = loadAllStateTaxFiles().filter((s) => s.code !== TESTLAND_CODE);
  assertWaveCaps(all);
  const candidates = all.filter(
    (state) =>
      state.verified &&
      (state.modelFit === "good" || state.modelFit === "partial"),
  );
  assertUniqueFactsAcrossStates(candidates);
  assertUniqueMetaDescriptions(
    candidates.filter((s) => getPublishBlockReason(s) === null || s.verified),
  );
  // Always validate roster shape
  loadRoster();
}

/** Compatibility: unique meta among currently published pages. */
export function assertUniqueStateMetaDescriptions(
  states: StateTaxData[] = getPublishedTaxableStates(),
): void {
  assertUniqueMetaDescriptions(states);
}

/** Hub/catalog: pilot must be on for public listing. */
export function isStateTaxCatalogLive(): boolean {
  return SHOW_STATE_TAX_PILOT;
}
