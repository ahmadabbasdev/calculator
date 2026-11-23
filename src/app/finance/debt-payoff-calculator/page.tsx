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
import {
  calculateDebtPayoff,
  fromCents,
  strategyLabel,
  type DebtPayoffStrategyId,
} from "@/lib/utils/debt-payoff";

const PAGE_PATH = "/finance/debt-payoff-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Debt Payoff Calculator - Snowball & Avalanche";
const PAGE_DESCRIPTION =
  "Compare debt snowball, avalanche, selected order, and minimums-only plans. See months to debt-free, interest totals, and a schedule — not financial advice.";

function plainAmount(cents: number): string {
  return fromCents(cents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const singlePayoff = calculateDebtPayoff({
  debts: [
    {
      id: "single",
      name: "Single",
      balance: 1000,
      aprPercent: 12,
      minimumPayment: 100,
    },
  ],
  monthlyBudget: 100,
});

const zeroPayoff = calculateDebtPayoff({
  debts: [
    {
      id: "zero",
      name: "Zero",
      balance: 600,
      aprPercent: 0,
      minimumPayment: 100,
    },
  ],
  monthlyBudget: 100,
});

const pairPayoff = calculateDebtPayoff({
  debts: [
    { id: "A", name: "A", balance: 500, aprPercent: 6, minimumPayment: 25 },
    { id: "B", name: "B", balance: 3000, aprPercent: 24, minimumPayment: 75 },
  ],
  monthlyBudget: 300,
  selectedOrderIds: ["A", "B"],
});

if (!singlePayoff.ok || !zeroPayoff.ok || !pairPayoff.ok) {
  throw new Error("Debt payoff reference examples failed to calculate.");
}

const singlePlan = singlePayoff.strategies.minimums;
const zeroPlan = zeroPayoff.strategies.minimums;
const singleFinal = singlePlan.schedule[singlePlan.schedule.length - 1];
const zeroFinal = zeroPlan.schedule[zeroPlan.schedule.length - 1];

function pairMonthDebt(strategy: DebtPayoffStrategyId, debtId: string) {
  const row = pairPayoff.strategies[strategy].schedule[0]?.debts.find(
    (debt) => debt.debtId === debtId,
  );
  if (!row) {
    throw new Error(`Missing month-1 row for ${strategy} ${debtId}.`);
  }
  return row;
}

const snowA = pairMonthDebt("snowball", "A");
const snowB = pairMonthDebt("snowball", "B");
const avalancheA = pairMonthDebt("avalanche", "A");
const avalancheB = pairMonthDebt("avalanche", "B");

const SUMMARY_ROWS = [
  {
    key: "single",
    scenario: "1,000 at 12%, minimum 100, total 100",
    months: String(singlePlan.months),
    interest: plainAmount(singlePlan.totalInterestCents),
    paid: plainAmount(singlePlan.totalPaidCents),
    finalPayment: singleFinal
      ? plainAmount(singleFinal.totalPaymentCents)
      : "—",
  },
  {
    key: "zero",
    scenario: "600 at 0%, minimum 100, total 100",
    months: String(zeroPlan.months),
    interest: plainAmount(zeroPlan.totalInterestCents),
    paid: plainAmount(zeroPlan.totalPaidCents),
    finalPayment: zeroFinal ? plainAmount(zeroFinal.totalPaymentCents) : "—",
  },
];

const PAIR_STRATEGY_IDS: DebtPayoffStrategyId[] = [
  "minimums",
  "snowball",
  "avalanche",
  "selected",
];

const PAIR_ROWS = PAIR_STRATEGY_IDS.map((id) => {
  const plan = pairPayoff.strategies[id];
  return {
    key: id,
    strategy: strategyLabel(id),
    months: plan.paidOff ? String(plan.months) : "Not within 100 years",
    interest: plan.paidOff ? plainAmount(plan.totalInterestCents) : "—",
    paid: plan.paidOff ? plainAmount(plan.totalPaidCents) : "—",
  };
});

const MONTH1_ROWS = (["snowball", "avalanche"] as const).flatMap((id) =>
  [pairMonthDebt(id, "A"), pairMonthDebt(id, "B")].map((debt) => ({
    key: `${id}-${debt.debtId}`,
    strategy: strategyLabel(id),
    debt: debt.debtId,
    interest: plainAmount(debt.interestCents),
    payment: plainAmount(debt.paymentCents),
    balance: plainAmount(debt.balanceAfterCents),
  })),
);

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
      "No. This page compares payoff order across several existing debts. For one loan’s monthly payment, use the Loan Calculator.",
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
            For one loan’s monthly payment, use the{" "}
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
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                List each debt with its balance, annual percentage rate (APR)
                and minimum payment, then enter the total you can put toward all
                debt payments each month. That total must be at least the sum of
                the minimums. Every strategy first covers those minimums; what
                remains is the “extra.” Names are optional.
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
                amount is 300. Interest that month is {plainAmount(snowA.interestCents)} on
                A and {plainAmount(snowB.interestCents)} on B. Under snowball, A receives{" "}
                {plainAmount(snowA.paymentCents)} (balance {plainAmount(snowA.balanceAfterCents)})
                and B receives {plainAmount(snowB.paymentCents)} (balance{" "}
                {plainAmount(snowB.balanceAfterCents)}). Under avalanche, B receives{" "}
                {plainAmount(avalancheB.paymentCents)} (balance{" "}
                {plainAmount(avalancheB.balanceAfterCents)}) and A receives{" "}
                {plainAmount(avalancheA.paymentCents)} (balance{" "}
                {plainAmount(avalancheA.balanceAfterCents)}).
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
                Why the first months can move slowly.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Each simulated month adds interest with half-up rounding in
                cents, then applies payments. On a large or high-rate balance, a
                minimum may cover little more than that month’s interest, so the
                principal moves slowly at first. Extra above the minimums is
                what shortens the timeline. A one-debt check from the same
                function: 1,000 at 12% with a 100 payment takes {singlePlan.months}{" "}
                months, interest is {plainAmount(singlePlan.totalInterestCents)}, and the
                last payment is{" "}
                {singleFinal ? plainAmount(singleFinal.totalPaymentCents) : "—"}.
              </p>
              <p>
                If a minimum does not cover a debt’s monthly interest and you
                have no extra in the total, the balance cannot fall in this
                model — the tool states that clearly. Raising the total monthly
                amount (or the minimum on that debt) is how the simulation can
                progress. A 0% balance of 600 with 100 per month clears in{" "}
                {zeroPlan.months} months with {plainAmount(zeroPlan.totalInterestCents)}{" "}
                interest in this model.
              </p>
              <p>
                Rolling means the monthly total stays fixed after a debt is
                cleared under snowball, avalanche or selected order. The payment
                that used to satisfy that debt’s minimum becomes additional
                principal for the next target. Minimums-only does not do that
                roll — when a debt ends, that minimum simply stops.
              </p>
              <p>
                Choosing a strategy is personal. If seeing a balance reach zero
                helps you stay consistent, snowball or your own order may fit.
                If the interest total matters most, compare avalanche in the
                table. Those difference lines are for comparison. They are not
                instructions about what you must do.
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
                A monthly model for comparison, not a lender statement.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The calculator does not model variable rates, new purchases on a
                card, fees, promotional rates, or differences in how lenders
                calculate interest. Real statements can diverge from these
                estimates. Runs stop at 1,200 months; if balances remain, the
                result says the debts are not paid off within 100 years at that
                payment.
              </p>
              <p>
                It also does not price a new loan — use the{" "}
                <Link
                  href="/finance/loan-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Loan Calculator
                </Link>{" "}
                for a single payment estimate. Growth of savings is covered by the{" "}
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
                . A monthly split of after-tax income is on the{" "}
                <Link
                  href="/finance/budget-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Budget Calculator
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

          <section aria-labelledby="mistakes-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="mistakes-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Mistakes
              </h2>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                An APR of 0.12 is 0.12 percent, not 12 percent. A blank APR is
                treated as zero. A row with no balance is skipped, so a
                half-finished line does not change the result. If the total
                monthly amount is under the sum of the minimums, the page shows
                a calm message and no schedule.
              </p>
              <p>
                Minimums-only does not roll a cleared payment forward. Snowball,
                avalanche and selected order keep the same total and send that
                amount to the next debt. A gap versus a statement often comes
                from a fee, a rate that changed, or a lender method this monthly
                model does not use.
              </p>
            </div>
          </section>

          <section aria-labelledby="reference-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="reference-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Reference Figures
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Rows below come from the same payoff function as the form, at
                build time. They are checks, not a suggested payment.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  One-debt examples from the payoff function
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Example
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Months
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Interest
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Total paid
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Final payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMARY_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium text-foreground"
                      >
                        {row.scenario}
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.months}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.interest}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.paid}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.finalPayment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Month 1 for debt A and debt B under snowball and avalanche
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Strategy
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Debt
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Interest
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Payment
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Balance after
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH1_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium text-foreground"
                      >
                        {row.strategy}
                      </th>
                      <td className="px-4 py-2.5 text-zinc-700">{row.debt}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.interest}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.payment}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.balance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Full run for debts A and B with a total monthly amount of 300
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Strategy for A and B
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Months
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Interest
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Total paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PAIR_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium text-foreground"
                      >
                        {row.strategy}
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.months}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.interest}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.paid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                A single loan payment, growth estimates, a savings timeline, and a monthly budget.
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
                  Monthly payment for a single loan
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
              <Link
                href="/finance/budget-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Budget Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly 50/30/20 split, custom percentages, or your own list
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
