import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { AddSubtractDaysCalculator } from "@/components/calculators/AddSubtractDaysCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/date-time/add-subtract-days";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Add or Subtract Days From a Date - Free Date Calculator";
const PAGE_DESCRIPTION =
  "Add or subtract days, weeks, months, or years from any date. Optional business-day mode skips weekends and can exclude public holidays by country.";

export const FAQ_ITEMS = [
  {
    question: "How do I add days to a date?",
    answer:
      "Choose a start date, select Add, enter an amount, and pick Days (or Weeks, Months, or Years). The resulting date updates as you type. Presets like +30 or +90 days fill the amount relative to today for common “days from today” questions.",
  },
  {
    question: "How do I subtract days from a date?",
    answer:
      "Use the same form with Subtract selected. Enter how many days, weeks, months, or years to go backward from the start date. A negative amount also flips Add and Subtract automatically; the count used is always the absolute value.",
  },
  {
    question: "What date is 90 days from today?",
    answer:
      "Click the +90 days preset (or set Start Date to today, Add, Amount 90, Unit Days). The result panel shows the calendar date, weekday, and how many calendar days later that is. You can switch to business days only if you need ninety weekdays instead of calendar days.",
  },
  {
    question: "What happens when I add a month to January 31?",
    answer:
      "Month and year math uses date-fns, which clamps to the last valid day of the target month. Adding one month to January 31 lands on the last day of February (28 or 29 in a leap year), not March 2 or 3. The same end-of-month behavior applies when subtracting months.",
  },
  {
    question: "Does this calculator exclude weekends or holidays?",
    answer:
      "Only when Unit is Days and Business days only is on: non-working weekdays (Saturday and Sunday by default) are skipped, and under More options you can choose a country holiday list, change the weekend pattern, or add custom days off — the same shared logic as the Business Days Calculator. Weeks, months, and years always use calendar arithmetic.",
  },
  {
    question: "Does this account for leap years?",
    answer:
      "Yes. date-fns uses the Gregorian calendar, so February 29 in leap years is handled correctly when you add or subtract days, weeks, months, or years across that date.",
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
  name: "Add or Subtract Days Calculator",
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
      name: "Add or Subtract Days",
      item: CANONICAL_URL,
    },
  ],
};

export default function AddSubtractDaysPage() {
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
            { label: "Add or Subtract Days" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-date">
            <CalendarPlus className="size-4.5" aria-hidden="true" />
            Date plus or minus days, weeks, months
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Add or Subtract Days Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find what date is 90 days from now, subtract days from a deadline,
            or add weeks and months — with an optional business-day mode that
            skips weekends and, under More options, optional public holidays.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <AddSubtractDaysCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="how-to-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Add or Subtract Days From a Date
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Three steps to shift any start date forward or backward.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  1
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Pick the start date
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  It defaults to today after the page loads. Change it for any
                  past or future anchor, or use a “days from today” preset.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  2
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Choose add or subtract
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Enter the amount and unit — days, weeks, months, or years.
                  For weekdays only, keep Unit on Days and turn on business
                  days.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  3
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Read the resulting date
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  See the weekday, full date, year, and how far that day is from
                  your start date in calendar days.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-works-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-works-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How the Calculation Works
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Calendar days, weeks, months, and years use date-fns helpers so
                leap years and end-of-month edges stay correct. Business-day
                mode (Days only) walks forward or backward one day at a time and
                skips non-working weekdays and optional selected holidays with
                the same shared logic as the{" "}
                <a
                  href="/date-time/business-days-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Business Days Calculator
                </a>
                . Adding months follows date-fns clamping: January 31 plus one
                month becomes the last day of February.
              </p>
            </div>
          </section>

          <section aria-labelledby="common-uses-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="common-uses-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Uses
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A date calculator helps whenever you need “date plus X days” or
                a weekday a set number of business days out.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Deadlines and notice periods
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Project a due date thirty or ninety days from a filing or
                  notice start.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Delivery and shipping estimates
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Add calendar or business days to an order date for an ETA
                  window.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Pregnancy and project planning
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Count weeks or months ahead from a known start without a
                  spreadsheet.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Warranty and return windows
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Subtract or add the policy length to see the last valid return
                  day.
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
                Adding days, months, business days, and leap years.
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
                Count spans, working days, or exact age on CalcDaily.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                href="/date-time/days-between-dates"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Days Between Two Dates
                </span>
                <span className="text-sm text-muted">
                  Exact calendar days between any two dates
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
                  Working days between two dates for deadlines and SLAs
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
                  Exact age in years, months, and days
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
              <Link
                href="/finance/loan-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Loan Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly payment (EMI) and amortization schedule
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
