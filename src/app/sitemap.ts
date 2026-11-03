import type { MetadataRoute } from "next";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATORS,
  isCalculatorLive,
} from "@/lib/calculators";
import { getVerifiedStateSitemapEntries } from "@/lib/state-tax/load";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap for CalcDaily — home, live category hubs, live calculators,
 * verified state income tax pages, and static trust pages.
 * Coming-soon tools and unverified fixtures (e.g. Testland) are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const categoryRoutes = CALCULATOR_CATEGORIES.filter((category) =>
    category.calculators.some(isCalculatorLive),
  ).map((category) => ({
    url: `${SITE_URL}/${category.id}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const calculatorRoutes = LIVE_CALCULATORS.map((calculator) => ({
    url: `${SITE_URL}${calculator.href}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const stateTaxRoutes = getVerifiedStateSitemapEntries(SITE_URL);

  const staticRoutes = ["/about", "/privacy", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [
    {
      url: SITE_URL,
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
