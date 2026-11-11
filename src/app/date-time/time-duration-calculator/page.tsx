import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Clock } from "lucide-react";
import { TimeDurationCalculator } from "@/components/calculators/TimeDurationCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/date-time/time-duration-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Time Duration Calculator - Hours & Minutes Between Times";
const PAGE_DESCRIPTION =
  "Find hours between two times, add or subtract hours and minutes, or total hours worked on a timecard. Decimal hours included — clock math only, in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate the hours between two times?",
    answer:
      "Choose Time between two times, enter a start time and an end time, and optionally subtract an unpaid break in minutes. The result shows hours and minutes, total minutes, and decimal hours. Example: 09:00 to 17:30 is 8 hours 30 minutes (8.5 decimal hours).",
  },
  {
    question: "How do I calculate time across midnight?",
    answer:
      "If the end time is earlier than the start and you have not added dates, the calculator treats the end as the next day and labels it “End time is on the next day.” You can uncheck that box to turn the overnight rule off, or open Add dates for multi-day spans to set both calendar dates explicitly.",
  },
  {
    question: "How do I convert minutes to decimal hours?",
    answer:
      "Divide total minutes by 60. Fifteen minutes is 0.25 hours, 30 minutes is 0.50, and 45 minutes is 0.75. This page shows decimal hours to two places and includes the exact minutes÷60 fraction in the working line.",
  },
  {
    question: "How do I add hours and minutes to a time?",
    answer:
      "Open Add or subtract time, enter the start time, choose Add, and fill days, hours, and minutes. The result is the new clock time. If the sum crosses midnight, the panel shows next day or a day offset such as +2 days. Optional start date returns the resulting calendar date.",
  },
  {
    question: "How do I subtract a break?",
    answer:
      "In Time between two times, enter Unpaid break (minutes). The break is subtracted from the span after the end−start difference is calculated. If the break is longer than the span, the tool shows a calm message and does not return a negative duration. Timecard rows have their own break column.",
  },
  {
    question: "Does this calculator handle time zones or daylight saving?",
    answer:
      "No. All results are naive wall-clock arithmetic using integer minutes (and Date.UTC for optional dates). The browser time zone and daylight saving never change the numbers. For calendar day counts see Days Between Two Dates; for working-day spans see the Business Days Calculator.",
  },
  {
    question: "How is this different from the Days Between Two Dates calculator?",
    answer:
      "This page measures hours and minutes between clock times, adds or subtracts a duration from a time, or totals a timecard. The Days Between Two Dates calculator counts calendar days (and related spans) between two dates, not shift length on a time card.",
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
  name: "Time Duration Calculator",
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
      name: "Time Duration Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function TimeDurationCalculatorPage() {
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
          theme="date"
          items={[
            { label: "Home", href: "/" },
            { label: "Date & Time", href: "/date-time" },
            { label: "Time Duration Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-date">
            <Clock className="size-4.5" aria-hidden="true" />
            Hours between times, add or subtract, timecard totals
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Time Duration Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Calculate how many hours and minutes fall between two times, add or
            subtract a duration from a clock time, or total hours worked across
            a simple time card. Results are wall-clock arithmetic only — no time
            zones and no daylight saving adjustment.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <TimeDurationCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Time Duration Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Three modes share the same result panel. Switching tabs keeps
                the page layout stable.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose <strong className="font-semibold text-foreground">Time between two times</strong>{" "}
                for hours between two clock times, with an optional unpaid break
                and optional dates for multi-day spans.
              </li>
              <li>
                Choose <strong className="font-semibold text-foreground">Add or subtract time</strong>{" "}
                to shift a start time by days, hours, and minutes. Cross-midnight
                results show next day, previous day, or a day offset.
              </li>
              <li>
                Choose <strong className="font-semibold text-foreground">Total hours worked</strong>{" "}
                for a timecard-style table. Add or remove rows, then read the
                total, decimal hours, and average per filled row.
              </li>
              <li>
                Use the 12-hour or 24-hour toggle for how results are written.
                Native time inputs still follow your browser’s format.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Time Duration Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Everything is converted to integer minutes first, then formatted
                for display.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                A clock time such as 09:00 becomes 540 minutes from midnight.
                Duration is end minus start. When no dates are set and the end is
                earlier than the start, 24 × 60 minutes are added so overnight
                shifts (for example 22:00 to 06:00) resolve to eight hours. An
                unpaid break is subtracted after that span. If the break is
                longer than the span, the tool shows a message instead of a
                negative result.
              </p>
              <p>
                Optional start and end dates use Date.UTC day ordinals so the
                browser’s time zone cannot change the minute count. 12-hour and
                24-hour labels are display options only; the underlying math is
                the same. Same start and end with no next-day flag is zero
                minutes; ticking next day on equal times yields 24 hours.
              </p>
              <p>
                Worked example: 17:30 − 09:00 = 8 h 30 min; minus a 30 min break
                = 8 h 00 min. That is 480 minutes, or 8.00 decimal hours.
              </p>
            </div>
          </section>

          <section aria-labelledby="decimal-hours-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="decimal-hours-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Minutes to Decimal Hours
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Decimal hours = total minutes ÷ 60. Useful for spreadsheets and
                some time-entry systems.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[20rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Common minute values as decimal hours
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3">
                      Minutes
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Decimal hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [15, "0.25"],
                    [30, "0.50"],
                    [45, "0.75"],
                    [60, "1.00"],
                    [90, "1.50"],
                    [510, "8.50"],
                  ].map(([minutes, decimal]) => (
                    <tr
                      key={String(minutes)}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {minutes}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {decimal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="common-uses-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="common-uses-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Uses
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Practical clock-time questions this tool is built for.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Shift length and simple time-card totals (hours worked across
                several days), without payroll rules.
              </li>
              <li>Study sessions, cooking times, and travel legs on a clock.</li>
              <li>
                Sports intervals and practice blocks measured in hours and
                minutes.
              </li>
              <li>
                Converting a finished span into decimal hours for a spreadsheet.
              </li>
            </ul>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              For pay-period conversion see the{" "}
              <a
                href="/finance/salary-to-hourly-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Salary to Hourly Calculator
              </a>
              . For spreading a total across calendar days see the{" "}
              <a
                href="/math/average-per-day-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Average Per Day Calculator
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Limits of This Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Clock arithmetic is not the same as payroll, travel, or legal
                timekeeping.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Results ignore time zones and daylight saving. A night that
                “springs forward” or “falls back” is still treated as a plain
                24-hour wall clock. Workplaces often round punches, treat breaks
                differently, and apply overtime rules this page does not model.
              </p>
              <p>
                This is not payroll, legal, or employment advice, and it does
                not say what breaks or hours anyone is entitled to. For counting
                calendar days between dates use the{" "}
                <a
                  href="/date-time/days-between-dates"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Days Between Two Dates
                </a>{" "}
                calculator; for weekdays and holidays use the{" "}
                <a
                  href="/date-time/business-days-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Business Days Calculator
                </a>
                .
              </p>
              <p>
                General information and estimates only. Not financial, tax, or
                employment advice.
              </p>
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
                Hours between times, midnight crossings, decimal hours, and how
                this differs from date-span tools.
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

          <section aria-labelledby="updated-heading" className="max-w-3xl">
            <h2 id="updated-heading" className="sr-only">
              Last updated
            </h2>
            <p className="text-[12px] text-zinc-500">
              Last updated:{" "}
              <time dateTime={lastUpdated}>{lastUpdated}</time>
            </p>
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
                Calendar day counts, working days, pay periods, and daily averages.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/date-time/days-between-dates"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Days Between Two Dates
                </span>
                <span className="text-sm text-muted">
                  Calendar days, weeks, and months between two dates
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
                  Shift a calendar date by days, weeks, months, or years
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
                  Working days with weekends and optional public holidays
                </span>
              </Link>
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Salary to Hourly Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert salary and hourly pay between common periods
                </span>
              </Link>
              <Link
                href="/math/average-per-day-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Per Day Calculator
                </span>
                <span className="text-sm text-muted">
                  Spread a total across days, or find a daily rate
                </span>
              </Link>
              <Link
                href="/health/pace-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Calculator
                </span>
                <span className="text-sm text-muted">
                  Running and walking pace, speed, and race splits
                </span>
              </Link>
              <Link
                href="/health/pace-chart"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Chart &amp; Splits Calculator
                </span>
                <span className="text-sm text-muted">
                  Marathon to 5K charts and goal-time splits
                </span>
              </Link>
              <Link
                href="/health/steps-to-distance-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Steps to Distance Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert steps to km and miles, or estimate walk time
                </span>
              </Link>
              <Link
                href="/health/race-time-predictor"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Race Time Predictor
                </span>
                <span className="text-sm text-muted">
                  Equivalent race times from a recent finish
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
