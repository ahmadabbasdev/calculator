import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Sigma } from "lucide-react";
import { AverageCalculator } from "@/components/calculators/AverageCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/average-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Average Calculator - Mean, Median, Mode & Range";
const PAGE_DESCRIPTION =
  "Free average calculator for mean, median, mode, range, geometric mean, and standard deviation. Paste numbers for instant results in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate the average of a list of numbers?",
    answer:
      "Add every value in the list, then divide by how many numbers you entered. That quotient is the arithmetic mean — what most people mean by “average.” This calculator does that for you as soon as you paste or type the list, separated by commas, spaces, or new lines.",
  },
  {
    question: "How do I calculate an average per day?",
    answer:
      "Divide the total by the number of days: average per day = total ÷ number of days. For a dedicated daily-average tool with date ranges, working days, and week/month/year pace, use the Average Per Day Calculator.",
  },

  {
    question: "What is the difference between mean, median, and mode?",

    answer:
      "The mean is the sum divided by the count. The median is the middle value after sorting (or the average of the two middle values when the count is even). The mode is the value that appears most often. Use the mean for a typical total-driven average, the median when outliers might skew the mean, and the mode when you care about the most common value.",
  },
  {
    question: "What if there is no mode, or more than one mode?",
    answer:
      "If every number appears only once, there is no mode — the result says so instead of inventing a value. If two or more numbers tie for the highest frequency, the calculator lists all of them as modes (a multimodal set).",
  },
  {
    question: "What is the difference between population and sample standard deviation?",
    answer:
      "Population standard deviation divides by n and treats your list as the full set. Sample standard deviation divides by n − 1 and is the usual choice when the list is a sample used to estimate a larger population. This tool shows both, clearly labeled, so you can pick the one your class or report expects.",
  },
  {
    question: "Does this work with negative numbers or decimals?",
    answer:
      "Yes. Mean, median, mode, range, variance, and standard deviation all support negatives and decimals. Geometric mean is different: it only applies when every value is strictly positive, so the calculator shows N/A if zeros or negatives are present.",
  },
  {
    question: "What is a geometric mean, and when is it used instead of a regular average?",
    answer:
      "The geometric mean multiplies the values and takes the nth root (computed safely with logarithms here). It is useful for growth rates, returns, and ratios where compounding matters. For everyday averages of scores or measurements, the arithmetic mean is usually the right choice.",
  },
  {
    question: "How is statistical range calculated?",
    answer:
      "Range is simply the largest value minus the smallest value in your list. It is a quick spread measure — easy to read, but sensitive to extreme outliers compared with standard deviation.",
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
  name: "Average Calculator",
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
      name: "Average Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function AverageCalculatorPage() {
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
            { label: "Average Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <Sigma className="size-4.5" aria-hidden="true" />
            Mean, median, mode &amp; more
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Average Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find the mean (average), median, mode, range, geometric mean, and
            standard deviation for any list of numbers — paste values separated
            by commas, spaces, or new lines and see results update instantly.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <AverageCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Average Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A short path from a raw list to mean, median, mode, and the rest
                of the stats panel.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Paste or type your numbers into the Number list field. Commas,
                spaces, and new lines all work — mix them if you like.
              </li>
              <li>
                Watch the count of valid numbers and any “values skipped” note
                so you know blanks or stray text were ignored, not misread.
              </li>
              <li>
                Read the large mean (average) first, then scan median, mode,
                range, geometric mean, and both population and sample standard
                deviation in the grid below.
              </li>
              <li>
                Use Clear when you want a fresh list. Nothing is submitted; all
                math stays in your browser.
              </li>
            </ol>
          </section>

          <section aria-labelledby="mean-median-mode-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="mean-median-mode-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Mean vs. Median vs. Mode
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                These three “center” measures answer different questions about
                the same list — which is why a mean median mode calculator shows
                them together.
              </p>
            </div>
            <div className="grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Mean (average)
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Sum every value and divide by the count. Best when every point
                  should pull equally on the total — test score averages, daily
                  spend, or batch measurements.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Median
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  The middle value after sorting. Outliers (one huge bonus, one
                  bad score) move the mean more than the median, so median is
                  often safer for skewed data.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Mode
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  The most frequent value. Useful for categories or repeated
                  measurements. If nothing repeats, there is no mode; if several
                  values tie, you have more than one mode.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="std-dev-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="std-dev-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Standard Deviation Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Standard deviation describes how spread out the numbers are
                around the mean. Variance is the square of that spread; we show
                both.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                First find the mean, then measure each value’s distance from it,
                square those distances, and average them. The square root of that
                average is the standard deviation. Dividing by{" "}
                <strong className="font-semibold text-foreground">n</strong>{" "}
                gives the <em>population</em> version — use it when your list is
                the complete set you care about.
              </p>
              <p>
                Dividing by{" "}
                <strong className="font-semibold text-foreground">n − 1</strong>{" "}
                gives the <em>sample</em> version — the usual choice in
                coursework and research when the list is a sample meant to
                estimate a larger population. With fewer than two numbers, sample
                standard deviation is undefined, so the calculator shows N/A
                rather than a misleading zero.
              </p>
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
                Wherever you have a list of numbers and need a quick average or
                spread check.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                <strong className="font-semibold text-foreground">
                  Test scores and grades
                </strong>{" "}
                — class averages, median score, and how wide the spread is.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Survey and research data
                </strong>{" "}
                — summarize responses and report sample standard deviation.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Sports statistics
                </strong>{" "}
                — points, times, or distances across games or seasons.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Budgeting and finance
                </strong>{" "}
                — typical spend, range of monthly costs, or growth via geometric
                mean when rates compound.
              </li>
            </ul>
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
                Quick answers about averages, modes, range, and standard
                deviation.
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
                    {item.question === "How do I calculate an average per day?" ? (
                      <>
                        Divide the total by the number of days: average per day
                        = total ÷ number of days. For a dedicated daily-average
                        tool with date ranges, working days, and week/month/year
                        pace, use the{" "}
                        <Link
                          href="/math/average-per-day-calculator"
                          className="font-medium text-foreground underline underline-offset-2"
                        >
                          Average Per Day Calculator
                        </Link>
                        .
                      </>
                    ) : (
                      item.answer
                    )}
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
                More math tools on CalcDaily.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/math/average-per-day-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Per Day Calculator
                </span>
                <span className="text-sm text-muted">
                  Daily average or total from an amount and days or a date range
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
                href="/math/gpa-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  GPA &amp; CGPA Calculator
                </span>
                <span className="text-sm text-muted">
                  Semester SGPA, cumulative CGPA, and common grading scales
                </span>
              </Link>
              <Link
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, weight, volume, and temperature conversions
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
                  Calendar days between two dates
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
                  Working days with weekends and holidays
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
