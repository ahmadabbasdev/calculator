import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ClipboardList } from "lucide-react";
import { BudgetCalculator } from "@/components/calculators/BudgetCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/budget-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Budget Calculator - Monthly 50/30/20 Planner";
const PAGE_DESCRIPTION =
  "Plan a monthly budget with the 50/30/20 rule, custom percentages, or your own expense list. See leftovers and a calm comparison — not financial advice.";

export const FAQ_ITEMS = [
  {
    question: "How does the 50/30/20 budget calculator work?",
    answer:
      "Enter your monthly after-tax income and choose the 50/30/20 rule. Needs are 50%, wants 30%, and savings and debt repayment 20%. Example: 3,000 → 1,500 needs, 900 wants, 600 savings. It is a widely used rule of thumb, not a requirement.",
  },
  {
    question: "Can I use custom percentages instead of 50/30/20?",
    answer:
      "Yes. Choose Custom percentages and enter three values that total 100%. Example: 60/20/20 on 2,500 → 1,500, 500 and 500. If the three percentages do not total 100%, the tool shows a calm message and no result.",
  },
  {
    question: "What is the difference between needs and wants?",
    answer:
      "Needs are usually costs you treat as essential for housing, food, transport, insurance and required debt payments. Wants cover discretionary spending such as eating out or entertainment. People sort the same line differently depending on location, household and values — this tool does not judge the labels you choose.",
  },
  {
    question: "How do I list my own expenses?",
    answer:
      "Choose My own numbers. Each group starts with example labels and empty amounts. Edit labels, enter monthly amounts, and add or remove rows (up to 25 per group). The result shows totals, each group’s share of income, leftover or over-by amounts, and a neutral comparison with 50/30/20 amounts.",
  },
  {
    question: "How should I budget with irregular income?",
    answer:
      "This calculator uses one monthly after-tax income figure. If income varies, many people plan from a lower typical month and treat higher months separately. Irregular pay and one-off costs are not modelled automatically here.",
  },
  {
    question: "Is this the same as a savings goal or loan calculator?",
    answer:
      "No. This page only splits or lists a monthly budget. For how long a savings target may take, use the Savings Goal Calculator. For loan payments use the Loan Calculator. For percent-of math use the Percentage Calculator.",
  },
  {
    question: "Does this give personal financial advice?",
    answer:
      "No. Results are general information for planning and comparison. Costs and priorities differ by country, city and household. Check trusted consumer-finance guidance or a qualified adviser for decisions about your situation.",
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
  name: "Budget Calculator",
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
      name: "Budget Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function BudgetCalculatorPage() {
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
            { label: "Budget Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <ClipboardList className="size-4.5" aria-hidden="true" />
            Monthly budget planner — 50/30/20, custom, or your list
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Budget Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Build a monthly budget from after-tax income using the 50/30/20
            rule of thumb, custom percentages, or your own expense rows. Results
            stay in your browser.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For a savings timeline, use the{" "}
            <Link
              href="/finance/savings-goal-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Savings Goal Calculator
            </Link>
            . This page does not cover loans, salary conversion or investments.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <BudgetCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-budget-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-budget-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Build a Monthly Budget
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A simple sequence you can repeat each month.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Start with monthly after-tax income — the amount that reaches
                your accounts after tax and similar deductions. Write down or
                estimate where that money goes for a typical month. Group costs
                in a way that makes sense for your household, then compare the
                total with income to see what is left over or by how much the
                month runs over. Repeating the same steps each month makes
                patterns easier to spot than relying on memory alone.
              </p>
              <p>
                One common path is to choose a percentage split first, then
                refine with real bills. Another is to list expenses first and
                only afterward look at how those totals compare with a simple
                share of income. Either order works; the calculator supports
                both. Currency here is for display only — the math uses the
                numbers you type.
              </p>
              <p>
                Worked 50/30/20 example: income 3,000. Needs 50% → 1,500. Wants
                30% → 900. Savings and debt repayment 20% → 600. The calculator
                shows those amounts with a one-line worked step such as “3,000 ×
                50% = 1,500”. You can instead enter custom shares (for example
                60/20/20 on 2,500 → 1,500, 500, 500) or type your own line items
                under each group.
              </p>
              <p>
                Costs and priorities differ by country, city and household. A
                transit pass may feel essential in one city and optional in
                another. Shared housing, childcare, medical costs and local
                prices all change what a “typical” month looks like. The tool
                stays neutral: it reports numbers and differences, without
                telling you what to cut or what you should do.
              </p>
            </div>
          </section>

          <section aria-labelledby="needs-wants-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="needs-wants-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Sorting Needs, Wants and Savings
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Labels help comparison — they are not a moral ranking.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Needs often include housing, utilities, groceries, transport,
                insurance and minimum debt payments. Wants often include eating
                out, entertainment, subscriptions, shopping and travel. Savings
                and extra debt payments sit in the third group. Two people can
                place the same expense in different groups and both be
                consistent with how they live — for example a phone plan may be
                treated as a need for work and as a want for a second line.
              </p>
              <p>
                People sort expenses differently because local costs, household
                size and personal values differ. There is no single correct map.
                Use the labels that help you compare this month with the next.
                The 50/30/20 rule is a widely used rule of thumb for that
                comparison, not a requirement.
              </p>
              <p>
                Percentage rules give a quick split of income when you want a
                starting picture. Listing every expense shows what you already
                spend and where leftovers or shortfalls come from. In My own
                numbers mode, empty example labels are starting points — edit
                them, add rows, or remove rows (up to 25 per group). The stacked
                bar and text list describe the same groups so the picture is not
                colour alone.
              </p>
            </div>
          </section>

          <section aria-labelledby="irregular-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="irregular-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Irregular Income and Limits
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                What a single monthly figure can and cannot capture.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                If income changes from month to month, planning from a lower
                typical month can keep essential costs covered when a quieter
                month arrives. Higher months can be reviewed separately — for
                example by updating the income field and noting what changed.
                Freelancers, seasonal workers and people with variable hours
                often treat a buffer month as the planning base rather than the
                best month of the year.
              </p>
              <p>
                This calculator takes one income figure at a time. It does not
                model seasonal swings, bonuses, tax refunds or one-off bills
                automatically. Annual costs (insurance renewals, school fees,
                holidays) are easier to include if you convert them to a monthly
                average before you enter them, but the tool does not do that
                conversion for you.
              </p>
              <p>
                It also does not set savings goals over time, estimate loan
                payments, convert salary periods, or recommend products, banks
                or apps. For a savings timeline see the{" "}
                <Link
                  href="/finance/savings-goal-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Savings Goal Calculator
                </Link>
                ; for pay periods see the{" "}
                <Link
                  href="/finance/salary-to-hourly-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Salary to Hourly Calculator
                </Link>
                ; for loan payments see the{" "}
                <Link
                  href="/finance/loan-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Loan Calculator
                </Link>
                ; for general percent math see the{" "}
                <Link
                  href="/math/percentage-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Percentage Calculator
                </Link>
                . Inputs stay in your browser and are not placed in the URL,
                storage, cookies, analytics or logs.
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
                50/30/20, custom shares, own expenses and related tools.
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
              Consumer budgeting overview:{" "}
              <a
                href="https://www.consumerfinance.gov/archive/blog/budgeting-how-to-create-a-budget-and-stick-with-it/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CFPB — Budgeting: How to create a budget and stick with it
              </a>
              . Free budget planner guidance:{" "}
              <a
                href="https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                MoneyHelper — Budget planner
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
                Savings timelines, pay conversion, loans and percent math.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                href="/finance/salary-to-hourly-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Salary to Hourly Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert salary, hourly wage, and other pay periods
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
                  Monthly payment (EMI) and amortization
                </span>
              </Link>
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, change, and more
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
