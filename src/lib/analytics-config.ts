/**
 * Paths where Google Analytics and ads must not load or send hits.
 */
export const NO_ANALYTICS_PATHS = [
  "/health/pregnancy-due-date-calculator",
  "/finance/zakat-calculator",
] as const;

export function isNoAnalyticsPath(pathname: string): boolean {
  return NO_ANALYTICS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
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
