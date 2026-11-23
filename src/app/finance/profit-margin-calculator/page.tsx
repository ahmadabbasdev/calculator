import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn, ChevronDown } from "lucide-react";
import { ProfitMarginCalculator } from "@/components/calculators/ProfitMarginCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  calculateProfitMargin,
  marginToMarkup,
  type ProfitMarginSuccess,
} from "@/lib/utils/profit-margin";

const PAGE_PATH = "/finance/profit-margin-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Profit Margin Calculator";
const PAGE_DESCRIPTION =
  "Find profit, margin and markup from cost and price, or solve for selling price and cost. Optional fees and units — arithmetic only, not pricing advice.";

function plainAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function plainPercent(percent: number): string {
  return percent.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function exampleResult(input: {
  mode: ProfitMarginSuccess["mode"];
  cost: number | null;
  price: number | null;
  marginPercent: number | null;
  markupPercent: number | null;
  units?: number | null;
  feePercent?: number | null;
  fixedFee?: number | null;
}): ProfitMarginSuccess {
  const result = calculateProfitMargin({
    mode: input.mode,
    cost: input.cost,
    price: input.price,
    marginPercent: input.marginPercent,
    markupPercent: input.markupPercent,
    units: input.units ?? null,
    feePercent: input.feePercent ?? null,
    fixedFee: input.fixedFee ?? null,
  });
  if (!result.ok) {
    throw new Error("Profit margin reference example failed to calculate.");
  }
  return result;
}

const COST_PRICE = exampleResult({
  mode: "from-cost-price",
  cost: 60,
  price: 100,
  marginPercent: null,
  markupPercent: null,
});

const PRICE_FROM_MARGIN = exampleResult({
  mode: "price-from-margin",
  cost: 80,
  price: null,
  marginPercent: 20,
  markupPercent: null,
});

const PRICE_FROM_MARKUP = exampleResult({
  mode: "price-from-markup",
  cost: 80,
  price: null,
  marginPercent: null,
  markupPercent: 25,
});

const COST_FROM_MARGIN = exampleResult({
  mode: "cost-from-margin",
  cost: null,
  price: 100,
  marginPercent: 30,
  markupPercent: null,
});

const LOSS_EXAMPLE = exampleResult({
  mode: "from-cost-price",
  cost: 120,
  price: 100,
  marginPercent: null,
  markupPercent: null,
});

const UNITS_EXAMPLE = exampleResult({
  mode: "from-cost-price",
  cost: 60,
  price: 100,
  marginPercent: null,
  markupPercent: null,
  units: 250,
});

const FEE_EXAMPLE = exampleResult({
  mode: "from-cost-price",
  cost: 60,
  price: 100,
  marginPercent: null,
  markupPercent: null,
  feePercent: 10,
  fixedFee: 1,
});

const WRONG_ADD_MARGIN_PRICE = 80 * (1 + 0.2);

const MARKUP_TABLE_MARGINS = [10, 20, 25, 30, 40, 50] as const;
const MARGIN_MARKUP_ROWS = MARKUP_TABLE_MARGINS.map((margin) => {
  const converted = marginToMarkup(margin);
  if (!converted.ok) {
    throw new Error(`Margin-to-markup table failed for ${margin}%.`);
  }
  return converted;
});

const REFERENCE_ROWS = [
  {
    key: "cost-price",
    label: "Cost 60, price 100",
    result: COST_PRICE,
  },
  {
    key: "price-margin",
    label: "Cost 80, margin 20%",
    result: PRICE_FROM_MARGIN,
  },
  {
    key: "price-markup",
    label: "Cost 80, markup 25%",
    result: PRICE_FROM_MARKUP,
  },
  {
    key: "cost-margin",
    label: "Price 100, margin 30%",
    result: COST_FROM_MARGIN,
  },
  {
    key: "loss",
    label: "Cost 120, price 100",
    result: LOSS_EXAMPLE,
  },
  {
    key: "fees",
    label: "Price 100, cost 60, 10% + 1.00 fee",
    result: FEE_EXAMPLE,
  },
];

export const FAQ_ITEMS = [
  {
    question: "How do I calculate profit margin from cost and price?",
    answer:
      "Choose From cost and price. Profit = price − cost. Margin % = profit ÷ price × 100. Markup % = profit ÷ cost × 100. Example: cost 60 and price 100 → profit 40, margin 40%, markup 66.67%.",
  },
  {
    question: "How do I find a selling price from a target margin?",
    answer:
      "Choose Price from margin. Price = cost ÷ (1 − margin). Example: cost 80 and margin 20% → price 100. Do not multiply cost by (1 + margin); that is a markup, not a margin.",
  },
  {
    question: "What is the difference between margin and markup?",
    answer:
      "Margin is profit as a share of the selling price. Markup is profit as a share of cost. A 25% markup on cost 80 yields price 100 and a 20% margin. Markup = margin ÷ (1 − margin); margin = markup ÷ (1 + markup).",
  },
  {
    question: "How do marketplace or payment fees change the result?",
    answer:
      "Optional fee percent and fixed fee per sale set net revenue = price × (1 − fee%) − fixed fee, then profit = net revenue − cost. Margin still uses profit ÷ price. Example: price 100, cost 60, 10% fee and 1.00 fixed → net revenue 89, profit 29, margin 29%.",
  },
  {
    question: "Why is a margin of 100% blocked?",
    answer:
      "Price = cost ÷ (1 − margin) and cost = price × (1 − margin) both need a margin below 100%. At 100% the divisor is zero, so the calculator shows a calm message instead of an infinite or undefined price.",
  },
  {
    question: "Can the calculator show a loss?",
    answer:
      "Yes. Negative inputs are blocked, but a price below cost is allowed. Cost 120 and price 100 give profit −20, margin −20% and markup −16.67%.",
  },
  {
    question: "When should I use a different calculator?",
    answer:
      "This page only works with cost, price, margin and markup, plus optional units and fees. For percent-of and percent-change on any number, use the Percentage Calculator.",
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
  name: "Profit Margin Calculator",
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
      name: "Profit Margin Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function ProfitMarginCalculatorPage() {
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
            { label: "Profit Margin Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <ChartColumn className="size-4.5" aria-hidden="true" />
            Margin, markup, and selling price
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Profit Margin Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find profit, margin and markup from cost and price, or solve for a
            selling price or cost. Optional units and marketplace fees stay in
            your browser. Currency is for display only.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For percent-of and percent-change math, use the{" "}
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

        <ProfitMarginCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="margin-vs-markup-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="margin-vs-markup-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Margin Versus Markup
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Same profit, two different bases — and a worked pair that
                matches.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Profit is price minus cost. Margin divides that profit by the
                selling price. Markup divides the same profit by cost. On cost{" "}
                {plainAmount(COST_PRICE.cost)} and price{" "}
                {plainAmount(COST_PRICE.price)}, profit is{" "}
                {plainAmount(COST_PRICE.profit)}, margin is{" "}
                {plainPercent(COST_PRICE.marginPercent)}%, and markup is{" "}
                {plainPercent(COST_PRICE.markupPercent)}%.
              </p>
              <p>
                A target markup of 25% on cost 80 sets price = 80 × 1.25 ={" "}
                {plainAmount(PRICE_FROM_MARKUP.price)}. That sale has profit{" "}
                {plainAmount(PRICE_FROM_MARKUP.profit)} and margin{" "}
                {plainPercent(PRICE_FROM_MARKUP.marginPercent)}%. The reverse
                path — cost 80 with a 20% margin — uses price = 80 ÷ 0.80 ={" "}
                {plainAmount(PRICE_FROM_MARGIN.price)}, which is the same sale
                from the other side. A 25% markup is a 20% margin on these
                figures; the converter uses markup = margin ÷ (1 − margin) and
                margin = markup ÷ (1 + markup).
              </p>
              <p>
                “Cost” here means whatever amount you enter. Gross margin,
                operating margin and net margin each subtract a different set of
                costs in financial statements. This page only applies the
                arithmetic to your numbers.
              </p>
            </div>
          </section>

          <section aria-labelledby="wrong-add-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="wrong-add-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Mistake of Adding a Margin Percentage to Cost
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Adding a margin percent treats it like a markup.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                People sometimes “add a 20% margin” as cost × (1 + 0.20). On cost
                80 that shortcut gives {plainAmount(WRONG_ADD_MARGIN_PRICE)}. The
                correct selling price for a 20% margin is 80 ÷ (1 − 0.20) ={" "}
                {plainAmount(PRICE_FROM_MARGIN.price)}, with profit{" "}
                {plainAmount(PRICE_FROM_MARGIN.profit)} and markup{" "}
                {plainPercent(PRICE_FROM_MARGIN.markupPercent)}%. The shortcut
                built a 20% markup, which is only a{" "}
                {plainPercent(PRICE_FROM_MARKUP.marginPercent)}% margin once you
                divide profit by price.
              </p>
              <p>
                Cost from a known price and margin uses cost = price × (1 −
                margin). Price 100 with a 30% margin gives cost{" "}
                {plainAmount(COST_FROM_MARGIN.cost)}. A margin of 100% or more
                cannot set a finite price or cost, so those modes show a calm
                message instead. A selling price of zero leaves margin undefined.
              </p>
            </div>
          </section>

          <section aria-labelledby="gross-net-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="gross-net-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Gross Versus Net Margin in Plain Terms
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Labels change with which costs sit under the line.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                In accounting, gross margin usually compares revenue to the
                direct cost of goods sold. Operating margin subtracts operating
                expenses as well. Net margin subtracts interest, tax and other
                items that remain after operating profit. The formulas on this
                page do not choose those layers for you — enter the cost that
                matches the question you are asking.
              </p>
              <p>
                A loss is a valid result. Cost {plainAmount(LOSS_EXAMPLE.cost)}{" "}
                and price {plainAmount(LOSS_EXAMPLE.price)} give profit{" "}
                {plainAmount(LOSS_EXAMPLE.profit)}, margin{" "}
                {plainPercent(LOSS_EXAMPLE.marginPercent)}% and markup{" "}
                {plainPercent(LOSS_EXAMPLE.markupPercent)}%. Negative typed
                inputs are blocked; negative profit after a valid cost and price
                is not.
              </p>
            </div>
          </section>

          <section aria-labelledby="marketplace-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="marketplace-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Selling Through a Marketplace With Fees
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Optional percent and fixed fees reduce net revenue before
                profit.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Net revenue = price × (1 − fee%) − fixed fee per sale. Profit =
                net revenue − cost. Margin still divides profit by the listed
                selling price. On price {plainAmount(FEE_EXAMPLE.price)}, cost{" "}
                {plainAmount(FEE_EXAMPLE.cost)}, a 10% fee and a{" "}
                {plainAmount(1)} fixed fee, net revenue is{" "}
                {plainAmount(FEE_EXAMPLE.netRevenue!)} and profit is{" "}
                {plainAmount(FEE_EXAMPLE.profit)}, so margin is{" "}
                {plainPercent(FEE_EXAMPLE.marginPercent)}% and markup is{" "}
                {plainPercent(FEE_EXAMPLE.markupPercent)}%.
              </p>
              <p>
                Optional units multiply the per-unit figures. Two hundred fifty
                units at cost {plainAmount(60)} and price {plainAmount(100)}{" "}
                give revenue {plainAmount(UNITS_EXAMPLE.totalRevenue!)}, total
                cost {plainAmount(UNITS_EXAMPLE.totalCost!)} and total profit{" "}
                {plainAmount(UNITS_EXAMPLE.totalProfit!)}. Amounts round to the
                nearest cent, half up. For tax on a price, use the{" "}
                <Link
                  href="/finance/vat-gst-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  VAT, GST &amp; Sales Tax Calculator
                </Link>
                . For rate planning on freelance work, see the{" "}
                <Link
                  href="/finance/freelance-rate-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Freelance Rate Calculator
                </Link>{" "}
                and{" "}
                <Link
                  href="/finance/salary-to-hourly-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Salary to Hourly Calculator
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
                Keep pricing decisions aligned with your own costs and rules.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Advice on what margin is “good” for an industry</li>
              <li>Tax, VAT or sales-tax schedules</li>
              <li>Multi-product invoices with mixed costs</li>
              <li>Inventory valuation methods or cost accounting systems</li>
              <li>Currency conversion between symbols</li>
            </ul>
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
                Each row is produced by the same functions as the calculator when
                the page is built. Amounts have no currency symbol because the
                selector only changes display.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Profit, margin and markup examples from the calculator
                  function
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Example
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Cost
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Profit
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Margin
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Markup
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
                        {plainAmount(row.result.cost)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.result.price)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainAmount(row.result.profit)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainPercent(row.result.marginPercent)}%
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainPercent(row.result.markupPercent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <caption className="sr-only">
                  Margin to markup conversions from the converter function
                </caption>
                <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Margin
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Markup
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MARGIN_MARKUP_ROWS.map((row) => (
                    <tr
                      key={row.marginPercent}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium tabular-nums text-foreground"
                      >
                        {plainPercent(row.marginPercent)}%
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {plainPercent(row.markupPercent)}%
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
                Margin, markup, fees and when to use another tool.
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
              This calculator provides arithmetic only. It is not pricing advice,
              tax advice or a claim about what margin is appropriate for any
              business. Inputs stay in your browser and are not sent to our
              servers.
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
                Percent math, freelance rates, pay conversion, and sales tax.
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
                href="/finance/freelance-rate-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Freelance Rate Calculator
                </span>
                <span className="text-sm text-muted">
                  Hourly rate from a take-home goal, or take-home from a rate
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
                href="/finance/vat-gst-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  VAT, GST &amp; Sales Tax Calculator
                </span>
                <span className="text-sm text-muted">
                  Add or remove tax, or find the rate from net and gross
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
