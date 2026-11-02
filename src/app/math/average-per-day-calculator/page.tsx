import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn, ChevronDown } from "lucide-react";
import { AveragePerDayCalculator } from "@/components/calculators/AveragePerDayCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/average-per-day-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Average Per Day Calculator - Daily Rate & Totals";
const PAGE_DESCRIPTION =
  "Find a daily average or total from an amount and days — or a date range. See per-week, per-month, and per-year pace, plus optional working-day counts.";



export const FAQ_ITEMS = [
  {
    question: "How do I calculate average per day?",
    answer:
      "Divide the total by the number of days in the period: average per day = total ÷ days. Enter a total and a duration in days, weeks, months, or years — or a start and end date. Months use 365 ÷ 12 days and years use 365 days. The calculator shows the daily figure and a one-line worked step.",
  },

  {
    question: "How does the average per day between two dates work?",
    answer:
      "Pick Date range, enter the start and end dates, and choose whether to include the end date. Inclusive counting adds one day so both endpoints count; turning the toggle off uses the span without the end date. The total is then divided by that day count.",
  },
  {
    question: "What is a daily average calculator useful for?",
    answer:
      "Use it for a cost per day, spend pace, distance per day, points per day, or any total you want to spread evenly across a period. Optional unit labels (such as USD or km) appear as plain text beside the results.",
  },
  {
    question: "How do I find an average per week or per month?",
    answer:
      "After you have a daily average, the “at the same pace” section multiplies by 7 for a weekly figure, by 365 ÷ 12 for a monthly figure, and by 365 for a yearly figure. Those are steady-pace projections, not a separate calendar model.",
  },
  {
    question: "Can I calculate a cost per day?",
    answer:
      "Yes. Enter the total cost as the amount, set the period in days or dates, and optionally type a short unit label such as USD. The large result is the cost per day; week, month, and year pace figures follow from that daily rate.",
  },
  {
    question: "What does “Per working day only” do?",
    answer:
      "When you use a date range, that toggle counts business days with the shared weekend and holiday options instead of every calendar day. Configure non-working weekdays and optional public holidays under More options. It is not available when you enter a duration in days, weeks, months, or years.",
  },
  {
    question: "How do I turn a daily average into a total?",
    answer:
      "Choose Find the total, enter the daily average, and set the period (a duration in days, weeks, months, or years — or a date range). The result is daily average × number of days. Example: 40 per day × 30 days = 1,200.",
  },

  {
    question: "Is this the same as the Average Calculator?",
    answer:
      "No. The Average Calculator finds mean, median, mode, and related stats from a list of numbers. This tool spreads one total across days (or builds a total from a daily rate). For a list average, use the Average Calculator; for how many calendar days fall between two dates alone, use Days Between Two Dates.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
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
}

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Average Per Day Calculator",
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
      name: "Math & Education",
      item: `${SITE_URL}/math`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Average Per Day Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function AveragePerDayCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);

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
          theme="math"
          items={[
            { label: "Home", href: "/" },
            { label: "Math & Education", href: "/math" },
            { label: "Average Per Day Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <ChartColumn className="size-4.5" aria-hidden="true" />
            Daily average, cost per day &amp; totals
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Average Per Day Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Turn a total into a daily average — or a daily rate into a total —
            using a duration in days, weeks, months, or years, or a date range.
            Optional working-day counting, plus steady-pace figures per week,
            month, and year.

          </p>
        </header>

        <AveragePerDayCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Average Per Day Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two modes cover the usual daily-average and cost-per-day
                questions without putting your numbers in the URL.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Find the daily average (total ÷ days) or Find the total
                (daily rate × days).
              </li>
              <li>
                Enter the amount. Optionally add a short unit label such as USD
                or km — it is shown as plain text only.
              </li>
              <li>
                Set the period as a duration (days, weeks, months, or years), or
                as a start and end date. When using dates, decide whether to
                include the end date, matching the other date tools on CalcDaily.
              </li>
              <li>
                For a date range, you can switch on Per working day only and
                adjust weekends or holidays under More options.
              </li>
              <li>
                Read the large result, the one-line worked step, and the “at the
                same pace” week, month, and year figures.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How the Daily Average Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The arithmetic is straightforward; the date options only change
                how many days land in the divisor or multiplier.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                For a daily average, divide the total by the day count. Example:
                1,200 ÷ 30 days = 40 per day. For a total from a daily rate,
                multiply instead: 40 per day × 30 days = 1,200.
              </p>
              <p>
                With a date range, the day count follows local calendar dates
                (no UTC conversion). Including the end date counts both
                endpoints — so 1 January through 10 January is 10 days. Leaving
                the end date out yields 9 days for that same pair. If you enable
                working days only, weekends and any selected holidays are skipped
                using the same business-day module as the{" "}
                <Link
                  href="/date-time/business-days-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Business Days Calculator
                </Link>
                .
              </p>
              <p>
                Week, month, and year rows scale the daily figure by 7, by 365 ÷
                12, and by 365. They assume a steady pace so you can compare a
                cost per day or other daily rate to longer horizons. They are
                not a promise about which calendar months have 28, 30, or 31
                days.
              </p>
              <p>
                If you need the mean of a list of values rather than one total
                spread across days, use the{" "}
                <Link
                  href="/math/average-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Average Calculator
                </Link>
                . If you only need how many days fall between two dates, use{" "}
                <Link
                  href="/date-time/days-between-dates"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Days Between Two Dates
                </Link>
                . Percent of a number or percent change belongs on the{" "}
                <Link
                  href="/math/percentage-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Percentage Calculator
                </Link>
                .
              </p>
            </div>
          </section>

          <section aria-labelledby="pace-note-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="pace-note-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Steady-Pace Projections
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The per-week, per-month, and per-year figures assume you keep
                the same daily average for the whole horizon. Real spending,
                mileage, or scoring often varies day to day — treat those rows
                as a simple pace check, not a forecast model.
              </p>
            </div>
          </section>

          <section aria-labelledby="examples-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="examples-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Worked Examples
              </h2>
            </div>
            <ul className="max-w-3xl list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Total 1,200 over 30 days → 40 per day; at the same pace that is
                280 per week and 14,600 per year (40 × 365).
              </li>
              <li>
                Total 1,000 from 2026-01-01 to 2026-01-10 with the end date
                included → 10 days → 100 per day. Without the end date → 9 days
                → about 111.11 per day.
              </li>
              <li>
                Daily average 40 for 30 days → total 1,200 when you use Find the
                total.
              </li>
            </ul>
            <p className="mt-4 max-w-3xl text-[13px] text-muted">
              Last reviewed: {lastUpdated}. Formulas are standard arithmetic;
              no third-party data sources are required.
            </p>
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
                Daily averages, date ranges, working days, and how this differs
                from the list Average Calculator.
              </p>
            </div>
            <div className="divide-y divide-border/80">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
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
                List averages, date spans, working days, and percentages.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/math/average-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Calculator
                </span>
                <span className="text-sm text-muted">
                  Mean, median, mode, range, and standard deviation from a list
                </span>
              </Link>
              <Link
                href="/date-time/days-between-dates"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Days Between Two Dates
                </span>
                <span className="text-sm text-muted">
                  Calendar days, weeks, and months between two dates
                </span>
              </Link>
              <Link
                href="/date-time/business-days-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Business Days Calculator
                </span>
                <span className="text-sm text-muted">
                  Working days with weekends and optional public holidays
                </span>
              </Link>
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and increase or decrease
                </span>
              </Link>
              <Link
                href="/date-time/time-duration-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Time Duration Calculator
                </span>
                <span className="text-sm text-muted">
                  Hours between times, add or subtract time, and timecard totals
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
