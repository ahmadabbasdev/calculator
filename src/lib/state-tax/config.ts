/**
 * State income tax publish controls — update these when rolling waves.
 * While SHOW_STATE_TAX_PILOT is false, the hub, state pages, and catalog
 * entry stay hidden in production (404 / draft / out of sitemap).
 */

/** Master switch for the state-tax pilot surface. */
export const SHOW_STATE_TAX_PILOT = true;

/** Highest wave number that may appear on public pages. */
export const PUBLISHED_WAVE = 1;

/** Tax year currently treated as current for publish gating. */
export const CURRENT_TAX_YEAR = 2026;

/** Verified data older than this many days is treated as stale and hidden. */
export const MAX_STATE_TAX_VERIFIED_AGE_DAYS = 400;

/** Hard cap: a single wave may not contain more than this many verified files. */
export const MAX_STATES_PER_WAVE = 5;

/** No-wage-tax postal codes (exactly these nine). */
export const NO_WAGE_TAX_CODES = [
  "AK",
  "FL",
  "NV",
  "NH",
  "SD",
  "TN",
  "TX",
  "WA",
  "WY",
] as const;
