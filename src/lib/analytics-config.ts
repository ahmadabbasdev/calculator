/**
 * Paths where Google Analytics and ads must not load or send hits
 * (sensitive health / religious finance tools).
 */
export const NO_ANALYTICS_PATHS = [
  "/health/pregnancy-due-date-calculator",
  "/health/ovulation-calculator",
  "/finance/zakat-calculator",
  "/finance/debt-payoff-calculator",
] as const;

/**
 * Site chrome and category hubs without enough publisher content for ads.
 * AdSense policy: do not place ads on non-content / low-content screens.
 */
const NO_ADS_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/calculators",
  "/date-time",
  "/finance",
  "/health",
  "/math",
  "/home-energy",
  "/games",
  "/finance/state-income-tax-calculator",
]);

export function isNoAnalyticsPath(pathname: string): boolean {
  return NO_ANALYTICS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Ads may load only on substantial calculator tool pages (not hubs or trust chrome).
 * Sensitive paths in NO_ANALYTICS_PATHS are always excluded.
 */
export function isAdsAllowedPath(pathname: string): boolean {
  if (isNoAnalyticsPath(pathname)) return false;
  if (NO_ADS_EXACT_PATHS.has(pathname)) return false;

  const toolPrefixes = [
    "/date-time/",
    "/finance/",
    "/health/",
    "/math/",
    "/home-energy/",
    "/games/",
  ] as const;

  return toolPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/** True when the browser host matches NEXT_PUBLIC_SITE_URL (excludes localhost / preview). */
export function isCanonicalHostname(): boolean {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw || typeof window === "undefined") return false;
  try {
    const siteHost = new URL(raw).hostname;
    return window.location.hostname === siteHost;
  } catch {
    return false;
  }
}
