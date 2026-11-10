import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Scale } from "lucide-react";
import { DebtPayoffCalculator } from "@/components/calculators/DebtPayoffCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/debt-payoff-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Debt Payoff Calculator - Snowball & Avalanche";
const PAGE_DESCRIPTION =
  "Compare debt snowball, avalanche, selected order, and minimums-only plans. See months to debt-free, interest totals, and a schedule — not financial advice.";

export const FAQ_ITEMS = [
  {
    question: "What is the difference between snowball and avalanche?",
    answer:
      "Snowball puts extra payments toward the smallest balance first. Avalanche puts extra toward the highest interest rate first. Avalanche usually costs the least interest in this model; some people prefer snowball because the first debts clear sooner. The best plan is the one you can keep.",
  },
  {
    question: "How does the month-1 example work?",
    answer:
      "With debt A (500 at 6%, minimum 25) and debt B (3,000 at 24%, minimum 75) and a total of 300: interest is 2.50 on A and 60.00 on B. Snowball pays 225 toward A (balance 277.50) and 75 toward B (balance 2,985.00). Avalanche pays 275 toward B (balance 2,785.00) and 25 toward A (balance 477.50).",
  },
  {
    question: "What does rolling freed minimums mean?",
    answer:
      "When a debt is paid off under snowball, avalanche or selected order, you keep sending the same total monthly amount. The minimum that used to go to the cleared debt becomes extra for the next debt in line. Minimums-only does not roll those amounts.",
  },
  {
    question: "Why do early payments mostly cover interest?",
    answer:
      "Interest is added each month before payments. On higher-rate or larger balances, a large share of an early minimum can go to that month’s interest, so the balance falls slowly at first. Extra payments above the minimums reduce principal faster.",
  },
  {
    question: "Is this the same as a loan calculator?",
    answer:
      "No. This page compares payoff order across multiple existing debts. For a single loan’s payment, amortization schedule or EMI estimate, use the Loan Calculator.",
  },
  {
    question: "What does the calculator not model?",
    answer:
      "It does not model variable rates, new purchases, fees, promotional rates, lender-specific interest methods or daily compounding. Results are a simplified monthly estimate for comparison.",
  },
  {
    question: "Does this give personal financial advice?",
    answer:
      "No. Results are general information for planning and comparison. If you’re struggling to keep up with payments, you may want to contact your lender or a not-for-profit credit counselling service in your country.",
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
  name: "Debt Payoff Calculator",
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
      name: "Debt Payoff Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function DebtPayoffCalculatorPage() {
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
            { label: "Debt Payoff Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Scale className="size-4.5" aria-hidden="true" />
            Snowball, avalanche, selected order, and minimums
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Debt Payoff Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Compare how long multiple debts take to clear under snowball,
            avalanche, your own order, or minimum payments only. Numbers stay in
            your browser.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For a single loan payment or amortization schedule, use the{" "}
            <Link
              href="/finance/loan-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Loan Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <DebtPayoffCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-strategies-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-strategies-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Snowball and Avalanche Work
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Same monthly total — different order for the leftover.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                List each debt with its balance, annual percentage rate (APR)
                and minimum payment, then enter the total you can put toward all
                debt payments each month. That total must be at least the sum of
                the minimums. Every strategy first covers those minimums; what
                remains is the “extra.” Names are optional — leave them blank if
                you only care about the numbers.
              </p>
              <p>
                Snowball sends extra to the smallest balance first. Avalanche
                sends extra to the highest APR first. Selected order follows the
                up and down buttons on your list, which stay keyboard
                accessible. Minimums only pays each minimum and does not apply
                leftover or roll a cleared debt’s minimum onto the next one.
                Ties in snowball or avalanche sorting are broken by lower
                balance, then by the order of the rows.
              </p>
              <p>
                Worked month-1 example: debt A is 500 at 6% with a 25 minimum;
                debt B is 3,000 at 24% with a 75 minimum; the total monthly
                amount is 300. Interest that month is 2.50 on A and 60.00 on B.
                Under snowball, A receives 225 (balance 277.50) and B receives
                75 (balance 2,985.00). Under avalanche, B receives 275 (balance
                2,785.00) and A receives 25 (balance 477.50). The comparison
                table then shows months to debt-free, total interest and total
                paid for each strategy side by side.
              </p>
              <p>
                Avalanche usually costs the least interest in this model. Some
                people prefer snowball because the first debts clear sooner. The
                best plan is the one you can keep. This page does not recommend
                loans, consolidation, balance transfers, settlement or debt
                relief services, and it does not name lenders, apps or companies.
              </p>
            </div>
          </section>

          <section aria-labelledby="interest-rolling-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="interest-rolling-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Interest, Minimums and Rolling Payments
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Why early months can feel slow — and how freed minimums help.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Each simulated month adds interest with half-up rounding in
                cents, then applies payments. On a large or high-rate balance, a
                minimum may cover little more than that month’s interest, so the
                principal moves slowly at first. Extra above the minimums is
                what shortens the timeline. A simple one-debt check: 1,000 at
                12% with a 100 payment takes 11 months and about 58.98 in
                interest in this model — most of the early payment still leaves
                a sizeable balance.
              </p>
              <p>
                If a minimum does not cover a debt’s monthly interest and you
                have no extra in the total, the balance cannot fall in this
                model — the tool states that clearly. Raising the total monthly
                amount (or the minimum on that debt) is how the simulation can
                progress. Zero-percent debts are supported: a 600 balance with
                100 per month clears in six months with no interest.
              </p>
              <p>
                Rolling means the monthly total stays fixed after a debt is
                cleared under snowball, avalanche or selected order. The payment
                that used to satisfy that debt’s minimum becomes additional
                principal for the next target. Over time the focused payment on
                the remaining debts grows without you raising the overall
                budget. Minimums-only does not do that roll — when a debt ends,
                that minimum simply stops.
              </p>
              <p>
                Choosing a strategy is personal. If seeing accounts reach zero
                helps you stay consistent, snowball or a custom order may fit.
                If minimizing modelled interest matters most, compare avalanche
                in the table. Neutral difference lines (for example how much
                less interest avalanche costs than snowball in your scenario)
                are there for comparison, not as instructions about what you
                must do. You can switch focus between strategies without
                re-entering the debts, expand yearly schedule rows, or download
                a CSV built in the browser.
              </p>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Cover
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A simplified monthly model for comparison, not a lender statement.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The calculator does not model variable rates, new purchases on a
                card, fees, promotional or deferred-interest periods, or
                differences in how lenders calculate interest (including daily
                compounding). Real statements can diverge from these estimates.
                Runs stop at 1,200 months; if balances remain, the result says
                the debts are not paid off within 100 years at that payment.
              </p>
              <p>
                It also does not price a new loan or show amortization for a
                single advance — use the{" "}
                <Link
                  href="/finance/loan-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Loan Calculator
                </Link>{" "}
                for that. Growth of savings is covered by the{" "}
                <Link
                  href="/finance/compound-interest-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Compound Interest Calculator
                </Link>
                ; timelines to a savings target by the{" "}
                <Link
                  href="/finance/savings-goal-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Savings Goal Calculator
                </Link>
                . Inputs never go into the URL, storage, cookies, analytics or
                logs, and this page does not load analytics.
              </p>
              <p>
                If you&apos;re struggling to keep up with payments, you may want
                to contact your lender or a not-for-profit credit counselling
                service in your country.
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
                Snowball, avalanche, rolling payments and limits.
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
              Debt reduction strategies overview:{" "}
              <a
                href="https://www.consumerfinance.gov/archive/blog/how-reduce-your-debt/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — How to reduce your debt
              </a>
              . Prioritising debts guidance:{" "}
              <a
                href="https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt/how-to-prioritise-your-debts"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                MoneyHelper — How to prioritise your debts
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information only. It is not
              financial advice. Numbers are for planning and comparison — not a
              promise about outcomes.
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
                Single-loan payments, growth estimates and savings timelines.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/finance/loan-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Loan Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly payment (EMI) and amortization
                </span>
              </Link>
              <Link
                href="/finance/compound-interest-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Compound Interest Calculator
                </span>
                <span className="text-sm text-muted">
                  Future value with contributions and APY
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
                  Monthly amount or time needed to reach a goal
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
