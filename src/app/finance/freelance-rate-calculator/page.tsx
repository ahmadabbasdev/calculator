import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ChevronDown } from "lucide-react";
import { FreelanceRateCalculator } from "@/components/calculators/FreelanceRateCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { FREELANCE_NOTE, hasFreelanceNote } from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/freelance-rate-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Freelance Rate Calculator - Hourly & Day Rate";
const PAGE_DESCRIPTION =
  "Find a freelance hourly rate for your take-home goal, or estimate take-home from a rate. Includes expenses, tax, fees and billable hours — not tax advice.";

export const FAQ_ITEMS = [
  {
    question: "How does the freelance rate calculator work?",
    answer:
      "In Find my rate, enter your desired annual take-home, expenses, an estimated tax rate on profit, weeks off and billable hours per week. The tool works out how much revenue you need and divides by billable hours. Example: 60,000 take-home, 6,000 expenses, 20% tax, 6 weeks off and 25 billable hours → about 70.43 per hour.",
  },
  {
    question: "Why not divide a salary by 2,080 hours?",
    answer:
      "A salaried job often assumes about 40 hours × 52 weeks, but freelancers usually have unpaid time (admin, marketing, learning), unpaid weeks off, business expenses and tax on profit. Dividing a salary by 2,080 undercounts the rate needed to leave the same take-home after those costs.",
  },
  {
    question: "What are billable hours?",
    answer:
      "Billable hours are the hours you can actually invoice. They are usually lower than total working hours because proposals, email, bookkeeping and learning are often unpaid. This calculator uses billable hours per week times weeks worked (52 minus weeks off).",
  },
  {
    question: "How do platform fees and a profit buffer change the rate?",
    answer:
      "A marketplace fee is the share of each sale a platform keeps; the rate rises so take-home still clears after that cut. A profit buffer (Find my rate only) adds extra revenue for slow months and savings. Neither is required — leave them at zero if they do not apply.",
  },
  {
    question: "Can I convert an hourly rate into take-home?",
    answer:
      "Yes. Use What will I take home, enter your hourly rate with the same expenses, tax rate, weeks off and billable hours. Buffer is not used in that mode. If costs exceed revenue, the result shows a loss and zero tax on profit.",
  },
  {
    question: "Is this the same as a salary-to-hourly calculator?",
    answer:
      "No. Salary to Hourly converts pay periods for employed wages. This page models freelance take-home goals, business expenses, estimated tax on profit, platform fees and billable capacity. Use the Salary to Hourly Calculator for employed pay conversions.",
  },
  {
    question: "Does this give tax or pricing advice?",
    answer:
      "No. Results are general estimates for planning. Tax rates and rules vary by country. Market rates, client budgets, experience and demand also matter. Check a qualified adviser for decisions about your situation.",
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
  name: "Freelance Rate Calculator",
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
      name: "Freelance Rate Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function FreelanceRateCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const showNote = hasFreelanceNote();

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
            { label: "Freelance Rate Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Briefcase className="size-4.5" aria-hidden="true" />
            Hourly rate from a take-home goal — or take-home from a rate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Freelance Rate Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Work out a minimum hourly rate that supports your after-tax income
            goal, or see what an existing rate may leave after expenses, tax and
            fees. Numbers stay in your browser.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For employed pay-period conversions, use the{" "}
            <Link
              href="/finance/salary-to-hourly-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Salary to Hourly Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <FreelanceRateCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="why-rate-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="why-rate-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why a Salary ÷ 2,080 Undercounts Freelance Rates
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Billable capacity is smaller than a full-time calendar.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Many people start from a salaried figure and divide by about
                2,080 hours (40 × 52). That skips unpaid weeks, unpaid admin
                time, business expenses and tax on profit. Freelancers invoice
                only billable hours — often closer to 20–30 per week — after
                vacation, holidays and sick days. The gap between calendar hours
                and billable hours is why a “salary ÷ 2,080” figure can look
                affordable on paper and still miss the take-home goal.
              </p>
              <p>
                Worked example: take-home goal 60,000, yearly expenses 6,000,
                tax rate on profit 20%, six weeks off and 25 billable hours per
                week. Weeks worked = 46. Billable hours = 1,150. Revenue needed
                before a buffer or fee = 81,000. Hourly rate ≈ 70.43. With a 20%
                platform fee the revenue target rises to 101,250 (≈ 88.04 per
                hour). With a 10% buffer instead, revenue is 89,100 (≈ 77.48 per
                hour).
              </p>
              <p>
                Another check: 30,000 take-home, no expenses or tax, four weeks
                off and 20 billable hours per week → 960 billable hours and
                31.25 per hour. A 10-hour project at an unrounded 70.4348 rate
                quotes to 704.35 before any revision buffer. You can enter
                expenses as a monthly amount if that matches how you track
                costs; the calculator annualises them.
              </p>
              <p>
                This figure is a minimum rate for your income goal. Market
                rates, client budgets, experience and demand also matter. The
                tool does not say what any freelancer should earn or compare
                countries or platforms.
              </p>
            </div>
          </section>

          <section aria-labelledby="pricing-styles-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="pricing-styles-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Billable Hours, Day Rates and Project Quotes
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                One hourly number can feed several ways of presenting a price.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Billable hours are the hours you invoice. Working hours include
                proposals, meetings, bookkeeping and learning that may not appear
                on an invoice. Using working hours in the denominator usually
                makes the rate look lower than what you need for the same
                take-home. Defaults of six weeks off and 25 billable hours per
                week are starting points — change them to match your calendar.
              </p>
              <p>
                Some clients prefer a day rate (hourly × hours in your typical
                day) or a fixed project price. The project helper multiplies your
                calculated hourly rate by project hours and an optional revision
                buffer. It is a starting quote, not a contract. Annual and
                monthly revenue targets next to the hourly figure show how much
                invoicing the year needs at that capacity.
              </p>
              <p>
                Common mistakes include forgetting unbillable time, ignoring tax
                on profit, omitting software and workspace costs, leaving out
                marketplace fees, and assuming every week of the year is fully
                booked. A profit buffer in Find my rate is one way to leave room
                for slower months; What will I take home does not apply that
                buffer so you can test a rate you already charge.
              </p>
              <p>
                Reverse check: at 80 per hour, 1,150 billable hours, 6,000
                expenses, 20% tax and no fee, annual revenue is 92,000, profit
                86,000 and take-home 68,800. Feeding the no-buffer rate from the
                first example back into this mode returns the original take-home
                goal within a cent.
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
                A planning estimate — not a tax return or pricing policy.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The model does not add VAT or GST on top of invoices, fund
                retirement or health costs as separate line items, spread
                irregular income across months, adjust for currency changes, or
                model late payments. Tax rates and rules vary by country — enter
                a rate that fits your situation; this is not tax advice.
              </p>
              <p>
                For employed wage conversions see the{" "}
                <Link
                  href="/finance/salary-to-hourly-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Salary to Hourly Calculator
                </Link>
                . For percent-of math see the{" "}
                <Link
                  href="/math/percentage-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Percentage Calculator
                </Link>
                . For a monthly spending split see the{" "}
                <Link
                  href="/finance/budget-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Budget Calculator
                </Link>
                . Inputs never go into the URL, storage, cookies, analytics or
                logs.
              </p>
            </div>
          </section>

          {showNote ? (
            <section aria-labelledby="experience-heading">
              <div className="mb-6 max-w-3xl">
                <h2
                  id="experience-heading"
                  className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  From my experience
                </h2>
              </div>
              <div className="max-w-3xl text-[15px] leading-relaxed text-muted">
                <p className="whitespace-pre-line">{FREELANCE_NOTE}</p>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="faq-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Rates, billable hours, fees and limits.
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

          <section aria-labelledby="disclaimer-heading" className="max-w-3xl">
            <h2
              id="disclaimer-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Disclaimer
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and estimates only.
              It is not financial, tax or business advice. Numbers are for
              planning and comparison — not a promise about income or clients.
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
                Employed pay conversion, percent math and monthly budgets.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <Link
                href="/finance/budget-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Budget Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly 50/30/20, custom percentages, or your own list
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
