import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, PiggyBank } from "lucide-react";
import { SavingsGoalCalculator } from "@/components/calculators/SavingsGoalCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/savings-goal-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Savings Goal Calculator - How Much to Save Per Month";
const PAGE_DESCRIPTION =
  "Free savings goal calculator: how much to save each month or how long a goal takes, with optional interest and inflation. Estimates run in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate how much to save each month?",
    answer:
      "Divide the amount you still need by the number of months, or use a savings plan that includes an assumed interest rate. This savings goal calculator solves for the monthly amount from your goal, time frame, starting balance, and rate.",
  },
  {
    question: "How long will it take me to save a certain amount?",
    answer:
      "With a fixed monthly contribution, the time depends on the goal, what you already have, and any interest you assume. Mode two of this monthly savings calculator reports whole months, rounded up so the balance is at or above the target.",
  },
  {
    question: "Does the interest rate make a big difference?",
    answer:
      "At higher rates and longer time frames, interest can reduce the monthly amount needed or shorten the wait. At low rates the change is often small, so the contribution does most of the work. The rate here is an assumption you choose.",
  },
  {
    question: "Should I include inflation in my savings goal?",
    answer:
      "Optional. If your goal is far ahead and you want it to keep today’s purchasing power, turn on the inflation adjustment so the calculator targets a larger future amount. Leave it off if you prefer to plan in today’s numbers only.",
  },
  {
    question:
      "What is the difference between contributions at the start and end of the month?",
    answer:
      "Contributions at the beginning of each month start earning interest sooner than contributions at the end. Over many months that timing can slightly change the required amount or the time to the goal.",
  },
  {
    question: "What if I already have some savings?",
    answer:
      "Enter them as the starting amount. The calculator only plans for the remaining gap. If the starting amount already meets the goal, the required monthly saving is zero.",
  },
  {
    question: "Will my bank's numbers match this calculator?",
    answer:
      "They may differ slightly because of how interest is credited, fees, minimum balances, and rate changes. Treat these figures as estimates and confirm details with your own account terms.",
  },
  {
    question: "What if I cannot save the full amount each month?",
    answer:
      "You can try a longer time frame or a smaller goal in the calculator to see other plans. There is no single right amount — choose what fits your situation, or talk with a qualified adviser.",
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
  name: "Savings Goal Calculator",
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
      name: "Savings Goal Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function SavingsGoalCalculatorPage() {
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
            { label: "Savings Goal Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <PiggyBank className="size-4.5" aria-hidden="true" />
            Monthly savings plan &amp; timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Savings Goal Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find how much to save each month for a goal, or how long it will
            take at a monthly amount — with optional interest and inflation.
            Useful for a down payment, emergency fund, or other personal
            target. For “what will my savings grow to,” use the{" "}
            <Link
              href="/finance/compound-interest-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Compound Interest Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <SavingsGoalCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Savings Goal Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two modes for a savings plan calculator workflow.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose “How much to save” or “How long it will take,” then enter
                your savings goal and any starting amount.
              </li>
              <li>
                In mode one, set the time frame. In mode two, enter the monthly
                contribution you have in mind.
              </li>
              <li>
                Optionally add an assumed interest rate, compounding, timing,
                or an inflation adjustment under More options.
              </li>
              <li>
                Read the monthly amount or timeline, summary, chart, and yearly
                breakdown. Results update as you type.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-much-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-much-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Much to Save Each Month
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The monthly amount needed for a fixed goal and deadline.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Without interest, how much you need to save per month is simply
                the remaining gap divided by the number of months. Example: a
                10,000 goal with nothing saved yet and 10 months means 1,000
                each month. With interest, the same goal over a longer span can
                need a smaller deposit because each contribution can earn a
                little before the deadline.
              </p>
              <p>
                Example with interest: 10,000, start 0, 5% compounded monthly,
                5 years, contributions at month-end — about 147.05 per month.
                That is lower than saving the same 10,000 with no interest over
                60 months (about 166.67), because interest covers part of the
                gap.
              </p>
            </div>
          </section>

          <section aria-labelledby="how-long-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-long-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Long Will It Take to Reach Your Goal?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Mode two answers “how long to save for a goal” at a fixed
                monthly amount.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Enter the goal, your monthly contribution, and any starting
                balance. Example: 10,000 with 200 each month and 0% interest
                takes 50 months. At 5% compounded monthly the exact solution is
                about 45.5 months, so the calculator rounds up to 46 months and
                checks the balance month by month so the reported month is the
                first one at or above the target.
              </p>
            </div>
          </section>

          <section aria-labelledby="with-without-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="with-without-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Saving With and Without Interest
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Side-by-side on the same goal and time frame.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                For 10,000 over 5 years with no starting balance: at 0% you need
                about 166.67 per month; at 5% compounded monthly about 147.05.
                The gap is noticeable here, but at very low rates the monthly
                change is small — the contribution still does most of the work.
                Interest is never guaranteed; it is only an assumption in the
                model.
              </p>
            </div>
          </section>

          <section aria-labelledby="inflation-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="inflation-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Adjusting Your Goal for Inflation
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                When a far-ahead goal may cost more later.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                If you treat 10,000 as today’s money and assume 3% yearly
                inflation over 10 years, the inflated target is about 13,439.16.
                The calculator then plans toward that higher amount while still
                showing the original goal in today’s money. Leave inflation off
                if you prefer a simple nominal target.
              </p>
            </div>
          </section>

          <section aria-labelledby="common-goals-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="common-goals-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Savings Goals
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Examples only — amounts are personal.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                People use a down payment savings calculator or house deposit
                savings calculator framing for a home deposit, an emergency fund
                calculator framing for unexpected costs, or plans for a car,
                education, travel, or a wedding. This page does not recommend
                how large any of those targets should be; enter the figure that
                matches your own plan.
              </p>
            </div>
          </section>

          <section aria-labelledby="limitations-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limitations-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Include
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Honest limits of a savings estimate.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Taxes, account fees, minimum balances, changing interest rates,
                and irregular deposits or withdrawals are not modeled. Results
                are estimates. For growth of a balance with flexible
                contributions and compounding detail, see the Compound Interest
                Calculator rather than this savings goal tool.
              </p>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Monthly amounts, timelines, interest, and inflation.
              </p>
            </div>
            <div className="max-w-3xl divide-y divide-border/80">
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

          <section aria-labelledby="sources-heading" className="max-w-3xl">
            <h2
              id="sources-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Sources
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              Building savings:{" "}
              <a
                href="https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — An essential guide to building an emergency fund
              </a>
              . How interest on savings is treated for tax (UK):{" "}
              <a
                href="https://www.moneyhelper.org.uk/en/savings/types-of-savings/tax-on-savings-and-investments"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                MoneyHelper — Tax on savings and investments
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and illustrative
              estimates only. It is not financial advice. Talk to a qualified
              financial adviser about your own situation.
            </p>
            <p className="mt-2 text-[12px] text-zinc-600">
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
                Growth estimates, loan payments, percent math, and dates.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/finance/compound-interest-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Compound Interest Calculator
                </span>
                <span className="text-sm text-muted">
                  Future value with contributions and APY
                </span>
              </Link>
              <Link
                href="/finance/budget-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
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
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Loan Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly payment (EMI) and amortization
                </span>
              </Link>
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Salary to Hourly Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert salary, hourly wage, and other pay periods
                </span>
              </Link>
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and more
                </span>
              </Link>

              <Link
                href="/date-time/add-subtract-days"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Add or Subtract Days
                </span>
                <span className="text-sm text-muted">
                  Date plus or minus days, weeks, months, or years
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
