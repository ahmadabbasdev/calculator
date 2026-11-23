import type { MetadataRoute } from "next";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATORS,
  isCalculatorLive,
} from "@/lib/calculators";
import { getVerifiedStateSitemapEntries } from "@/lib/state-tax/load";
import { SITE_URL } from "@/lib/site";

/**
 * Normalize sitemap URLs: HTTPS origin, no trailing slash on subpaths,
 * trailing slash only on the site root (matches homepage canonical).
 */
function sitemapUrl(path: string): string {
  const origin = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") {
    return `${origin}/`;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized.replace(/\/+$/, "")}`;
}

/**
 * Sitemap for CalcDaily — home, live category hubs, live calculators,
 * verified state income tax pages, and high-value static hubs.
 * Legal/utility trust pages (/privacy, /terms, /disclaimer) stay linked
 * from the footer but are omitted so Googlebot prioritizes tools.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const categoryRoutes = CALCULATOR_CATEGORIES.filter((category) =>
    category.calculators.some(isCalculatorLive),
  ).map((category) => ({
    url: sitemapUrl(`/${category.id}`),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const calculatorRoutes = LIVE_CALCULATORS.map((calculator) => ({
    url: sitemapUrl(calculator.href),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Verified state pages already use origin + path with no trailing slash.
  const stateTaxRoutes = getVerifiedStateSitemapEntries(SITE_URL);

  const staticRoutes = ["/calculators", "/about", "/contact"].map((path) => ({
    url: sitemapUrl(path),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/calculators" ? 0.85 : 0.4,
  }));

  return [
    {
      url: sitemapUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categoryRoutes,
    ...calculatorRoutes,
    ...stateTaxRoutes,
    ...staticRoutes,
  ];
}
