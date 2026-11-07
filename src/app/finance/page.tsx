import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CalculatorCard } from "@/components/home/CalculatorCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StateTaxDirectoryLinks } from "@/components/calculators/StateTaxDirectoryLinks";
import {
  CALCULATOR_CATEGORIES,
  getCategoryTheme,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const category = CALCULATOR_CATEGORIES.find((item) => item.id === "finance")!;
const theme = getCategoryTheme("finance");

const PAGE_TITLE = "Finance Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free finance calculators for loans, compound interest, savings goals, salary conversion, zakat, and verified US state income tax. Instant browser results.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/finance`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/finance`,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
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
  ],
};

export default function FinanceCategoryPage() {
  const Icon = category.icon;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          theme={theme}
          items={[
            { label: "Home", href: "/" },
            { label: "Finance" },
          ]}
        />

        <header className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Finance Calculators
            </h1>
          </div>
          <p className="text-base text-muted sm:text-lg">{category.description}</p>
        </header>

        <section aria-labelledby="finance-tools-heading">
          <h2 id="finance-tools-heading" className="sr-only">
            Available finance calculators
          </h2>
          <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.calculators.map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                calculator={calculator}
                theme={theme}
              />
            ))}
          </div>
          <StateTaxDirectoryLinks />
        </section>

        <article className="mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-zinc-700">
          <section aria-labelledby="finance-guide-heading">
            <h2
              id="finance-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Transparent money math in the browser
            </h2>
            <p className="mt-3">
              Finance tools on CalcDaily show the formula or schedule behind the
              result. The{" "}
              <Link
                href="/finance/loan-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                loan calculator
              </Link>{" "}
              uses reducing-balance amortization so you can see payment, interest,
              and a schedule shape.{" "}
              <Link
                href="/finance/compound-interest-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Compound interest
              </Link>{" "}
              and the{" "}
              <Link
                href="/finance/savings-goal-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                savings goal
              </Link>{" "}
              tools estimate growth or required contributions. The{" "}
              <Link
                href="/finance/budget-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                budget calculator
              </Link>{" "}
              splits monthly after-tax income with 50/30/20, custom percentages, or
              your own expense list.{" "}
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Salary to hourly
              </Link>{" "}
              converts pay periods with hours-per-week assumptions you control.
            </p>
            <p className="mt-3">
              The{" "}
              <Link
                href="/finance/state-income-tax-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                US state income tax
              </Link>{" "}
              hub only lists states we have verified against revenue sources for
              the published tax year. Each state page carries its own brackets,
              deductions, worked examples, and official links — we do not invent
              rates or clone one page across fifty URLs. The{" "}
              <Link
                href="/finance/zakat-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                zakat calculator
              </Link>{" "}
              uses amounts and metal prices you enter; it does not pull live
              market feeds, and it does not load analytics or ads.
            </p>
          </section>

          <section aria-labelledby="finance-limits-heading">
            <h2
              id="finance-limits-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              What these estimates leave out
            </h2>
            <p className="mt-3">
              Loan and savings results ignore fees, early repayment penalties,
              and tax on investment gains unless you model them yourself. State
              tax pages estimate state income tax only — not federal tax, FICA,
              credits, or local wage taxes. Nothing here is personalized tax or
              investment advice. Confirm filings with the linked agency or a
              licensed professional.
            </p>
          </section>
        </article>

        <div className="mt-12 border-t border-border/80 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-900 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
          >
            <ArrowLeft className="size-4 text-muted" aria-hidden="true" />
            Back to all calculators
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
