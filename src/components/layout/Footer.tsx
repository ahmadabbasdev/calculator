import Link from "next/link";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATOR_COUNT,
  freeCalculatorsLabel,
  isCalculatorLive,
} from "@/lib/calculators";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SITE_NAME } from "@/lib/site";


/** Shared editorial footer — monochrome; links come from the catalog. */
export function Footer() {
  const year = new Date().getFullYear();
  const byCategory = CALCULATOR_CATEGORIES.map((category) => ({
    title: category.title,
    tools: category.calculators.filter(isCalculatorLive),
  })).filter((group) => group.tools.length > 0);

  return (
    <footer className="mt-auto border-t border-stone-200 bg-white text-sm text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center">
              <SiteLogo height={28} />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-600">
              High-precision mathematical utilities. Designed for instant
              accessibility, transparent models, and clear formulas.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              {freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)} · calculations run
              in your browser
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-600">
              Holiday data:{" "}
              <a
                href="https://github.com/commenthol/date-holidays"
                className="font-medium text-zinc-900 underline underline-offset-2"
                rel="noopener noreferrer"
                target="_blank"
              >
                date-holidays
              </a>{" "}
              (CC BY-SA 3.0 / ISC). Community-maintained; confirm important
              deadlines.
            </p>
          </div>

          {byCategory.slice(0, 2).map((group) => (
            <div key={group.title}>
              <h3 className="mb-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase">
                {group.title}
              </h3>
              <ul className="space-y-2.5 text-xs">
                {group.tools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={tool.href!}
                      className="transition-colors hover:text-zinc-950"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase">
              Trust &amp; governance
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/calculators"
                  className="transition-colors hover:text-zinc-950"
                >
                  All calculators
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-zinc-950"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-zinc-950"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-zinc-950"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-zinc-950"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="transition-colors hover:text-zinc-950"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="transition-colors hover:text-zinc-950"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-100 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>
            © {year} {SITE_NAME}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900"
            >
              Privacy
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-900"
            >
              Terms
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/disclaimer"
              className="transition-colors hover:text-zinc-900"
            >
              Disclaimer
            </Link>
            <span aria-hidden="true">•</span>
            <CookieSettingsButton />
            <span aria-hidden="true">•</span>
            <Link
              href="/sitemap.xml"
              className="transition-colors hover:text-zinc-900"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
