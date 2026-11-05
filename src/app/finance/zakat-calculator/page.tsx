import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HandCoins } from "lucide-react";
import { ZakatCalculator } from "@/components/calculators/ZakatCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import {
  GOLD_NISAB_GRAMS_ALT,
  GOLD_NISAB_GRAMS_STANDARD,
  SILVER_NISAB_GRAMS_ALT,
  SILVER_NISAB_GRAMS_STANDARD,
} from "@/lib/utils/zakat";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/finance/zakat-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Zakat Calculator - Nisab, Gold, Silver & Savings";
const PAGE_DESCRIPTION =
  "Estimate zakat on savings, gold, silver and investments using your own metal prices and a chosen nisab. A calculation aid only — ask a qualified scholar.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate zakat on savings?",
    answer:
      "Add cash in hand, bank balances and savings together with your other zakatable assets, subtract eligible debts if you choose to, and compare the net figure with the nisab. If net wealth reaches the nisab, this calculator estimates zakat as 2.5% of that net wealth. Enter any amount already paid so the remaining figure updates.",
  },
  {
    question: "What is nisab and how is it calculated?",
    answer:
      "Nisab is the minimum threshold of wealth above which zakat may be due. This tool estimates it from a gold weight or a silver weight multiplied by the metal price you enter, or from a custom amount you type (for example one announced locally). Prices are never fetched automatically.",
  },
  {
    question: "Should I use the gold or silver nisab?",
    answer:
      "Views differ. The silver nisab is usually a lower money threshold, so more people are included. Some organisations and the Hanafi tradition commonly use silver; other schools commonly use gold. This page defaults to silver and lets you switch. Ask a qualified scholar which basis to use.",
  },
  {
    question: "Is zakat due on gold jewellery?",
    answer:
      "Schools of thought differ. The Hanafi view generally counts all gold jewellery toward zakatable wealth. Some other views treat jewellery that is worn regularly differently. Use the Include personal jewellery setting and the per-item checkbox to model either approach, then confirm with a scholar.",
  },
  {
    question: "What is the hawl (lunar year)?",
    answer:
      "Hawl means a lunar year, about 354 days. Zakat is generally assessed on wealth that has remained at or above the nisab for a full lunar year. Use the value of your assets on your zakat date. This calculator does not track dates or the hawl for you.",
  },
  {
    question: "Are debts deducted before calculating zakat?",
    answer:
      "Views differ on which debts to deduct and how. This tool lets you enter debts and bills due now or within about twelve months and subtracts them from total assets. Confirm with a scholar which liabilities apply in your situation.",
  },
  {
    question: "Is zakat due on shares, crypto or retirement funds?",
    answer:
      "Rulings differ, especially for long-term holdings and retirement accounts. Enter market values for items you treat as zakatable after consulting a scholar. The Investments and business section includes a short note that long-term investments and retirement funds need scholarly guidance.",
  },
  {
    question: "How do I calculate zakat on salary?",
    answer:
      "Salary itself is not a separate zakat category here. Amounts from salary that remain as cash, bank balances or savings on your zakat date are included under cash and savings. What you have already spent is not entered.",
  },
  {
    question: "Is zakat deducted automatically from my bank account?",
    answer:
      "In some countries, authorities or banks may deduct zakat from certain accounts. Rules differ and may depend on a declaration. Check with your bank or local authority, and enter any amounts already paid in the Already paid field so the remaining estimate is reduced.",
  },
  {
    question: "Who can receive zakat?",
    answer:
      "There are eight commonly listed categories of recipients, referred to in Surah At-Tawbah 9:60. Ask a qualified scholar or a trusted organisation how those categories apply. This site does not name charities or collect donations.",
  },
  {
    question: "Does this calculator give a religious ruling?",
    answer:
      "No. It is a general calculation aid only. Zakat rules vary by school of thought and by circumstance. Please ask a qualified scholar for guidance that fits your situation.",
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
  name: "Zakat Calculator",
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
      name: "Zakat Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function ZakatCalculatorPage() {
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
            { label: "Zakat Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <HandCoins className="size-4.5" aria-hidden="true" />
            Nisab, gold, silver, savings and investments
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Zakat Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate zakat on cash, savings, gold, silver, investments and trade
            goods using metal prices you enter and a nisab basis you choose. This
            is a calculation aid only — not a religious ruling.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <ZakatCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Zakat Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Work through the sections once, then read the live summary.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose a display currency and a nisab basis (silver, gold, or a
                custom amount). Optionally switch to the {GOLD_NISAB_GRAMS_ALT}{" "}
                g / {SILVER_NISAB_GRAMS_ALT} g weights.
              </li>
              <li>
                Enter the price of 24 karat gold and pure silver in the unit you
                prefer (per gram, tola or troy ounce). Prices are never fetched
                for you.
              </li>
              <li>
                Fill in cash and savings, gold and silver items, investments and
                business assets, money owed to you, and debts you wish to deduct.
              </li>
              <li>
                Read the summary for total assets, nisab, whether net wealth
                reaches it, zakat due at 2.5%, and any remaining amount after
                zakat already paid. Use Copy summary if you want a plain-text
                note.
              </li>
            </ol>
          </section>

          <section aria-labelledby="what-zakat-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="what-zakat-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Zakat and Nisab Are
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A plain overview for orientation — not a fatwa.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Zakat is an obligatory annual charity for eligible Muslims. In
                common practice for wealth, the rate used here is 2.5% of
                zakatable wealth that has remained at or above the nisab for a
                lunar year (about 354 days). Nisab is the minimum threshold of
                wealth; this page estimates it from gold or silver weights and
                the metal prices you supply, or from a custom figure.
              </p>
              <p>
                Scholars and schools of thought differ on several details —
                including which nisab metal to use, how jewellery is treated, and
                which debts to deduct. Where this calculator offers a choice, each
                option is labelled with a short neutral note. Ask a qualified
                scholar for guidance that fits your circumstances.
              </p>
            </div>
          </section>

          <section aria-labelledby="assets-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="assets-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Which Assets Are Included
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                What this form covers, and a short list of what it does not.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Included categories: cash and savings, gold and silver (with karat
                or purity), shares and funds held for trading, other investments,
                cryptocurrency, business inventory or goods for sale, other
                zakatable assets you enter, and money owed to you that you expect
                to receive soon. Debts and bills due now or within about twelve
                months can be subtracted. Rental income that you have saved is
                entered as cash or savings.
              </p>
              <p>
                Not modelled as zakatable here: the home you live in, a personal
                car, and everyday household items. Livestock, agricultural
                produce, minerals, zakat al-fitr and qurbani are also outside the
                scope of this page.
              </p>
            </div>
          </section>

          <section aria-labelledby="nisab-table-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="nisab-table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Nisab Values
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Commonly cited weights. Money values depend on the prices you
                enter.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[28rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Common gold and silver nisab weights
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3">
                      Basis
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Standard weight
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Alternate weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Gold
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-800">
                      {GOLD_NISAB_GRAMS_STANDARD} g
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-800">
                      {GOLD_NISAB_GRAMS_ALT} g
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Silver
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-800">
                      {SILVER_NISAB_GRAMS_STANDARD} g
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-800">
                      {SILVER_NISAB_GRAMS_ALT} g
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-zinc-600">
              Different schools and organisations use different weights. The
              Hanafi tradition commonly uses the silver nisab; other schools
              commonly use gold. Neither view is presented here as the only
              correct one.
            </p>
          </section>

          <section aria-labelledby="debts-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="debts-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Debts
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Optional deductions before comparing wealth with the nisab.
              </p>
            </div>
            <p className="max-w-3xl text-[15px] leading-relaxed text-muted">
              You can enter debts and bills due now or within the next twelve
              months. Views differ on which debts should reduce zakatable wealth.
              Net wealth in this tool is total assets minus the liabilities you
              enter, never below zero. Confirm the treatment of debts with a
              scholar.
            </p>
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
                Clear boundaries so the tool is not mistaken for a full ruling.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                It does not cover livestock, agricultural produce, minerals,
                zakat al-fitr or qurbani. It does not fetch live metal prices or
                announce a “today’s nisab” figure. It does not track the lunar
                year for you, recommend where to give, or collect donations.
              </p>
              <p>
                Results are general estimates. Zakat rules vary by school of
                thought and by circumstance, so please ask a qualified scholar.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="faq-heading"
            className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-7"
          >
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Savings, nisab, jewellery, hawl, debts, investments and the
                limits of this tool.
              </p>
            </div>
            <div className="divide-y divide-border/80">
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
              Explanatory pages about nisab (for background only; they are not
              endorsements and this site does not collect zakat):{" "}
              <a
                href="https://islamicrelief.org.au/our-work/islamic-giving/nisab/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Islamic Relief Australia — Nisab
              </a>
              ;{" "}
              <a
                href="https://www.islamicreliefcanada.org/our-work/zakat/nisab"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Islamic Relief Canada — Nisab
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and estimates only. It
              is not a religious ruling. Zakat rules vary by school of thought and
              by circumstance, so please ask a qualified scholar.
            </p>
            <p className="mt-2 text-[12px] text-zinc-500">
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
                Percentages, unit conversions for metal weights, and savings
                planning.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and increase or decrease
                </span>
              </Link>
              <Link
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Convert grams, and other everyday weight and length units
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
                  How much to save each month toward a goal
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
