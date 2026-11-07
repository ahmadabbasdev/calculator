import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Percent } from "lucide-react";
import { PercentageCalculator } from "@/components/calculators/PercentageCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SHOW_STATE_TAX_PILOT } from "@/lib/state-tax/config";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/percentage-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Percentage Calculator - Free Percent Change & More";
const PAGE_DESCRIPTION =
  "Free percentage calculator for percent of a number, percentage increase or decrease, percent change, and finding the whole. Instant results with worked steps.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate a percentage of a number?",
    answer:
      "Use the “What is X% of Y?” mode. Enter the percent and the number — for example, what is 15% of 200. The calculator multiplies the percent by the number over 100, so 15% × 200 = 30, and shows that worked step under the result.",
  },
  {
    question: "How do I find what percent one number is of another?",
    answer:
      "Choose “X is what % of Y?”, enter the part and the whole, and read the percent. The formula is (X ÷ Y) × 100. If the whole is zero, division is impossible and you will see a short message instead of a result.",
  },
  {
    question: "How do I calculate percentage increase or decrease?",
    answer:
      "Use “% change from X to Y” for the relative change between two values, or “Increase / decrease X by Y%” when you want to apply a percent to a starting amount (such as a discount or raise). Percent change uses ((Y − X) ÷ |X|) × 100 and labels the result as an increase or decrease.",
  },
  {
    question: "What is the difference between percentage change and percentage points?",
    answer:
      "Percentage change is relative to a starting value — moving from 20% to 30% is a 50% increase because 10 is half of 20. Percentage points measure the plain difference between two percents — that same move is 10 percentage points. This calculator reports percentage change, not percentage points.",
  },
  {
    question: "How do I add or subtract a percentage from a number?",
    answer:
      "Open “Increase / decrease X by Y%”, pick Increase or Decrease, then enter the number and the percent. That covers markups, sale discounts, tax add-ons, and “subtract 10% from 50.” The worked step shows X × (1 ± Y/100).",
  },
  {
    question: "How do I find the original number if I know a percentage of it?",
    answer:
      "Use “X is Y% of what number?” when you know a part and the percent it represents — for example, 20 is 25% of what number. The calculator divides the part by (percent ÷ 100) to recover the whole.",
  },
  {
    question: "Why is percent change undefined when the starting value is zero?",
    answer:
      "Percent change divides by the starting value (using its absolute value so negative starts stay well-defined). If that start is zero, there is no baseline to compare against, so the ratio is undefined. Enter a non-zero starting value, or use another mode if you are not measuring change from a baseline.",
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
  name: "Percentage Calculator",
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
      name: "Percentage Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function PercentageCalculatorPage() {
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
            { label: "Percentage Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <Percent className="size-4.5" aria-hidden="true" />
            Percent calculator for everyday math
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Percentage Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find what is 15% of 200, what percent one number is of another,
            percentage increase or decrease, and the original whole when you
            only know a percent of it — with a clear worked step every time.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <PercentageCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Percentage Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Pick the mode that matches how you ask the question, then fill
                the blanks. Results update as you type.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  1
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Choose a mode
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Select percent of a number, “X is what % of Y,” percent
                  change, increase/decrease by a percent, or “X is Y% of what.”
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  2
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Enter the numbers
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Type into each blank in the sentence. Negatives are allowed
                  where the math is valid; leave a field empty to clear the
                  result.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  3
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Read the result and step
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  The large answer appears on the right with a one-line formula
                  filled with your values — useful for homework checks and
                  receipts alike.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="formulas-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="formulas-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Percentage Formulas
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Each mode uses a standard percent formula. Here is the math with
                one fixed example apiece.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  What is X% of Y?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  (X ÷ 100) × Y. Example: 15% of 200 → (15 ÷ 100) × 200 = 30.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  X is what % of Y?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  (X ÷ Y) × 100. Example: 40 is what % of 160 → (40 ÷ 160) × 100
                  = 25%.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Percent change from X to Y
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  ((Y − X) ÷ |X|) × 100. Example: from 80 to 100 → ((100 − 80) ÷
                  80) × 100 = 25% increase. Absolute value in the denominator
                  keeps negative starts well-defined.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Increase or decrease X by Y%
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  X × (1 ± Y/100). Example: increase 80 by 25% → 80 × 1.25 =
                  100. Decrease 50 by 10% → 50 × 0.9 = 45.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4 md:col-span-2">
                <h3 className="text-[16px] font-semibold text-foreground">
                  X is Y% of what number?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  X ÷ (Y ÷ 100). Example: 20 is 25% of what → 20 ÷ 0.25 = 80.
                </p>
              </div>
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
                A percent calculator shows up anywhere prices, scores, or rates
                are compared.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Discounts and sale prices
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Take 20% off a price or check what a coupon leaves you paying.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Sales tax and tips
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Add tax to a subtotal or figure a tip as a percent of the bill.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Grades and test scores
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Convert points earned into a percent of the total possible.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Price changes and raises
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Measure percentage increase between old and new prices or
                  salaries.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4 md:col-span-2">
                <h3 className="text-[16px] font-semibold text-foreground">
                  Interest and growth rates
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Express growth as a percent of a starting balance when you
                  compare two snapshots (simple percent change, not compound
                  schedules).
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
                Percent of a number, percent change, and finding the whole.
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
                Other live tools on CalcDaily.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/math/grade-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Grade Calculator
                </span>
                <span className="text-sm text-muted">
                  Weighted grades, final exam needed, and test score to letter
                </span>
              </Link>
              <Link
                href="/math/gpa-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  GPA Calculator
                </span>
                <span className="text-sm text-muted">
                  Weighted or unweighted college and high school GPA
                </span>
              </Link>
              <Link
                href="/math/average-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Calculator
                </span>
                <span className="text-sm text-muted">
                  Mean, median, mode, range, and standard deviation
                </span>
              </Link>
              <Link
                href="/math/average-per-day-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Per Day Calculator
                </span>
                <span className="text-sm text-muted">
                  Daily average, cost per day, and totals from a period
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
                href="/finance/zakat-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Zakat Calculator
                </span>
                <span className="text-sm text-muted">
                  Nisab, gold, silver and savings estimates (calculation aid)
                </span>
              </Link>
              <Link
                href="/finance/vat-gst-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  VAT, GST &amp; Sales Tax Calculator
                </span>
                <span className="text-sm text-muted">
                  Add or remove tax, or find the rate from net and gross
                </span>
              </Link>
              <Link
                href="/finance/budget-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Budget Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly 50/30/20, custom percentages, or your own list
                </span>
              </Link>
              <Link
                href="/finance/loan-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Loan Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly payment (EMI) and amortization schedule
                </span>
              </Link>
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Salary to Hourly Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert salary to hourly wage and other pay periods
                </span>
              </Link>
              {SHOW_STATE_TAX_PILOT ? (
                <Link
                  href="/finance/state-income-tax-calculator"
                  className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
                >
                  <span className="text-[15px] font-semibold text-foreground">
                    US State Income Tax Calculator
                  </span>
                  <span className="text-sm text-muted">
                    Verified state brackets and deductions — state tax only
                  </span>
                </Link>
              ) : null}
              <Link
                href="/finance/compound-interest-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Compound Interest Calculator
                </span>
                <span className="text-sm text-muted">
                  Future value, contributions, and APY
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
