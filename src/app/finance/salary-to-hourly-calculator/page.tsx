import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Wallet } from "lucide-react";
import { SalaryToHourlyCalculator } from "@/components/calculators/SalaryToHourlyCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SHOW_STATE_TAX_PILOT } from "@/lib/state-tax/config";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/salary-to-hourly-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Salary to Hourly Calculator - Pay Converter";
const PAGE_DESCRIPTION =
  "Convert salary to hourly wage, or hourly pay to yearly, monthly, weekly, bi-weekly, and daily amounts. Gross pay estimates with a clear worked step shown.";


export const FAQ_ITEMS = [
  {
    question: "How do I convert salary to hourly pay?",
    answer:
      "Enter your yearly (or other period) amount, choose that pay period, and set hours per week and weeks worked per year. The hourly rate is yearly pay ÷ (hours per week × weeks worked). Example: 60,000 per year at 40 hours and 52 weeks is about 28.85 per hour.",
  },
  {
    question: "How do I convert hourly wage to a yearly salary?",
    answer:
      "Choose Hourly as the pay period, enter the hourly amount, hours per week, and weeks worked per year. Yearly pay = hourly × hours per week × weeks worked. Example: 20 × 40 × 52 = 41,600 per year.",
  },
  {
    question: "Why do bi-weekly and semi-monthly pay differ?",
    answer:
      "Bi-weekly means every two weeks (26 times in a 52-week year), so that amount is weekly × 2. Semi-monthly means twice a month (24 times a year), so it is yearly ÷ 24. The same yearly gross therefore produces different bi-weekly and semi-monthly figures.",
  },
  {
    question: "What is the difference between weekly and bi-weekly pay?",
    answer:
      "Weekly is one week of gross pay. Bi-weekly (every two weeks) is two weeks of that same weekly amount. This calculator derives weekly from yearly ÷ weeks worked, then multiplies by two for bi-weekly.",
  },
  {
    question: "How does unpaid time off change the result?",
    answer:
      "Weeks worked per year defaults to 52. Optional unpaid weeks off are subtracted from that figure before conversions that use weeks (hourly, daily, weekly, and bi-weekly paths). Paid leave that still counts as worked time is not modeled here.",
  },
  {
    question: "Does this include taxes or overtime?",
    answer:
      "No. Results are gross pay estimates only. Taxes, deductions, overtime premiums, bonuses, benefits, and employer-specific rules are not included. Employers may calculate pay differently from these simple period conversions.",
  },
  {
    question: "Can I convert monthly salary to a daily wage?",
    answer:
      "Yes. Enter the monthly amount with the Monthly period. The tool converts to yearly first (monthly × 12), then derives weekly and daily (weekly ÷ days per week). Adjust days per week if your schedule is not five days.",
  },
  {
    question: "Is this the same as a loan or savings calculator?",
    answer:
      "No. This page only converts a pay amount between common periods. For loan payments see the Loan Calculator; for how much to save toward a goal see the Savings Goal Calculator; for percent of a number see the Percentage Calculator.",
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
  name: "Salary to Hourly Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
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
      name: "Finance",
      item: `${SITE_URL}/finance`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Salary to Hourly Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function SalaryToHourlyCalculatorPage() {
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
          theme="finance"
          items={[
            { label: "Home", href: "/" },
            { label: "Finance", href: "/finance" },
            { label: "Salary to Hourly Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Wallet className="size-4.5" aria-hidden="true" />
            Hourly wage, salary &amp; pay periods
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Salary to Hourly Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Convert a salary to an hourly wage — or hourly pay to yearly,
            monthly, weekly, bi-weekly, semi-monthly, quarterly, and daily
            amounts. Gross estimates with a clear worked step.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <SalaryToHourlyCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Salary to Hourly Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Enter the amount you know, pick its pay period, and set your
                usual hours and weeks. The tool fills in every other period at
                once.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Type the pay amount and choose its period: hourly, daily,
                weekly, every two weeks, twice a month, monthly, quarterly, or
                yearly.
              </li>
              <li>
                Confirm hours per week (default 40), days per week (default 5),
                and weeks worked per year (default 52). Optionally enter unpaid
                weeks off so they are subtracted from weeks worked.
              </li>
              <li>
                Pick a currency for display only — amounts are not converted
                between currencies.
              </li>
              <li>
                Read the yearly headline, the one-line worked step, and the full
                table. Your entered period is highlighted.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Salary and Hourly Pay Are Converted
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Every input is turned into a yearly gross figure first. The other
                periods are then derived from that yearly amount so the table
                stays consistent.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                From hourly pay: yearly = hourly × hours per week × weeks
                worked. From yearly salary: hourly = yearly ÷ (hours per week ×
                weeks worked). Weekly = yearly ÷ weeks worked; bi-weekly =
                weekly × 2; semi-monthly = yearly ÷ 24; monthly = yearly ÷ 12;
                quarterly = yearly ÷ 4; daily = weekly ÷ days per week.
              </p>
              <p>
                Worked example: 20 per hour, 40 hours per week, and 52 weeks
                gives 20 × 40 × 52 = 41,600 per year. That same schedule shows
                weekly 800, bi-weekly 1,600, semi-monthly about 1,733.33, monthly
                about 3,466.67, quarterly 10,400, and daily 160 (at five days per
                week). A 60,000 yearly salary at the same hours and weeks is about
                28.85 per hour.
              </p>
              <p>
                Bi-weekly and semi-monthly are easy to confuse. Every two weeks
                lands 26 times in a 52-week year; twice a month lands 24 times.
                That is why the two amounts differ for the same yearly gross.
              </p>
              <p>
                These conversions are arithmetic estimates of gross pay. They do
                not apply tax withholding, statutory deductions, overtime rules,
                bonuses, benefits, or unpaid leave policies beyond the optional
                unpaid-weeks field. Employers and payroll systems may use
                different conventions.
              </p>
            </div>
          </section>

          <section aria-labelledby="gross-only-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="gross-only-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Gross Pay Only
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                This calculator shows gross pay period equivalents. It does not
                say what anyone should earn, compare offers, or interpret minimum
                wage or tax rules. For percent changes on a number, use the{" "}
                <Link
                  href="/math/percentage-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Percentage Calculator
                </Link>
                . For loan payments or savings timelines, use the{" "}
                <Link
                  href="/finance/loan-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Loan Calculator
                </Link>{" "}
                or{" "}
                <Link
                  href="/finance/savings-goal-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Savings Goal Calculator
                </Link>
                .
              </p>
            </div>
            <p className="max-w-3xl rounded-lg border border-border/80 bg-panel px-4 py-3 text-[14px] leading-relaxed text-zinc-700">
              General information and estimates only. Not financial, tax or
              employment advice.
            </p>
            <p className="mt-4 max-w-3xl text-[13px] text-muted">
              Last reviewed: {lastUpdated}. Formulas are standard period
              arithmetic; no third-party data sources are required.
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
                Salary to hourly, bi-weekly vs semi-monthly, and what is left
                out of these estimates.
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
                Percentages, savings goals, and loan payments.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and increase or decrease
                </span>
              </Link>
              <Link
                href="/finance/savings-goal-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Savings Goal Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly amount or time needed to reach a savings goal
                </span>
              </Link>
              <Link
                href="/finance/loan-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Loan Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly payment (EMI), interest, and amortization
                </span>
              </Link>
              <Link
                href="/date-time/time-duration-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Time Duration Calculator
                </span>
                <span className="text-sm text-muted">
                  Hours between times and simple timecard totals (not payroll)
                </span>
              </Link>
              {SHOW_STATE_TAX_PILOT ? (
                <Link
                  href="/finance/state-income-tax-calculator"
                  className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
                >
                  <span className="text-[15px] font-semibold text-foreground">
                    US State Income Tax Calculator
                  </span>
                  <span className="text-sm text-muted">
                    Verified state brackets and deductions — state tax only
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
