import type { Metadata } from "next";
import Link from "next/link";
import { Cake, ChevronDown } from "lucide-react";
import { AgeCalculator } from "@/components/calculators/AgeCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/date-time/age-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Age Calculator - How Old Am I? Free & Instant";
const PAGE_DESCRIPTION =
  "Calculate your exact age from date of birth in years, months, and days. See how many days old you are and days until your next birthday. Free — runs in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate my exact age?",
    answer:
      "Enter your date of birth and, if you like, change “Age at the Date of” from today to any other date. The calculator subtracts the birth date from that reference date using the calendar, then reports the difference as years, months, and days — the same breakdown people mean by “exact age.”",
  },
  {
    question: "How old am I if I was born in [year]?",
    answer:
      "Pick any date of birth in that year (or the year alone via a date in that year) and leave “Age at the Date of” set to today — or choose another date. Your age is the full years completed since that birth date, plus the remaining months and days. You do not need to do the arithmetic by hand; the tool updates as soon as both dates are set.",
  },
  {
    question: "How is age calculated for someone born on February 29?",
    answer:
      "Leap-day birthdays are counted with normal calendar math for years, months, and days. When the next birthday falls in a non-leap year, this calculator observes March 1 as the birthday for “days until next birthday,” which matches a common civil convention. The FAQ and on-screen note call that out when it applies.",
  },
  {
    question: "How many days old am I?",
    answer:
      "Open “Show more units” (or read the line under the main result) to see total days lived between your date of birth and the age-at date. That figure is a straight calendar-day count, so it answers “how many days old am I” without converting through months first.",
  },
  {
    question: "Can I calculate age on a future or past date?",
    answer:
      "Yes. Change “Age at the Date of” to any past or future day on or after the date of birth. That is how you get age on a specific date — for example school cut-offs, visa rules, or “how old will I be on…”. If the age-at date is before the birth date, you will see a short inline message instead of a result.",
  },
  {
    question: "Is my date of birth stored or shared?",
    answer:
      "Your inputs stay in your browser. They are never sent to our servers or stored. Age is calculated on this page in your browser only.",
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
  name: "Age Calculator",
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
      name: "Age Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function AgeCalculatorPage() {
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
            { label: "Age Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-date">
            <Cake className="size-[18px]" aria-hidden="true" />
            Age calculator by date of birth
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Age Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find out how old you are — or how old you were or will be on any
            date — in exact years, months, and days. See how many days old you
            are and when your next birthday falls.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <AgeCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Age Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Three steps to answer “how old am I” or age on a specific date.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  1
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Enter date of birth
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Choose the birth date with the calendar. Optional shortcuts
                  fill a date from a number of years ago if you only need a
                  quick check.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  2
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Set the age-at date
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  It defaults to today. Change it to calculate age difference on
                  a past deadline or a future milestone — school cut-offs,
                  ceremonies, or “age on a specific date.”
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-date text-[12px] font-bold text-white">
                  3
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Read the live result
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Years, months, and days update as you type. Expand more units
                  for total days lived, and check days until your next birthday.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Age Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Age is the calendar span from date of birth to the age-at date,
                expressed first as completed years, then leftover months, then
                leftover days. Leap years are included automatically because the
                math uses the real Gregorian calendar via date-fns — not fixed
                365-day years. If someone was born on February 29, the year /
                month / day age still follows the calendar; for “when is my next
                birthday,” a non-leap year uses March 1 as the observed date.
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
                An age calculator by date of birth helps whenever a form asks
                for exact age, not just a year.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Legal and eligibility checks
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Confirm whether someone has reached a required age on a filing
                  or event date.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  School admission cut-offs
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Compare date of birth to a district cut-off to see age on that
                  day.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Insurance and milestones
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Check age bands for quotes, or count down to a milestone
                  birthday and the weekday it lands on.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Retirement planning
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Project age on a future retirement or benefit start date
                  without spreadsheet formulas.
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
                Exact age, leap-day birthdays, days old, and how inputs are
                handled.
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
                More date tools for spans, working days, and shifting dates.
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
                  Exact calendar days, weeks, and months between any two dates
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
                href="/health/bmi-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BMI Calculator
                </span>
                <span className="text-sm text-muted">
                  Body mass index from height and weight
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
