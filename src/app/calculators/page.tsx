import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StateTaxDirectoryLinks } from "@/components/calculators/StateTaxDirectoryLinks";
import {
  getPublicCategories,
  isCalculatorLive,
  LIVE_CALCULATOR_COUNT,
  freeCalculatorsLabel,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/calculators";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "All Calculators — CalcDaily";
const PAGE_DESCRIPTION = `Directory of ${LIVE_CALCULATOR_COUNT} free CalcDaily calculators by category, with short plain-language descriptions.`;

export const metadata: Metadata = {
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
      name: "Calculators",
      item: CANONICAL_URL,
    },
  ],
};

export default function CalculatorsDirectoryPage() {
  const categories = getPublicCategories();

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
          items={[
            { label: "Home", href: "/" },
            { label: "Calculators" },
          ]}
        />
        <header className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            All calculators
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            {freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)} on {SITE_NAME}, grouped
            by category. Every link opens a live tool.
          </p>
        </header>

        <div className="space-y-12">
          {categories.map((category) => {
            const live = category.calculators.filter(isCalculatorLive);
            if (live.length === 0) return null;
            return (
              <section
                key={category.id}
                aria-labelledby={`dir-${category.id}`}
              >
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200 pb-2">
                  <h2
                    id={`dir-${category.id}`}
                    className="text-xl font-semibold tracking-tight text-zinc-950"
                  >
                    {category.title}
                  </h2>
                  <Link
                    href={`/${category.id}`}
                    className="text-sm font-medium text-zinc-700 underline underline-offset-2"
                  >
                    Category page
                  </Link>
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {live.map((tool) => (
                    <li key={tool.id}>
                      <a
                        href={tool.href}
                        className="block rounded-xl border border-border/80 bg-panel px-4 py-3 shadow-card transition hover:border-zinc-400"
                      >
                        <span className="text-[15px] font-semibold text-foreground">
                          {tool.name}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                          {tool.description}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                {category.id === "finance" ? <StateTaxDirectoryLinks /> : null}
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
