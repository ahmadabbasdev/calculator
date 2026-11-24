import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn, ChevronDown } from "lucide-react";
import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  applyBuyMore,
  averagePriceReferenceRow,
  requiredPriceForTarget,
  weightedAverageFromRows,
} from "@/lib/utils/average-price";

const PAGE_PATH = "/finance/average-price-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Average Price Calculator — Cost Basis";
const PAGE_DESCRIPTION =
  "Free average price calculator and weighted average price tool for stocks, crypto, or any units: average cost basis from purchases with optional fees, a further purchase, target-average price, and current-price comparison.";

const SAMPLE_ROWS = [
  { quantity: 10, price: 100, fee: null as number | null },
  { quantity: 20, price: 85, fee: null as number | null },
];

const SAMPLE_BASE = weightedAverageFromRows(SAMPLE_ROWS, false);
const SAMPLE_WITH_FEES = weightedAverageFromRows(
  [
    { quantity: 10, price: 100, fee: 10 },
    { quantity: 20, price: 85, fee: 20 },
  ],
  true,
);
const SAMPLE_BUY_MORE =
  !("ok" in SAMPLE_BASE) ? applyBuyMore(SAMPLE_BASE, 30, 70) : null;
const SAMPLE_TARGET =
  !("ok" in SAMPLE_BASE) ? requiredPriceForTarget(SAMPLE_BASE, 85, 30) : null;

const SIMPLE_AVG = (100 + 85) / 2;

const REFERENCE_ROWS = [
  averagePriceReferenceRow(SAMPLE_ROWS, false),
  averagePriceReferenceRow(
    [
      { quantity: 10, price: 100, fee: 10 },
      { quantity: 20, price: 85, fee: 20 },
    ],
    true,
  ),
  averagePriceReferenceRow(
    [
      { quantity: 10, price: 100, fee: null },
      { quantity: 20, price: 85, fee: null },
      { quantity: 30, price: 70, fee: null },
    ],
    false,
  ),
];

