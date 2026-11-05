import {
  CURRENT_TAX_YEAR,
  MAX_STATE_TAX_VERIFIED_AGE_DAYS,
  MAX_STATES_PER_WAVE,
  PUBLISHED_WAVE,
  SHOW_STATE_TAX_PILOT,
} from "@/lib/state-tax/config";
import { buildStateMetaDescription } from "@/lib/state-tax/format";
import type { StateTaxData } from "@/lib/state-tax/schema";

export const TESTLAND_CODE = "ZZ";

export type PublishBlockReason =
  | "pilot-off"
  | "testland"
  | "unverified"
  | "none-structure"
  | "poor-fit"
  | "unknown-fit"
  | "wave"
  | "notes"
  | "facts"
  | "sources"
  | "stale"
  | "tax-year";

export function daysSinceLastVerified(
  lastVerified: string,
  now: Date = new Date(),
): number {
  const verifiedAt = Date.parse(`${lastVerified}T00:00:00.000Z`);
  if (!Number.isFinite(verifiedAt)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - verifiedAt) / (1000 * 60 * 60 * 24);
}

export function isTaxYearAllowed(taxYear: number): boolean {
  return (
    taxYear === CURRENT_TAX_YEAR || taxYear === CURRENT_TAX_YEAR - 1
  );
}

/**
 * Why a state is not eligible for a public calculator page.
 * Returns null when all publish rules pass (ignoring the pilot flag).
 */
export function getPublishBlockReason(
  state: StateTaxData,
  now: Date = new Date(),
): PublishBlockReason | null {
  if (state.code === TESTLAND_CODE) return "testland";
  if (!state.verified) return "unverified";
  if (state.structure === "none") return "none-structure";
  if (state.modelFit === "poor") return "poor-fit";
  if (state.modelFit !== "good" && state.modelFit !== "partial") {
    return "unknown-fit";
  }
  if (state.wave == null || state.wave > PUBLISHED_WAVE) return "wave";
  if (state.notes.length < 2) return "notes";
  if (state.facts.length < 4) return "facts";
  if (state.sources.length < 1) return "sources";
  if (daysSinceLastVerified(state.lastVerified, now) > MAX_STATE_TAX_VERIFIED_AGE_DAYS) {
    return "stale";
  }
  if (!isTaxYearAllowed(state.taxYear)) return "tax-year";
  return null;
}

/** True when the state may have a public page (and pilot is on). */
export function isStatePublished(
  state: StateTaxData,
  now: Date = new Date(),
): boolean {
  if (!SHOW_STATE_TAX_PILOT) return false;
  return getPublishBlockReason(state, now) === null;
}

/** Pilot surface allowed (dev/preview always; production only when flag true). */
export function isStateTaxSurfaceEnabled(): boolean {
  if (SHOW_STATE_TAX_PILOT) return true;
  // Mirror draft-page rules: allow local/preview inspection while flag is false.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

/** Public page access: surface enabled AND state publishable. */
export function canAccessStatePage(
  state: StateTaxData,
  now: Date = new Date(),
): boolean {
  if (!isStateTaxSurfaceEnabled()) return false;
  // When pilot is off but surface is enabled (dev/preview), still require publish rules
  // except the pilot-off gate — so only complete states render for QA.
  if (!SHOW_STATE_TAX_PILOT) {
    return getPublishBlockReason(state, now) === null;
  }
  return isStatePublished(state, now);
}

export function assertUniqueFactsAcrossStates(states: StateTaxData[]): void {
  const seen = new Map<string, string>();
  for (const state of states) {
    for (const fact of state.facts) {
      const key = fact.text.trim().toLowerCase();
      const prior = seen.get(key);
      if (prior) {
        throw new Error(
          `Duplicate fact text across ${prior} and ${state.code}: "${fact.text}"`,
        );
      }
      seen.set(key, state.code);
    }
  }
}

export function assertUniqueMetaDescriptions(states: StateTaxData[]): void {
  const seen = new Map<string, string>();
  for (const state of states) {
    const description = buildStateMetaDescription(state);
    const prior = seen.get(description);
    if (prior) {
      throw new Error(
        `Duplicate meta description for ${state.code} and ${prior}.`,
      );
    }
    seen.set(description, state.code);
  }
}

/** Build fails if any wave has more than MAX_STATES_PER_WAVE verified files. */
export function assertWaveCaps(states: StateTaxData[]): void {
  const byWave = new Map<number, string[]>();
  for (const state of states) {
    if (!state.verified || state.code === TESTLAND_CODE) continue;
    if (state.wave == null) continue;
    const list = byWave.get(state.wave) ?? [];
    list.push(state.code);
    byWave.set(state.wave, list);
  }
  for (const [wave, codes] of byWave) {
    if (codes.length > MAX_STATES_PER_WAVE) {
      throw new Error(
        `Wave ${wave} has ${codes.length} verified states (max ${MAX_STATES_PER_WAVE}): ${codes.join(", ")}`,
      );
    }
  }
}
