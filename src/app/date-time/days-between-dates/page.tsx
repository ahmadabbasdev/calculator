import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DaysBetweenDatesCalculator } from "@/components/calculators/DaysBetweenDatesCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/date-time/days-between-dates";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Days Between Two Dates Calculator - Free & Instant";
const PAGE_DESCRIPTION =
  "Calculate exact days, weeks, months, and business days between any two dates. Free online tool — no signup, instant results with inclusive and weekday options.";

export const FAQ_ITEMS = [
  {
    question: "Is the start date included in the day count?",
    answer:
      "By convention, date interval calculations subtract the start date from the end date. For instance, the difference between May 1 and May 2 is 1 day. If you consider May 1 as a full active day and wish to include both endpoints, enable the Include End Date in Count toggle.",
  },
  {
    question: "How are business days calculated?",
    answer:
      "Business days count working days in your range: non-working weekdays (Saturday and Sunday by default) are omitted, and you can optionally exclude public or bank holidays for a country under More options, plus custom days off. When Count Business Days Only is on, the main result shows that working-day total. For the full holiday tool, see the Business Days Calculator.",
  },
  {
    question: "Does this calculator account for leap years?",
    answer:
      "Yes. CalcDaily uses date-fns with the Gregorian calendar. Any date span crossing February 29 during leap years automatically accounts for the extra day.",
  },
  {
    question: "How can I copy or share my calculation results?",
    answer:
      "Click the Copy Summary button near the top of the calculator to copy a formatted text breakdown (total days, business days, and weekend count) to your clipboard. Use Share to open your device share sheet, or copy the page link if sharing is unavailable.",
  },
  {
    question: "What if the end date is before the start date?",
    answer:
      "The calculator still returns a valid result by using chronological order for the math, and shows a short note that the dates were reordered. You can also use the swap control between the date fields to flip them manually.",
  },
] as const;

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: CANONICAL_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Days Between Two Dates Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Date & Time",
      item: `${SITE_URL}/date-time`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Days Between Two Dates",
      item: CANONICAL_URL,
    },
  ],
};

export default function DaysBetweenDatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          theme="date"
          items={[
            { label: "Home", href: "/" },
            { label: "Date & Time", href: "/date-time" },
            { label: "Days Between Two Dates" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-date">
            <CalendarDays className="size-[18px]" aria-hidden="true" />
            Exact duration calculator
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Days Between Two Dates Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Compute the exact number of days, weeks, months, business working
            days, and weekend days between any two calendar dates. For country
            holidays, custom weekends, and custom days off, use the{" "}
            <a
              href="/date-time/business-days-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Business Days Calculator
            </a>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <DaysBetweenDatesCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-it-works-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="how-it-works-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How It Works &amp; Date Calculation Rules
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Understanding how intervals are computed helps with contracts,
                interest windows, probation periods, and project schedules.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  1
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Exclusive Counting (Standard)
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  By default, subtracting Date A from Date B measures elapsed
                  duration. The finish date marks the end of the span and is
                  excluded unless you turn on inclusive counting.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  2
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Inclusive Counting (+1 Day)
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  When both boundary days matter—rentals, hotel stays, or
                  vacation length—enable <em>Include End Date</em> to count every
                  daylight period in the range.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  3
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Business vs. Calendar Days
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Calendar days span every consecutive day. Business days keep
                  Monday through Friday only, which is useful for sprints, SLAs,
                  and working-day deadlines.
                </p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="faq-heading"
            className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-7"
          >
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Common questions about inclusive counting, business days, and
                sharing results.
              </p>
            </div>
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold text-foreground select-none [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown
                      className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-2 pr-6 text-[15px] leading-relaxed text-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="related-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="related-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Related Calculators
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Focused on working days or exact age instead?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/math/average-per-day-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Per Day Calculator
                </span>
                <span className="text-sm text-muted">
                  Spread a total across the days between two dates
                </span>
              </Link>
              <Link
                href="/date-time/business-days-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Business Days Calculator
                </span>
                <span className="text-sm text-muted">
                  Full holiday tool: country public holidays, custom weekends,
                  and days off for deadlines and SLAs
                </span>
              </Link>

              <Link
                href="/date-time/age-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Age Calculator
                </span>
                <span className="text-sm text-muted">
                  How old am I — exact years, months, days, and next birthday
                </span>
              </Link>
              <Link
                href="/date-time/add-subtract-days"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Add or Subtract Days
                </span>
                <span className="text-sm text-muted">
                  Date plus or minus days, weeks, months, or years
                </span>
              </Link>
              <Link
                href="/date-time/time-duration-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Time Duration Calculator
                </span>
                <span className="text-sm text-muted">
                  Hours between times, add or subtract time, and timecard totals
                </span>
              </Link>
              <Link
                href="/health/pregnancy-due-date-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pregnancy Due Date Calculator
                </span>
                <span className="text-sm text-muted">
                  Due date from LMP, conception, IVF, or ultrasound
                </span>
              </Link>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