export const FAQ_ITEMS = [
  {
    question: "How is the average purchase price calculated?",
    answer:
      !("ok" in SAMPLE_BASE)
        ? `Add each purchase cost (quantity × price, plus fee if included), then divide by total quantity. Example: 10 units at 100 and 20 at 85 cost ${SAMPLE_BASE.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${SAMPLE_BASE.totalQuantity} units, so the average is ${SAMPLE_BASE.averagePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit.`
        : "Add each purchase cost, then divide by total quantity.",
  },
  {
    question: "What is the difference between a simple and a weighted average?",
    answer: `A simple average of two prices (100 and 85) is ${SIMPLE_AVG.toFixed(2)}. A weighted average uses quantities: more units at 85 pull the result to ${!("ok" in SAMPLE_BASE) ? SAMPLE_BASE.averagePrice.toFixed(2) : "90.00"}. This calculator always uses the weighted form.`,
  },
  {
    question: "How do fees change the average?",
    answer:
      !("ok" in SAMPLE_WITH_FEES)
        ? `When “Include fees in the average” is on, each fee is added to that row’s cost. With fees of 10 and 20 on the same example, total cost becomes ${SAMPLE_WITH_FEES.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} and the average is ${SAMPLE_WITH_FEES.averagePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        : "Fees are added to each purchase’s cost when the toggle is on.",
  },
  {
    question: "How do I find the price needed for a target average?",
    answer:
      SAMPLE_TARGET && SAMPLE_TARGET.ok
        ? `Enter a target average and how many more units you would add. Required price = (target × (current quantity + extra) − total cost) ÷ extra. From an average of 90 on 30 units, a target of 85 with 30 more units needs a price of ${SAMPLE_TARGET.requiredPrice.toFixed(2)}.`
        : "Required price = (target × (quantity + extra) − total cost) ÷ extra.",
  },
  {
    question: "Does this match my broker’s or tax cost basis?",
    answer:
      "Not necessarily. Tax and account rules may use average cost, FIFO, specific identification, or other methods. Names and rules differ by country and account type. This page only does the arithmetic you enter.",
  },
  {
    question: "Can I use fractional quantities for stocks or crypto?",
    answer:
      "Yes. Quantity accepts decimals (up to eight places in the display). Rows with zero quantity are ignored. Negative quantities or prices are blocked.",
  },
  {
    question: "Is this financial or tax advice?",
    answer:
      "No. Results are arithmetic from your numbers. The page does not suggest buying or selling, does not predict prices, and is not financial or tax advice. For growth over time with contributions, use the Compound Interest Calculator.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    alternates: { canonical: CANONICAL_URL },
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
  name: "Average Price Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Finance",
      item: `${SITE_URL}/finance`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Average Price Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function AveragePriceCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const buyMoreOk =
    SAMPLE_BUY_MORE && !("ok" in SAMPLE_BUY_MORE) ? SAMPLE_BUY_MORE : null;

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
            { label: "Average Price Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <ChartColumn className="size-4.5" aria-hidden="true" />
            Weighted average purchase price
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Average Price Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Enter purchases with quantity and price per unit to get a weighted
            average price — the same arithmetic people look for in a stock
            average calculator, crypto average price calculator, or average
            cost basis calculator. Optionally include fees, model another
            purchase, find the price needed for a target average, or compare
            with a current price. For growth with contributions over time, use
            the{" "}
            <Link
              href="/finance/compound-interest-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Compound Interest Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <AveragePriceCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Weighted versus simple average
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              A simple average treats every purchase price as equal. For prices
              100 and 85 that is (100 + 85) ÷ 2 = {SIMPLE_AVG.toFixed(2)}. A
              weighted average price multiplies each price by how many units you
              bought, sums those costs, then divides by total quantity. The
              formula this page uses is Σ(quantity × price + fee) ÷ Σ quantity
              when fees are included, or the same sum without fees when the
              toggle is off. Buying 10 at 100 and 20 at 85 costs{" "}
              {!("ok" in SAMPLE_BASE)
                ? SAMPLE_BASE.totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "2,700.00"}{" "}
              for{" "}
              {!("ok" in SAMPLE_BASE) ? SAMPLE_BASE.totalQuantity : 30} units,
              so the average is{" "}
              {!("ok" in SAMPLE_BASE)
                ? SAMPLE_BASE.averagePrice.toFixed(2)
                : "90.00"}
              — closer to 85 because more units were bought at that price. The
              simple average of 92.50 would misstate the cost of the combined
              lot; that gap is why a stock average calculator or crypto average
              price calculator should weight by quantity.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              If you then add 30 units at 70, total quantity becomes{" "}
              {buyMoreOk ? buyMoreOk.totalQuantity : 60}, total cost{" "}
              {buyMoreOk
                ? buyMoreOk.totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "4,800.00"}
              , and the new average is{" "}
              {buyMoreOk ? buyMoreOk.averagePrice.toFixed(2) : "80.00"}. The
              “If I buy more” fields run that same arithmetic without changing
              your purchase list in the browser. Searches for an “average down
              calculator” usually want this weighted update after another
              purchase at a different price — the tool only reports the new
              quantity, total cost, and average; it does not recommend buying or
              selling.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Fees matter when you turn on “Include fees in the average.” Each
              fee is added to that row’s quantity × price before the division.
              On the same 10 + 20 unit example, fees of 10 and 20 raise total
              cost to{" "}
              {!("ok" in SAMPLE_WITH_FEES)
                ? SAMPLE_WITH_FEES.totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "2,730.00"}{" "}
              and the average to{" "}
              {!("ok" in SAMPLE_WITH_FEES)
                ? SAMPLE_WITH_FEES.averagePrice.toFixed(2)
                : "91.00"}
              . Leave the toggle off if you want the average of unit prices
              alone. Commission, spread, or network fees can be entered per row;
              empty fees count as zero when the toggle is on.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Fractional units are supported (up to eight decimal places), which
              covers partial shares and crypto amounts. Rows with zero quantity
              are ignored so blank leftover rows do not skew the math. Negative
              quantities, prices, or fees are blocked. Optional labels or dates
              on each row are for your notes only and never enter the formula.
            </p>
          </section>

          <section aria-labelledby="tax-heading" className="max-w-3xl">
            <h2
              id="tax-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              What average cost means — and does not mean — for tax
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              In everyday language, “average cost” or “average cost basis” is
              the total you paid for a position divided by how many units you
              hold. That is arithmetic, not a filing method. Brokers and tax
              rules may instead use first-in first-out (FIFO), last-in
              first-out, specific lot identification, or a mandated average-cost
              method. Names and rules differ by country and account type. An
              average cost basis calculator on a public website cannot know which
              method your account uses, and this page does not choose one for
              you, does not name brokers, and does not file or report anything.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Common mistakes include averaging prices without weighting by
              quantity, forgetting fees when you meant to include them, mixing
              currencies in one list, treating a browser average as the official
              tax figure, and reading a current-price comparison as a forecast.
              The optional current price only multiplies quantity by the price
              you type: market value and the difference versus total cost in
              currency and as a percent of cost, in neutral language. It does
              not predict future prices or suggest a trade.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              The “price needed for a target average” box rearranges the same
              weighted formula: required price = (target × (quantity + extra) −
              total cost) ÷ extra. From 30 units at an average of 90, a target
              of 85 with 30 more units requires a purchase price of{" "}
              {SAMPLE_TARGET && SAMPLE_TARGET.ok
                ? SAMPLE_TARGET.requiredPrice.toFixed(2)
                : "80.00"}
              . If the required price would be zero or negative, the target
              cannot be reached with that extra quantity — the page says so in
              plain words instead of showing a misleading number. For
              percent-only math without purchases, use the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </Link>
              . For how long a savings target may take with contributions, use
              the{" "}
              <Link
                href="/finance/savings-goal-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Savings Goal Calculator
              </Link>
              . For growth with recurring contributions over time — not average
              purchase price — use the{" "}
              <Link
                href="/finance/compound-interest-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Compound Interest Calculator
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="table-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Worked average examples
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same weighted-average functions as the
                calculator, not typed by hand.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Scenario
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Total cost
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row, index) => (
                    <tr
                      key={`${row.includeFees}-${row.totalQuantity}-${index}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-foreground">
                        {index === 0
                          ? "10 @ 100 and 20 @ 85"
                          : index === 1
                            ? "Same buys with fees 10 and 20"
                            : "After adding 30 @ 70"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.totalQuantity.toLocaleString("en-US", {
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.totalCost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.averagePrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="faq-heading" className="max-w-3xl">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently asked questions
            </h2>
            <div className="mt-4 divide-y divide-border/80 rounded-xl border border-border/80 bg-panel shadow-card">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-semibold text-foreground">
                    {item.question}
                    <ChevronDown
                      className="mt-0.5 size-4 shrink-0 text-muted transition group-open:rotate-180"
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
              This calculator is not financial or tax advice. It performs
              arithmetic on the numbers you enter. It does not suggest buying or
              selling, does not predict prices, and does not replace broker or
              tax cost-basis methods. Tax cost-basis rules (average cost, FIFO,
              specific lots, and others) differ by country and account type.
              Your inputs stay in the browser and are not stored by CalcDaily.
            </p>
            <p className="mt-2 text-[12px] text-zinc-500">
              Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
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
                Percent math, compound growth, and savings timelines.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of, change, and increase or decrease
                </span>
              </a>
              <a
                href="/finance/compound-interest-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Compound Interest Calculator
                </span>
                <span className="text-sm text-muted">
                  Future value, contributions, and APY
                </span>
              </a>
              <a
                href="/finance/savings-goal-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Savings Goal Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly savings amount or time to a goal
                </span>
              </a>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
