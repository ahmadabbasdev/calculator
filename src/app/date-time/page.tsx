import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CalculatorCard } from "@/components/home/CalculatorCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  CALCULATOR_CATEGORIES,
  getCategoryTheme,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const category = CALCULATOR_CATEGORIES.find((item) => item.id === "date-time")!;
const theme = getCategoryTheme("date-time");

const PAGE_TITLE = "Date & Time Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free date and time calculators for days between dates, exact age, business days, and date math. Instant results in your browser — no signup or data stored.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/date-time`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/date-time`,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
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
  ],
};

export default function DateTimeCategoryPage() {
  const Icon = category.icon;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          theme={theme}
          items={[
            { label: "Home", href: "/" },
            { label: "Date & Time" },
          ]}
        />

        <header className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              {category.title} Calculators
            </h1>
          </div>
          <p className="text-base text-muted sm:text-lg">{category.description}</p>
        </header>

        <section aria-labelledby="date-tools-heading">
          <h2 id="date-tools-heading" className="sr-only">
            Available date and time calculators
          </h2>
          <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.calculators.map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                calculator={calculator}
                theme={theme}
              />
            ))}
          </div>
        </section>

        <article className="mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-zinc-700">
          <section aria-labelledby="date-guide-heading">
            <h2
              id="date-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Local calendar dates, not timezone math
            </h2>
            <p className="mt-3">
              Every date tool here works on local calendar dates with date-fns
              helpers. That means a span from 1 March to 31 March counts calendar
              days the way a wall calendar does — without converting through UTC
              and risking an off-by-one around daylight saving. Leap years are
              included in the Gregorian rules the libraries apply.
            </p>
            <p className="mt-3">
              Choose{" "}
              <Link
                href="/date-time/days-between-dates"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Days Between Two Dates
              </Link>{" "}
              for an inclusive or exclusive day count. Use the{" "}
              <Link
                href="/date-time/age-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Age Calculator
              </Link>{" "}
              for years, months, and days lived. Use{" "}
              <Link
                href="/date-time/business-days-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Business Days
              </Link>{" "}
              when weekends (and optional public holidays for a chosen country)
              should be excluded.{" "}
              <Link
                href="/date-time/add-subtract-days"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Add or Subtract Days
              </Link>{" "}
              shifts a start date by days, weeks, months, or years. The{" "}
              <Link
                href="/date-time/time-duration-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Time Duration Calculator
              </Link>{" "}
              covers clock times and mixed date-time spans.
            </p>
          </section>

          <section aria-labelledby="date-holidays-heading">
            <h2
              id="date-holidays-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Holidays and what we cannot promise
            </h2>
            <p className="mt-3">
              Business-day holiday lists come from the community date-holidays
              project and load as static files in your browser when you pick a
              country. Lists can lag statute changes; confirm critical deadlines
              with your employer or the relevant government calendar. None of
              these tools store your dates on our servers or put them in the URL.
            </p>
          </section>
        </article>

        <div className="mt-12 border-t border-border/80 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-900 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
          >
            <ArrowLeft className="size-4 text-muted" aria-hidden="true" />
            Back to all calculators
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
