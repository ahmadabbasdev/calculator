import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";
import { VatGstCalculator } from "@/components/calculators/VatGstCalculator";
import { CalculatorEeAtSections } from "@/components/seo/CalculatorEeAtSections";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { getCalculatorEeAt } from "@/lib/calculator-eeat";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  calculateVatGst,
  splitTaxEvenly,
  type VatGstSuccess,
} from "@/lib/utils/vat-gst";

const PAGE_PATH = "/finance/vat-gst-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const EEAT = getCalculatorEeAt(PAGE_PATH);

const PAGE_TITLE = "VAT, GST & Sales Tax Calculator";
const PAGE_DESCRIPTION =
  "Add or remove VAT, GST or sales tax, or find the rate from a net and a gross price. Inclusive and exclusive amounts with a worked step — not tax advice.";

function plainAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function plainRate(rate: number): string {
  return Number(rate.toFixed(4)).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
}

function exampleResult(input: {
  mode: "add" | "remove" | "find-rate";
  net: number | null;
  gross: number | null;
  ratePercent: number | null;
}): VatGstSuccess {
  const result = calculateVatGst({ ...input, splitTax: false });
  if (!result.ok) {
    throw new Error("VAT reference example failed to calculate.");
  }
  return result;
}

const REFERENCE_ROWS = [
  {
    key: "add-18",
    label: "Add 18% to 1,000",
    result: exampleResult({
      mode: "add",
      net: 1000,
      gross: null,
      ratePercent: 18,
    }),
  },
  {
    key: "remove-18",
    label: "Remove 18% from 1,180",
    result: exampleResult({
      mode: "remove",
      net: null,
      gross: 1180,
      ratePercent: 18,
    }),
  },
  {
    key: "add-5",
    label: "Add 5% to 99.99",
    result: exampleResult({
      mode: "add",
      net: 99.99,
      gross: null,
      ratePercent: 5,
    }),
  },
  {
    key: "remove-5",
    label: "Remove 5% from 104.99",
    result: exampleResult({
      mode: "remove",
      net: null,
      gross: 104.99,
      ratePercent: 5,
    }),
  },
  {
    key: "remove-20",
    label: "Remove 20% from 120",
    result: exampleResult({
      mode: "remove",
      net: null,
      gross: 120,
      ratePercent: 20,
    }),
  },
  {
    key: "remove-7-5",
    label: "Remove 7.5% from 107.50",
    result: exampleResult({
      mode: "remove",
      net: null,
      gross: 107.5,
      ratePercent: 7.5,
    }),
  },
  {
    key: "find-15",
    label: "Net 250 and gross 287.50",
    result: exampleResult({
      mode: "find-rate",
      net: 250,
      gross: 287.5,
      ratePercent: null,
    }),
  },
  {
    key: "zero",
    label: "Add 0% to 1,000",
    result: exampleResult({
      mode: "add",
      net: 1000,
      gross: null,
      ratePercent: 0,
    }),
  },
];

const REMOVE_20 = REFERENCE_ROWS.find((row) => row.key === "remove-20")!.result;
const WRONG_REMOVE_NET = 120 * (1 - 0.2);
const SPLIT_180 = splitTaxEvenly(180);
const SPLIT_005 = splitTaxEvenly(0.05);

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
    question: "When should I use a different calculator?",
    answer:
      "This page only adds tax, removes tax, or finds one rate from a net and a gross price. For other percent-of and percent-change calculations, use the Percentage Calculator.",
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
            For other percent-of math, use the{" "}
            <Link
              href="/math/percentage-calculator"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Percentage Calculator
            </Link>
            .
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
                tax-inclusive 120 that gives {plainAmount(WRONG_REMOVE_NET)}. The
                correct reverse of a 20% add-on is 120 ÷ 1.20 ={" "}
                {plainAmount(REMOVE_20.net)}, with tax {plainAmount(REMOVE_20.tax)}.
                The shortcut treats the rate as a share of the gross. VAT, GST
                and sales-tax math treats it as a share of the net that was built
                into the gross.
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
                This calculator does not store country schedules. Enter the
                percent that applies to your product and date. The chips for 5%,
                10%, 15% and 20% only fill the rate field. They are not a list of
                official rates. For percent math outside a single tax rate, use
                the{" "}
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
            </ul>
            <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Two mistakes change the result before any of those limits apply.
                The first is the wrong base: adding the rate to a price that
                already includes tax, or removing tax with gross × (1 − rate).
                The second is rounding. This page rounds the tax and the net to
                the nearest cent, half up, once for the amounts you type. An
                invoice that rounds each line and then adds those lines can
                differ by a cent from rounding the invoice total once.
              </p>
            </div>
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

          {EEAT ? <CalculatorEeAtSections content={EEAT} /> : null}

          <section aria-labelledby="reference-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="reference-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Reference Figures
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Each row is produced by the same function as the calculator, when
                the page is built. Amounts are in currency units, with no symbol,
                because the selector only changes display.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Add, remove and find-rate examples from the tax function
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Example
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Net
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Tax
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Gross
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium text-foreground"
                      >
                        {row.label}
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.result.net)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.result.tax)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.result.gross)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainRate(row.result.ratePercent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Equal tax splits that add back to the total tax
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Tax
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Part A
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Part B
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Sum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "180", tax: 180, split: SPLIT_180 },
                    { key: "005", tax: 0.05, split: SPLIT_005 },
                  ].map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium tabular-nums text-foreground"
                      >
                        {plainAmount(row.tax)}
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.split.partA)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.split.partB)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.split.partA + row.split.partB)}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number and percent change
                </span>
              </Link>
              <Link
                href="/finance/profit-margin-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Profit Margin Calculator
                </span>
                <span className="text-sm text-muted">
                  Margin, markup, and selling price from cost
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
