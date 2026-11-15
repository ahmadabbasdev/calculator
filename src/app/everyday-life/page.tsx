import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CalculatorCard } from "@/components/home/CalculatorCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  CALCULATOR_CATEGORIES,
  getCategoryTheme,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const category = CALCULATOR_CATEGORIES.find(
  (item) => item.id === "everyday-life",
)!;
const theme = getCategoryTheme("everyday-life");

const PAGE_TITLE = "Everyday Life Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free everyday life calculators for land area, trip fuel cost, and efficiency conversions — results stay in your browser.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/everyday-life` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/everyday-life`,
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
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Everyday Life",
      item: `${SITE_URL}/everyday-life`,
    },
  ],
};

export default function EverydayLifeCategoryPage() {
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
            { label: "Everyday Life" },
          ]}
        />

        <header className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              {category.title} Calculators
            </h1>
          </div>
          <p className="text-base text-muted sm:text-lg">{category.description}</p>
        </header>

        <section aria-labelledby="everyday-life-tools-heading">
          <h2 id="everyday-life-tools-heading" className="sr-only">
            Available everyday life calculators
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
        </section>

        <article className="mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-zinc-700">
          <section aria-labelledby="everyday-guide-heading">
            <h2
              id="everyday-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Everyday measurements, not legal surveys
            </h2>
            <p className="mt-3">
              Everyday Life tools on CalcDaily start with simple estimates from
              the numbers you enter. The{" "}
              <Link
                href="/everyday-life/land-area-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                land area calculator
              </Link>{" "}
              estimates plot area from common shapes or a polygon, and converts
              between square feet, marla, kanal, acres and related units. The{" "}
              <Link
                href="/everyday-life/fuel-cost-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                fuel cost calculator
              </Link>{" "}
              estimates trip fuel from distance and efficiency, or measures
              km/L and MPG from a fill-up — without looking up fuel prices. For
              general unit conversion, use the{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Unit Converter
              </Link>
              .
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
