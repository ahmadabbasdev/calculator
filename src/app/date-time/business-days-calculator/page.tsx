import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ChevronDown } from "lucide-react";
import { BusinessDaysCalculator } from "@/components/calculators/BusinessDaysCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/date-time/business-days-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE =
  "Business Days Calculator — Working Days Between Two Dates";
const PAGE_DESCRIPTION =
  "Count working days between two dates with optional public holidays by country, custom weekends, and custom days off. Free business days calculator for deadlines and SLAs.";

export const FAQ_ITEMS = [
  {
    question: "What counts as a business day?",
    answer:
      "A business day (working day) is any day that is not a non-working weekday and not a selected holiday. By default Saturday and Sunday are non-working. Under More options you can change the weekend pattern, choose a country holiday list, and add custom days off.",
  },
  {
    question: "Does this calculator exclude public holidays?",
    answer:
      "Yes, optionally. Open More options, choose a country (and region when available), and turn on Public holidays and/or Bank holidays. Holidays that fall on a non-working weekday are listed but do not reduce the count twice. Holiday data is community-maintained and may miss local, regional, or one-off days — confirm important deadlines.",
  },
  {
    question: "How is this different from calendar days?",
    answer:
      "Calendar days count every day in the range, including weekends. Business days count only working days. For example, a span that includes a Saturday and Sunday will show fewer business days than total calendar days.",
  },
  {
    question: "Which countries are supported?",
    answer:
      "The Country holidays menu lists the countries available in the open-source date-holidays dataset (community-maintained public holiday calendars for many countries). Some countries also offer a region or state list. Selecting a country loads a static holiday file in your browser.",
  },
  {
    question: "How accurate is the holiday data?",
    answer:
      "Holiday dates come from a community-maintained open-source dataset. They cover common public holidays for many countries but are not an official government calendar and may miss local, regional, or newly announced one-off days. Lunar-based holidays such as Eid may differ by a day from the official announcement. Confirm important deadlines yourself.",
  },
  {
    question: "Can I use a different weekend, such as Friday and Saturday?",
    answer:
      "Yes. Under More options, use the non-working weekday checkboxes or the Fri–Sat preset. You can also choose Sat–Sun (default) or Sunday only. At least one weekday must remain a working day.",
  },
  {
    question: "Can I add my own days off?",
    answer:
      "Yes. Under More options, add custom days off for company closures or personal leave. Your inputs stay in your browser. They are never sent to our servers or stored.",
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
  name: "Business Days Calculator",
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
      name: "Business Days Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function BusinessDaysCalculatorPage() {
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
            { label: "Business Days Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-date">
            <Briefcase className="size-[18px]" aria-hidden="true" />
            Working days calculator
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Business Days Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Count working days between two dates — weekends excluded by default,
            with optional public holidays by country, custom weekends, and
            custom days off. Built for deadlines, delivery windows, contracts,
            and SLA planning.
          </p>
        </header>

        <BusinessDaysCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="what-are-business-days-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="what-are-business-days-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Counts as a Business Day?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Business days are the days your team typically works. By default
                this tool treats Monday–Friday as working days and excludes
                Saturday and Sunday. Under More options you can change which
                weekdays are non-working and optionally subtract public or bank
                holidays for a selected country.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Default work week
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Monday through Friday count as business days. Saturday and
                  Sunday are weekend days and do not add to the workday total.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Custom weekends
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Under More options, pick Fri–Sat, Sunday only, or any mix of
                  non-working weekdays that matches your region or team.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="holidays-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="holidays-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Business Days and Public Holidays
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Optional country holiday lists come from a community-maintained
                open-source dataset. They cover common public holidays for many
                countries but are not an official calendar. Observed or
                substitute days are flagged when the dataset marks them.
                Holidays that fall on a non-working weekday have no extra effect
                on the count. Lunar-based holidays (such as Eid) may differ by a
                day from the actual announcement. Confirm important deadlines.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-700">
                Data sources: holiday calendars from{" "}
                <a
                  href="https://github.com/commenthol/date-holidays"
                  className="font-medium text-foreground underline underline-offset-2"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  date-holidays
                </a>{" "}
                (data © contributors,{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/3.0/"
                  className="font-medium text-foreground underline underline-offset-2"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  CC BY-SA 3.0
                </a>
                ; library code ISC).
              </p>
            </div>
          </section>

          <section aria-labelledby="use-cases-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="use-cases-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Use Cases
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Working-day counts show up wherever weekends should not inflate
                a timeline.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Project deadlines
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Estimate how many workdays remain before a ship date or
                  milestone without treating weekends as productive days.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Delivery estimates
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Quote turnaround in business days for fulfillment, shipping,
                  or vendor lead times that pause on weekends.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Contract terms
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Check notice periods, payment windows, and cure periods that
                  are defined in working days rather than calendar days.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  SLA calculations
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Measure response or resolution windows in business days for
                  support SLAs and service commitments.
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
                Working days vs calendar days, weekends, and holidays.
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
                Need total calendar days or exact age instead?
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
                  Daily average using working days across a date range
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
                  Exact calendar days, weeks, months, and optional business-day
                  view
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
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
