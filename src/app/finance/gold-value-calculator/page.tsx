import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Gem } from "lucide-react";
import { GoldValueCalculator } from "@/components/calculators/GoldValueCalculator";
import { CalculatorEeAtSections } from "@/components/seo/CalculatorEeAtSections";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { getCalculatorEeAt } from "@/lib/calculator-eeat";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  GRAMS_PER_MASHA,
  GRAMS_PER_RATTI,
  GRAMS_PER_TOLA,
  GRAMS_PER_TROY_OUNCE,
  calculateJewelleryPrice,
  karatPurityTable,
} from "@/lib/utils/gold-value";

const PAGE_PATH = "/finance/gold-value-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const EEAT = getCalculatorEeAt(PAGE_PATH);

const PAGE_TITLE = "Gold Value Calculator — Jewellery & Karat";
const PAGE_DESCRIPTION =
  "Gold value calculator and gold jewellery price calculator: karat to purity, making charges, wastage and tax from the 24K price you enter — per gram, tola or troy ounce. Not live prices or zakat.";

const KARAT_ROWS = karatPurityTable();

const SAMPLE_BASE = calculateJewelleryPrice({
  weight: 10,
  weightUnit: "gram",
  stoneWeightGrams: null,
  purityMode: "karat",
  karat: 22,
  customPurityPercent: null,
  price24k: 200,
  priceUnit: "per_gram",
  makingMode: "percent_of_gold",
  makingValue: 8,
  wastagePercent: 0,
  taxPercent: 3,
  taxBase: "gold_wastage_making",
});

