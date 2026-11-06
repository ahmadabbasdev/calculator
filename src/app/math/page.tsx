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

const category = CALCULATOR_CATEGORIES.find((item) => item.id === "math")!;
const theme = getCategoryTheme("math");

const PAGE_TITLE = "Math & Education Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free math and education calculators for percentages, averages, unit conversion (metric and US), and GPA/CGPA. Instant results in your browser — no signup.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/math`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/math`,
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
      name: "Math & Education",
      item: `${SITE_URL}/math`,
    },
  ],
};

export default function MathCategoryPage() {
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
            { label: "Math & Education" },
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

        <section aria-labelledby="math-tools-heading">
          <h2 id="math-tools-heading" className="sr-only">
            Available math and education calculators
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
          <section aria-labelledby="math-guide-heading">
            <h2
              id="math-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              School and everyday number tools with shown work
            </h2>
            <p className="mt-3">
              Math calculators here prioritize a clear worked step. The{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                percentage calculator
              </Link>{" "}
              covers “percent of,” change, and increase/decrease. The{" "}
              <Link
                href="/math/grade-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                grade calculator
              </Link>{" "}
              handles weighted categories and final-exam “what score do I need”
              modes.{" "}
              <Link
                href="/math/gpa-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                GPA / CGPA
              </Link>{" "}
              converts letter or point scales you choose. Averages and{" "}
              <Link
                href="/math/average-per-day-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                average per day
              </Link>{" "}
              help when a total spans a date range. The{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                unit converter
              </Link>{" "}
              keeps length, mass, and temperature conversions in one place with
              the conversion factors stated on the page.
            </p>
          </section>

          <section aria-labelledby="math-limits-heading">
            <h2
              id="math-limits-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Scales and rounding
            </h2>
            <p className="mt-3">
              Schools and employers use different GPA scales and rounding rules.
              Always match the scale printed on your syllabus or transcript. Unit
              conversions use fixed factors; scientific work that needs more
              precision or different constants should use a dedicated reference.
              All of these tools run locally in your browser.
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
