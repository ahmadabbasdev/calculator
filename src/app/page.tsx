import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { HomeCategoryNav } from "@/components/home/HomeCategoryNav";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeToolCard } from "@/components/home/HomeToolCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  getPublicCategories,
  LIVE_CALCULATORS,
  LIVE_CALCULATOR_COUNT,
  POPULAR_CALCULATORS,
  categoryToolCountLabel,
  freeCalculatorsLabel,
  isCalculatorCatalogVisible,
} from "@/lib/calculators";
import { CONTACT_EMAIL } from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// 60 characters — full requested wording was 67; "Online" dropped to fit.
const PAGE_TITLE =
  "CalcDaily - Free Calculators for Dates, Money, Health & Math";
const PAGE_DESCRIPTION = `Free, instant online calculators for date differences, age, business days, GPA/CGPA, finance, and health — ${freeCalculatorsLabel()}. Calculations run in your browser — no signup.`;

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: PAGE_DESCRIPTION,
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${SITE_NAME} calculators`,
  numberOfItems: LIVE_CALCULATORS.length,
  itemListElement: LIVE_CALCULATORS.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: `${SITE_URL}${item.href}`,
    description: item.description,
  })),
};

const FAQ_ITEMS: {
  icon: LucideIcon;
  question: string;
  answer: ReactNode;
}[] = [
  {
    icon: ShieldCheck,
    question: "Are my inputs kept private?",
    answer: (
      <>
        Calculations run in your browser. Your inputs stay in your browser —
        they are never sent to our servers or stored. On business-day tools,
        choosing a country loads a static holiday list for that country; inputs
        are not put into the URL. The site uses analytics only with your
        consent and may show ads. See the{" "}
        <Link
          href="/privacy"
          className="font-medium text-zinc-900 underline underline-offset-2"
        >
          Privacy Policy
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    icon: CalendarDays,
    question: "How does the Days Between Dates tool handle leap years?",
    answer:
      "Our date logic adopts the Gregorian calendar standard, fully factoring in leap years (years divisible by 4, except century years not divisible by 400). Calculations use local calendar dates only — there is no timezone conversion to UTC — so you avoid the off-by-one-day errors that UTC conversion can introduce around daylight saving boundaries.",
  },
  {
    icon: CircleDollarSign,
    question: "What formulas will the financial and loan calculators use?",
    answer: (
      <>
        The{" "}
        <Link
          href="/finance/loan-calculator"
          className="font-medium text-zinc-900 underline underline-offset-2"
        >
          Loan Calculator
        </Link>{" "}
        uses the standard reducing-balance amortization formula{" "}
        <code className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800">
          M = P[r(1+r)^n] / [(1+r)^n − 1]
        </code>
        . The{" "}
        <Link
          href="/finance/compound-interest-calculator"
          className="font-medium text-zinc-900 underline underline-offset-2"
        >
          Compound Interest Calculator
        </Link>{" "}
        estimates future value with compounding and optional contributions. The{" "}
        <Link
          href="/finance/savings-goal-calculator"
          className="font-medium text-zinc-900 underline underline-offset-2"
        >
          Savings Goal Calculator
        </Link>{" "}
        finds a monthly amount or timeline for a target.
      </>
    ),
  },
  {
    icon: Info,
    question: "Is CalcDaily free for commercial and educational use?",
    answer: `Yes. Every tool on CalcDaily (${freeCalculatorsLabel()}) is permanently unrestricted and free for students, engineers, financial planners, and researchers without any subscription barriers or account signups.`,
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto w-full max-w-7xl flex-grow space-y-12 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex text-xs text-zinc-500">
            <ol className="inline-flex items-center space-x-1 sm:space-x-2">
              <li className="inline-flex items-center">
                <span className="font-semibold text-zinc-900">Home</span>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-1 text-zinc-300" aria-hidden="true">
                    /
                  </span>
                  <span className="font-semibold text-zinc-900">
                    Calculator Directory
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <header className="mx-auto max-w-3xl space-y-5 pt-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-stone-200/80 px-3 py-1 text-xs font-medium text-zinc-800">
              <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              <span>{freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)}</span>
            </div>
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-[#09090B] sm:text-4xl lg:text-5xl">
              Free Online Calculators{" "}
              <br className="hidden sm:inline" />
              <span className="font-bold text-stone-600">
                Fast, Accurate &amp; Zero-Friction
              </span>{" "}
              Utility Tools
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Ad-light, instant computation for calendar dates, GPA and
              percentages, and everyday planning. No accounts — formulas kept
              transparent.
            </p>

            <HomeSearch variant="hero" />

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs font-semibold text-zinc-600">
                Frequent:
              </span>
              {POPULAR_CALCULATORS.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:border-zinc-400 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </header>

          <section
            aria-labelledby="popular-strip-heading"
            className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-card sm:p-5"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-stone-100 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-zinc-900" />
                <h2
                  className="text-sm font-bold tracking-tight text-zinc-900"
                  id="popular-strip-heading"
                >
                  Popular right now
                </h2>
                <span className="text-xs font-normal text-stone-500">
                  High-demand daily utilities
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                {freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)} · calculations
                stay on-device
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-4">
              {POPULAR_CALCULATORS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group flex items-start gap-3 rounded-xl border border-stone-200/90 bg-stone-50 p-3 transition-all hover:border-stone-300 hover:bg-stone-100/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-zinc-800 transition-transform group-hover:scale-105">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                        {tool.name}
                      </div>
                      <div className="truncate text-[11px] text-zinc-600">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <HomeCategoryNav />

          {getPublicCategories().map((category) => {
            const Icon = category.icon;
            const visible = category.calculators.filter(
              isCalculatorCatalogVisible,
            );
            return (
              <section
                key={category.id}
                id={category.id}
                aria-labelledby={`heading-${category.id}`}
                className="scroll-mt-28 space-y-4"
              >
                <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-3 sm:flex-row sm:items-end">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-xs">
                      <Icon
                        className="size-5 text-stone-200"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-bold tracking-tight text-zinc-950"
                        id={`heading-${category.id}`}
                      >
                        {category.title} Calculators
                      </h2>
                      <p className="text-xs text-zinc-600 sm:text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-600">
                    {categoryToolCountLabel(visible.length)}
                  </span>
                </div>
                <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visible.map((calculator) => (
                    <HomeToolCard
                      key={calculator.id}
                      calculator={calculator}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <section
            aria-labelledby="standards-heading"
            className="mx-auto max-w-3xl space-y-4"
          >
            <h2
              id="standards-heading"
              className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl"
            >
              How CalcDaily keeps tools trustworthy
            </h2>
            <p className="text-[15px] leading-relaxed text-zinc-600">
              Each live calculator ships with the formula or schedule explained
              on the page, at least one worked example, limits where the estimate
              fails, and automated tests in the repository. Sourced schedules
              such as US state income tax stay unpublished until brackets and
              deductions are checked against the linked revenue pages. Draft
              tools never appear in this directory or the sitemap. Read more on
              the{" "}
              <Link
                href="/about"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                About
              </Link>{" "}
              page, or open a category guide for{" "}
              <Link
                href="/date-time"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                dates
              </Link>
              ,{" "}
              <Link
                href="/finance"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                finance
              </Link>
              ,{" "}
              <Link
                href="/health"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                health
              </Link>
              ,{" "}
              <Link
                href="/home-energy"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                home energy
              </Link>
              , or{" "}
              <Link
                href="/math"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                math
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby="faq-heading"
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card sm:p-8 lg:p-10"
            id="faq"
          >
            <div className="max-w-3xl">
              <span className="text-[11px] font-semibold tracking-wide text-stone-600">
                Knowledge base and methodology
              </span>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-[1.75rem]"
                id="faq-heading"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                Learn how CalcDaily handles numerical precision, how inputs stay
                in your browser, and how formula standards are chosen.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 md:gap-y-10">
              {FAQ_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.question} className="min-w-0">
                    <h3 className="flex items-start gap-2 text-[15px] font-bold text-zinc-950">
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-zinc-500"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                      <span>{item.question}</span>
                    </h3>
                    <p className="mt-2 pl-6 text-sm leading-relaxed text-zinc-600">
                      {item.answer}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-zinc-800/80 bg-[#121316] p-6 text-white shadow-card sm:p-8 md:flex-row lg:p-10"
            id="request-tool"
          >
            <div className="max-w-xl space-y-2 text-center md:text-left">
              <h2
                className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                id="cta-heading"
              >
                Need a custom formula or specialized calculator?
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                We prioritize requested tools — tell us what you need next.
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("CalcDaily tool suggestion")}`}
                className="w-full rounded-lg bg-white px-5 py-2.5 text-center text-xs font-semibold text-zinc-950 shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors hover:bg-stone-100 focus:ring-2 focus:ring-white sm:w-auto sm:text-sm"
              >
                Submit Calculator Request
              </a>
              <a
                href="#faq"
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-4 py-2.5 text-center text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 sm:w-auto sm:text-sm"
              >
                Read Methodologies
              </a>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