function moneyPlain(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function gramsPlain(n: number, digits = 4): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export const FAQ_ITEMS = [
  {
    question: "How does the gold value calculator work?",
    answer:
      SAMPLE_BASE.ok && SAMPLE_BASE.mode === "jewellery"
        ? `Enter weight, karat or purity, and your own 24K gold price. Pure gold grams = net weight × (karat ÷ 24). Gold value = pure grams × your 24K price per gram. Example: 10 g of 22K at 200 per gram of 24K has about ${gramsPlain(SAMPLE_BASE.pureGoldGrams)} g pure and gold value ${moneyPlain(SAMPLE_BASE.goldValue)} before making charges and tax.`
        : "Enter weight, karat or purity, and your own 24K gold price. Pure gold = net weight × purity; gold value = pure grams × your 24K price per gram.",
  },
  {
    question: "What is karat to purity?",
    answer:
      "Purity percent = karat ÷ 24 × 100. So 24K is 100%, 22K is about 91.67%, 18K is 75%. You can also enter a custom purity percent when hallmark figures differ from a standard karat.",
  },
  {
    question: "How are making charges and wastage applied?",
    answer:
      "Making charges can be none, a percent of gold value, a fixed amount per gram of net weight, or a fixed total. Wastage is a percent of gold value. Tax can apply to gold + wastage + making, or to making charges only. None of these rates are prefilled from a seller.",
  },
  {
    question: "Does this use live gold prices?",
    answer:
      "No. You enter the 24K price you want to use (per gram, per tola, or per troy ounce). The page does not fetch live prices, history or predictions.",
  },
  {
    question: "Is this a zakat calculator?",
    answer:
      "No. This page only does jewellery and old-gold arithmetic from prices you enter. For zakat estimates on gold and other wealth, use the Zakat Calculator.",
  },
  {
    question: "What units are supported?",
    answer: `Weight can be grams, tola (${GRAMS_PER_TOLA} g), masha (${GRAMS_PER_MASHA} g), or troy ounce (${GRAMS_PER_TROY_OUNCE} g). One ratti is ${GRAMS_PER_RATTI} g (masha ÷ 8). Stone or other weight to deduct is entered in grams and cannot exceed gross weight.`,
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
  name: "Gold Value Calculator",
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
      name: "Gold Value Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function GoldValueCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const sample =
    SAMPLE_BASE.ok && SAMPLE_BASE.mode === "jewellery" ? SAMPLE_BASE : null;

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
            { label: "Gold Value Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Gem className="size-4.5" aria-hidden="true" />
            Jewellery price and old-gold value from your 24K rate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Gold Value Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate a jewellery price or old-gold value from weight, karat or
            purity, making charges, wastage and tax — using the 24K gold price
            you enter (per gram, tola or troy ounce). No live prices and no
            zakat calculation.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            For zakat on gold and other wealth, use the{" "}
            <Link
              href="/finance/zakat-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Zakat Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <GoldValueCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="karat-heading" className="max-w-3xl">
            <h2
              id="karat-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Karat and purity
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Karat describes how much of a metal piece is gold. Purity percent
              is karat ÷ 24 × 100 — the “karat to purity” step behind every 22K
              gold calculator and jewellery quote that starts from a 24K rate.
              The table below is generated from the same karat-to-purity
              function the calculator uses, so the figures stay consistent with
              the tool. Custom purity is available when a hallmark or assay
              differs from a named karat (for example 91.6% instead of rounding
              to 22K).
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Karat
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Purity %
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Fraction
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {KARAT_ROWS.map((row) => (
                    <tr
                      key={row.karat}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.karat}K
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.purityPercent.toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })}
                        %
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.fraction.toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="units-heading" className="max-w-3xl">
            <h2
              id="units-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Tola, masha and ratti
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Many South Asian jewellery quotes still use traditional weights
              alongside grams. This page uses 1 tola = {GRAMS_PER_TOLA} g, 1
              masha = tola ÷ 12 = {GRAMS_PER_MASHA} g, and 1 ratti = masha ÷ 8 ={" "}
              {GRAMS_PER_RATTI} g. A troy ounce is {GRAMS_PER_TROY_OUNCE} g —
              common in international gold quotes. Six masha equal{" "}
              {gramsPlain(6 * GRAMS_PER_MASHA, 3)} g. A gold price per tola
              calculator check: 2,332.80 per tola of 24K equals 200 per gram
              because 2,332.80 ÷ {GRAMS_PER_TOLA} = 200. About 6,220.70 per troy
              ounce is likewise about 200 per gram. Your 24K price can be
              entered per gram, per tola or per troy ounce; the calculator
              converts it to a per-gram rate before multiplying by pure gold
              grams. For other unit conversions, see the{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Unit Converter
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="buildup-heading" className="max-w-3xl">
            <h2
              id="buildup-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How a jewellery price is put together
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              In neutral arithmetic terms, a gold jewellery price calculator
              quote often starts from net gold weight (gross weight minus stones
              or other non-gold weight). Pure gold grams = net weight × purity.
              Gold value = pure grams × the 24K price per gram. Wastage, when
              used, is a percent of that gold value. A gold making charges
              calculator step may be none, a percent of gold value, a fixed
              amount per gram of net weight, or a fixed total. Tax, when
              entered, can apply to gold + wastage + making, or to making
              charges only. The total is the sum of those parts; the effective
              price per gram is total ÷ net weight.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked example with a 24K price of 200 per gram: 10 g of 22K has
              about{" "}
              {sample ? gramsPlain(sample.pureGoldGrams) : "9.1667"} g of pure
              gold and gold value{" "}
              {sample ? moneyPlain(sample.goldValue) : "1,833.33"}. Making
              charges of 8% add about{" "}
              {sample ? moneyPlain(sample.makingCharges) : "146.67"}, for a
              subtotal of{" "}
              {sample ? moneyPlain(sample.subtotalBeforeTax) : "1,980.00"}. A 3%
              tax on that subtotal is{" "}
              {sample ? moneyPlain(sample.taxAmount) : "59.40"}, so the total is{" "}
              {sample ? moneyPlain(sample.totalPrice) : "2,039.40"}. Taxing the
              same making amount alone would add about 4.40 instead. One tola of
              22K at 2,332.80 per tola of 24K has about 10.692 g pure and gold
              value 2,138.40; making of 100 per gram of net weight adds 1,166.40
              for a total of 3,304.80 before tax. None of these steps predicts
              tomorrow&apos;s market or recommends a purchase.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              The 24K price must be converted to the karat you are pricing.
              Applying a 24K rate directly to 22K weight without multiplying by
              22 ÷ 24 overstates the gold content — a common mistake when
              someone uses the headline 24K price for 22K jewellery. Forgetting
              stone weight leaves too much mass in the gold calculation.
              Mixing price units (tola vs gram vs troy ounce) without converting
              also skews totals. Treat this page&apos;s result as arithmetic on
              your inputs, not a seller&apos;s binding quote: jewellers&apos;
              pricing, hallmark purity, making charges and deductions vary, and
              the real price depends on the seller.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Old-gold mode uses the same purity and price conversion, then
              optionally subtracts a dealer deduction percent from the estimated
              value (for example 10 g of 22K at 200 per gram with a 5% deduction
              is about 1,741.67). It still uses only the numbers you type. For
              percent-only math, see the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </Link>
              . For invoice tax arithmetic separate from jewellery making
              charges, see the{" "}
              <Link
                href="/finance/vat-gst-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                VAT, GST &amp; Sales Tax Calculator
              </Link>
              . This tool does not calculate zakat — use the{" "}
              <Link
                href="/finance/zakat-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Zakat Calculator
              </Link>{" "}
              for that.
            </p>
          </section>

          {EEAT ? <CalculatorEeAtSections content={EEAT} /> : null}

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
              This calculator performs arithmetic on the prices and weights you
              enter. It is not buying or selling advice, does not predict gold
              prices, and does not name sellers or brands. Jewellers&apos;
              pricing, hallmark purity, making charges and deductions vary. It
              does not calculate zakat. Inputs stay in the browser.
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
                Zakat, unit conversion, percent math and sales tax.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                prefetch={false}
                href="/finance/zakat-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Zakat Calculator
                </span>
                <span className="text-sm text-muted">
                  Estimate zakat with metal prices you enter
                </span>
              </Link>
              <Link
                prefetch={false}
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, mass, volume and more
                </span>
              </Link>
              <Link
                prefetch={false}
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of, change, and increase or decrease
                </span>
              </Link>
              <Link
                prefetch={false}
                href="/finance/vat-gst-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  VAT, GST &amp; Sales Tax Calculator
                </span>
                <span className="text-sm text-muted">
                  Add or remove tax from an invoice amount
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
