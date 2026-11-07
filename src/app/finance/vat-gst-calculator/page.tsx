import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";
import { VatGstCalculator } from "@/components/calculators/VatGstCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/vat-gst-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "VAT, GST & Sales Tax Calculator";
const PAGE_DESCRIPTION =
  "Add or remove VAT, GST or sales tax from a price, or find the tax rate. Inclusive and exclusive prices with a clear worked step — not income tax advice.";

export const FAQ_ITEMS = [
  {
    question: "How do I add VAT or GST to a price?",
    answer:
      "Choose Add tax, enter the net (tax-exclusive) price and the tax rate as a percent. Tax = net × rate; gross = net + tax. Example: 1,000 at 18% → tax 180 and gross 1,180.",
  },
  {
    question: "How do I remove VAT from an inclusive price?",
    answer:
      "Choose Remove tax and enter the gross (tax-inclusive) price and the rate. Net = gross ÷ (1 + rate); tax = gross − net. Example: 1,180 at 18% → net 1,000 and tax 180. Do not multiply gross by (1 − rate).",
  },
  {
    question: "Why is gross × (1 − rate) the wrong way to remove tax?",
    answer:
      "That formula subtracts a percentage of the gross as if the rate applied to the inclusive amount. VAT/GST is usually a percentage of the net. On 120 with 20% tax, gross × (1 − 0.20) = 96, but the correct net is 120 ÷ 1.20 = 100.",
  },
  {
    question: "What is the difference between VAT, GST and sales tax?",
    answer:
      "In general terms, VAT and GST are usually charged at each stage of the supply chain with credits for tax already paid, while retail sales tax is often charged only at the final sale to the consumer. Names, rates and rules differ by country — this tool only applies the rate you enter.",
  },
  {
    question: "How do I find the tax rate from two prices?",
    answer:
      "Choose Find the tax rate, then enter the net and gross amounts. Rate = (gross ÷ net − 1) × 100. Example: net 250 and gross 287.50 → 15%.",
  },
  {
    question: "Can I split tax into CGST and SGST?",
    answer:
      "Yes. Turn on “Split the tax into two equal parts.” The two parts are rounded in minor units so they add up exactly to the total tax (for example 90 + 90 for 180, or parts that sum to 0.05).",
  },
  {
    question: "Does this calculator handle income tax, discounts or tips?",
    answer:
      "No. Use the Percentage Calculator for general percent-of and percent-change math, including discounts. This page only adds tax, removes tax, or finds a single rate from net and gross prices.",
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
  name: "VAT, GST & Sales Tax Calculator",
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
      name: "VAT, GST & Sales Tax Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function VatGstCalculatorPage() {
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
            { label: "VAT, GST & Sales Tax Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Receipt className="size-4.5" aria-hidden="true" />
            Add tax, remove tax, or find the rate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            VAT, GST &amp; Sales Tax Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Add VAT, GST or sales tax to a net price, remove tax from a
            tax-inclusive amount, or find the rate from net and gross. Currency
            is for display only — enter the rate that applies to you.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For discounts, tips or general percent-of math, use the{" "}
            <Link
              href="/math/percentage-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Percentage Calculator
            </Link>
            . This page is not an income-tax tool.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <VatGstCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-add-remove-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-add-remove-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Adding and Removing Tax
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two directions, one rate — with amounts rounded to the nearest
                cent (half up).
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                <strong className="font-semibold text-foreground">
                  Add tax:
                </strong>{" "}
                tax = net × rate, and gross = net + tax. Worked example: net
                1,000 at 18% → tax 180.00 and gross 1,180.00. Another check: net
                99.99 at 5% → tax 5.00 (4.9995 rounds half up) and gross 104.99.
                A 0% rate leaves tax at 0 and gross equal to net.
              </p>
              <p>
                <strong className="font-semibold text-foreground">
                  Remove tax:
                </strong>{" "}
                net = gross ÷ (1 + rate), and tax = gross − net. Worked example:
                gross 1,180 at 18% → net 1,000.00 and tax 180.00. Gross 120 at
                20% → net 100.00; gross 107.50 at 7.5% → net 100.00. Removing
                then adding the same rate returns the original gross within a
                cent for these examples.
              </p>
              <p>
                Optional split divides the tax into two equal parts (for example
                CGST and SGST). Parts are computed in minor units so 180.00
                becomes 90.00 + 90.00, and 0.05 still sums to 0.05 after
                rounding. The currency selector only changes how amounts are
                labelled — it does not convert between currencies.
              </p>
            </div>
          </section>

          <section aria-labelledby="wrong-remove-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="wrong-remove-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why Subtracting the Percentage Is Wrong
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A common shortcut understates the net when tax is inclusive.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                People sometimes compute “remove 20%” as gross × (1 − 0.20). On a
                tax-inclusive 120 that gives 96. The correct reverse of a 20%
                add-on is 120 ÷ 1.20 = 100, with tax 20. The wrong method treats
                the rate as a share of the gross; VAT/GST math treats it as a
                share of the net that was built into the gross.
              </p>
              <p>
                Tax-exclusive prices show the net and add tax at checkout.
                Tax-inclusive prices already embed the tax; you need the
                division method to recover the net. The Find the tax rate mode
                uses rate = (gross ÷ net − 1) × 100 — for example net 250 and
                gross 287.50 → 15%.
              </p>
            </div>
          </section>

          <section aria-labelledby="vat-gst-sales-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="vat-gst-sales-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                VAT, GST and Sales Tax in Brief
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Neutral labels for the same arithmetic — rules still differ by
                country.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Value-added tax (VAT) and goods and services tax (GST) are
                typically charged at each stage of the supply chain, often with
                credits for tax already paid on inputs. Retail sales tax is more
                often charged at the final sale to the consumer. Labels and
                registration rules still differ widely; two countries can use
                the same word “GST” with different rate tables.
              </p>
              <p>
                This calculator does not encode country schedules: enter the
                percent that applies to your product and date. Quick chips for
                5%, 10%, 15% and 20% are shortcuts only — not recommendations.
                Common mistakes include using the wrong base (net versus gross),
                rounding every line item differently from the invoice total, and
                applying one rate when an invoice mixes several. For general
                percentage increase or decrease outside tax, use the{" "}
                <Link
                  href="/math/percentage-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Percentage Calculator
                </Link>
                .
              </p>
            </div>
          </section>

          <section aria-labelledby="not-covered-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="not-covered-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Cover
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Keep filings and invoices aligned with your tax authority.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Multiple tax rates on one invoice</li>
              <li>Exemptions and zero-rated goods</li>
              <li>Reverse-charge mechanisms</li>
              <li>Local rounding rules that differ from half-up to the cent</li>
              <li>Registration thresholds and filing calendars</li>
              <li>Income tax, payroll tax, discounts or tipping</li>
            </ul>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              Related planning tools:{" "}
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Salary to Hourly Calculator
              </Link>{" "}
              and{" "}
              <Link
                href="/finance/loan-calculator"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Loan Calculator
              </Link>
              .
            </p>
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
                Inclusive prices, reverse VAT and when to use another tool.
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
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              This calculator provides general information only. It is not tax
              advice. Check your tax authority’s rules for rates, exemptions,
              rounding and filing. Inputs stay in your browser and are not sent
              to our servers.
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
                Percent math, pay conversion, and loan payments.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, change, and discounts
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
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
