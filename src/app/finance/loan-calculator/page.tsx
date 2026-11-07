import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, DollarSign } from "lucide-react";
import { LoanCalculator } from "@/components/calculators/LoanCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/loan-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Loan Calculator - Monthly Payment & Amortization Schedule";
const PAGE_DESCRIPTION =
  "Free loan calculator for monthly payment (EMI), total interest, payoff date, amortization schedule and extra payments. Estimates run in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate my monthly loan payment?",
    answer:
      "For a fixed-rate reducing-balance loan, the monthly payment depends on the loan amount, the annual interest rate, and the number of months. This loan calculator uses the standard EMI formula and shows the payment live as you change the inputs.",
  },
  {
    question: "How is EMI calculated?",
    answer:
      "EMI (equated monthly installment) on a reducing-balance loan equals P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the principal, r is the monthly rate, and n is the number of months. If the rate is zero, EMI is simply the principal divided by n.",
  },
  {
    question: "What is an amortization schedule?",
    answer:
      "An amortization schedule lists each payment and splits it into principal and interest, with the remaining balance after that payment. Early payments are usually mostly interest; later payments are mostly principal.",
  },
  {
    question: "What is the difference between a flat rate and a reducing balance rate?",
    answer:
      "A reducing-balance rate charges interest on the remaining principal each month. A flat rate charges interest on the original amount for the whole term, then divides principal plus that interest into equal payments. Flat-rate quotes can look lower than they are; the equivalent reducing-balance rate is often higher.",
  },
  {
    question: "How do extra payments affect my loan?",
    answer:
      "Extra amounts applied to principal can shorten the schedule and reduce total interest. Some lenders charge prepayment fees, so check your loan terms before paying ahead.",
  },
  {
    question: "Is the interest rate here the same as APR?",
    answer:
      "No. This calculator uses the stated annual interest rate with monthly compounding. APR can include fees and other costs, so a lender’s APR may be higher than the interest rate alone.",
  },
  {
    question: "Why is most of my early payment interest?",
    answer:
      "At the start of an amortizing loan the balance is highest, so the interest portion of each payment is largest. As the balance falls, more of each payment goes to principal.",
  },
  {
    question: "Will my lender's numbers match this calculator?",
    answer:
      "They may differ slightly because of rounding, fees, payment timing, and day-count conventions. Treat these figures as estimates and confirm the schedule with your lender.",
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
  name: "Loan Calculator",
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
      name: "Loan Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function LoanCalculatorPage() {
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
            { label: "Loan Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <DollarSign className="size-4.5" aria-hidden="true" />
            Monthly payment, EMI &amp; amortization
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loan Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate a fixed-rate monthly payment (EMI), total interest, payoff
            date, and an amortization schedule. The same math applies to a
            personal loan, car loan, or other installment loan. Optionally model
            extra payments — in your browser.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <LoanCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Loan Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A short path from loan terms to a payment and schedule.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose reducing balance (standard EMI) or flat rate, then enter
                the loan amount and a display currency.
              </li>
              <li>
                Enter the annual interest rate and term in years and months
                (payments are monthly only).
              </li>
              <li>
                Optionally set a first payment date and an extra monthly amount
                to see months and interest saved.
              </li>
              <li>
                Read the monthly payment, summary totals, chart, and yearly
                amortization table. Expand a year for monthly rows.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Your Monthly Payment Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The reducing-balance EMI formula with a fixed worked example.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                With monthly rate r = annual rate ÷ 12 ÷ 100 and n months, the
                payment is P × r × (1 + r)^n ÷ ((1 + r)^n − 1). If the rate is
                zero, the payment is simply P ÷ n. That is the same EMI
                calculation formula used for many personal loan and car loan
                payment estimates when the rate is fixed and installments are
                monthly.
              </p>
              <p>
                Example: 100,000 at 6% for 30 years (360 months) has r = 0.005
                and a monthly payment of about 599.55. Early payments are mostly
                interest; later payments are mostly principal. This loan payment
                calculator assumes a fixed rate and equal monthly installments —
                not a variable rate or irregular payment plan.
              </p>
            </div>
          </section>

          <section aria-labelledby="amortization-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="amortization-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Is an Amortization Schedule?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A payment-by-payment map of principal, interest, and balance.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                An amortization schedule shows how each installment is split and
                how the balance falls over time. A loan amortization schedule is
                useful when you want to see the payoff path, not only the
                monthly payment. The yearly view summarizes principal and
                interest per year; expanding a year shows each month. The same
                structure applies to a personal loan calculator, car loan
                calculator, or auto loan calculator scenario — the math is the
                same for any fixed-rate installment loan.
              </p>
            </div>
          </section>

          <section aria-labelledby="flat-vs-reducing-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="flat-vs-reducing-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Reducing Balance vs. Flat Rate
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two ways lenders may quote interest — they are not the same.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Reducing balance (standard EMI) recalculates interest on the
                remaining principal each month. Flat rate multiplies the
                original amount by the annual rate and the term in years, then
                divides principal plus that interest into equal payments.
                Flat-rate quotes can look lower than a comparable reducing rate
                because interest is charged on the full original amount; the
                estimated equivalent reducing-balance rate is usually higher.
              </p>
            </div>
          </section>

          <section aria-labelledby="extra-payments-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="extra-payments-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Extra Payments Can Reduce Interest
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Paying additional principal can shorten the term.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Extra monthly amounts applied to principal can cut the number of
                payments and the total interest compared with the baseline
                schedule. An extra payment calculator view (or pay off loan early
                calculator scenario) compares months saved and interest saved
                against the same loan with no extras. Some lenders charge
                prepayment fees or limit how extras are applied — check the loan
                terms before relying on an early-payoff plan.
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
                Honest limits of a payment estimate.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Fees, taxes, insurance, variable rates, and lender-specific
                rounding are not included. A lender’s figures may differ
                slightly. For a mortgage, property tax and insurance are often
                added to the monthly amount you send the servicer.
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
                EMI formulas, amortization, flat vs reducing rates, and extras.
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
              Amortization in plain language:{" "}
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-771/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — What is amortization?
              </a>
              . Interest rate vs APR:{" "}
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — Interest rate and APR
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and estimates only.
              It is not financial advice or a loan offer. Check the terms with
              your lender or a qualified financial adviser.
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
                Growth estimates, savings plans, percent math, and calendar
                shifts.
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
                  Future value, contributions, and APY
                </span>
              </Link>
              <Link
                href="/finance/savings-goal-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Savings Goal Calculator
                </span>
                <span className="text-sm text-muted">
                  How much to save each month, or how long a goal takes
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
                href="/finance/vat-gst-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  VAT, GST &amp; Sales Tax Calculator
                </span>
                <span className="text-sm text-muted">
                  Add or remove VAT/GST, or find the tax rate
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
