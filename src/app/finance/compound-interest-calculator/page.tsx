import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Percent } from "lucide-react";
import { CompoundInterestCalculator } from "@/components/calculators/CompoundInterestCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/compound-interest-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Compound Interest Calculator - Daily, Monthly & Yearly";
const PAGE_DESCRIPTION =
  "Free compound interest calculator with monthly contributions, compounding frequency, APY and optional inflation. Future-value estimates in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate compound interest?",
    answer:
      "Choose an assumed annual rate and compounding frequency, then apply A = P(1 + r/n)^(nt) for a lump sum, or add regular contributions month by month. This compound interest calculator runs that simulation live as you change the inputs.",
  },
  {
    question: "What is the compound interest formula?",
    answer:
      "The basic compound interest formula is A = P(1 + r/n)^(nt), where A is the future value, P is the starting principal, r is the annual rate as a decimal, n is how many times interest compounds per year, and t is time in years. Regular contributions add a separate month-by-month term.",
  },
  {
    question: "What is the difference between simple and compound interest?",
    answer:
      "Simple interest is earned only on the original principal. Compound interest is earned on the principal plus interest already credited, so the balance can grow faster over the same rate and time.",
  },
  {
    question: "Does compounding more often make a big difference?",
    answer:
      "Daily or monthly compounding usually produces a slightly higher effective annual yield than yearly compounding at the same nominal rate. The gap is often small compared with the effect of the rate you assume and how long the money stays invested.",
  },
  {
    question: "What is APY, and how is it different from the interest rate?",
    answer:
      "The interest rate is the nominal annual rate you enter. APY (effective annual yield) folds in compounding: APY = (1 + r/n)^n − 1. Comparing APYs is a clearer way to compare how often interest is credited.",
  },
  {
    question: "How does the rule of 72 work?",
    answer:
      "The rule of 72 is a quick approximation: divide 72 by the annual percentage return to estimate years to double. This page also shows a more precise estimate using ln(2) ÷ ln(1 + APY), still ignoring contributions.",
  },
  {
    question: "Does this calculator guarantee these returns?",
    answer:
      "No. The rate is an assumption you choose. Real investment returns vary, are not constant, and can be negative. Treat the future value as an illustration, not a prediction or promise.",
  },
  {
    question:
      "Why does the future value change when contributions are made at the start of the period?",
    answer:
      "Contributions at the beginning of each period start earning interest sooner than contributions at the end. Over many periods that timing difference adds up, so the same contribution amount produces a higher ending balance when paid at the start.",
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
  name: "Compound Interest Calculator",
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
      name: "Compound Interest Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function CompoundInterestCalculatorPage() {
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
            { label: "Compound Interest Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Percent className="size-4.5" aria-hidden="true" />
            Future value, APY &amp; contributions
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Compound Interest Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate future value with daily, monthly, or yearly compounding,
            optional monthly contributions, effective annual yield (APY), and
            an inflation view — in your browser. For how much to save
            each month to hit a target, use the{" "}
            <Link
              href="/finance/savings-goal-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Savings Goal Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <CompoundInterestCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Compound Interest Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                From starting balance to a future-value estimate.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Enter an initial amount (it can be zero) and optional
                contributions with a frequency and timing.
              </li>
              <li>
                Choose an assumed annual interest rate and how often interest
                is compounded (daily, monthly, quarterly, or yearly).
              </li>
              <li>
                Set the time in years and months. Optionally add a yearly
                contribution increase or an inflation rate under More options.
              </li>
              <li>
                Read the future value, deposits vs interest, APY, chart, and
                yearly breakdown. Results update as you type — no submit
                button.
              </li>
            </ol>
          </section>

          <section aria-labelledby="formula-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="formula-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Compound Interest Formula
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                How to calculate compound interest for a lump sum, then
                contributions.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The standard compound interest formula is A = P(1 + r/n)^(nt).
                A is the future value, P is the principal, r is the annual rate
                as a decimal, n is the number of compounding periods per year,
                and t is time in years. Example: 10,000 at 5% compounded
                annually for 10 years is 10,000 × (1.05)^10 ≈ 16,288.95. The
                same amount compounded monthly is about 16,470.09.
              </p>
              <p>
                When you add regular contributions, there is no single short
                formula that covers every frequency and timing mix, so this
                investment growth calculator (a future value calculator with
                deposits) adds each contribution on the months it falls due and
                grows the balance with an equivalent monthly factor derived
                from the nominal rate and compounding frequency.
              </p>
            </div>
          </section>

          <section aria-labelledby="simple-vs-compound-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="simple-vs-compound-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Simple vs. Compound Interest
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Same starting amount and rate — different growth paths.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                With simple interest, 10,000 at 5% for 10 years earns 5,000 of
                interest and ends at 15,000. With compound interest at the same
                5% compounded annually, the same starting amount ends near
                16,288.95 because each year&apos;s interest is added to the
                base that earns later interest. The gap widens as time or the
                compounding frequency increases.
              </p>
            </div>
          </section>

          <section aria-labelledby="frequency-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="frequency-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Compounding Frequency Matters
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Daily vs monthly vs yearly on the same assumed rate.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                A daily compound interest calculator and a monthly compound
                interest calculator use the same nominal rate but different n
                in the formula. For 10,000 at 5% over 10 years with no
                contributions:
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/70">
                <table className="min-w-[20rem] w-full border-collapse text-left text-[14px]">
                  <caption className="sr-only">
                    Future value of 10,000 at 5% for 10 years by compounding
                    frequency
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                      <th scope="col" className="px-3 py-2">
                        Compounded
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Approximate future value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-zinc-800">
                    <tr className="border-b border-border/60">
                      <th scope="row" className="px-3 py-2 font-medium">
                        Annually
                      </th>
                      <td className="px-3 py-2">16,288.95</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <th scope="row" className="px-3 py-2 font-medium">
                        Monthly
                      </th>
                      <td className="px-3 py-2">16,470.09</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-3 py-2 font-medium">
                        Daily (365)
                      </th>
                      <td className="px-3 py-2">16,486.65</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The difference between yearly and daily compounding here is
                under 200 on a 10,000 starting balance. Rate and time usually
                matter more than how often interest is credited.
              </p>
            </div>
          </section>

          <section aria-labelledby="rule-of-72-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="rule-of-72-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Rule of 72
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A quick estimate of how long to double money at a steady rate.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Divide 72 by the assumed annual percentage return to estimate
                doubling time. At 6%, 72 ÷ 6 ≈ 12 years. That rule of 72
                shortcut is an approximation; this page also shows years ≈
                ln(2) ÷ ln(1 + APY), which uses the effective annual yield and
                still ignores contributions. Neither figure is a forecast.
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
                Honest limits of a future-value estimate.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Taxes, account fees, fund charges, and changing rates are not
                modeled. Real investment returns are not constant and can be
                negative. Inflation is only an optional estimate of
                today&apos;s-money purchasing power.                 Asking how much to save
                each month to reach a fixed goal belongs on the Savings Goal
                Calculator rather than this page.
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
                Formula, APY, compounding frequency, and the rule of 72.
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
              Compound interest in plain language:{" "}
              <a
                href="https://www.investor.gov/additional-resources/information/youth/teachers-classroom-resources/what-compound-interest"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Investor.gov (SEC) — What is compound interest?
              </a>
              . Compounding and interest:{" "}
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/how-does-compound-interest-work-en-1683/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — How does compound interest work?
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and illustrative
              estimates only. It is not financial or investment advice, and it
              does not predict future returns. Talk to a qualified financial
              adviser about your own situation.
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
                Savings plans, loan payments, percent math, and calendar shifts.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
