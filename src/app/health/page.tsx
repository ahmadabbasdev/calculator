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

const category = CALCULATOR_CATEGORIES.find((item) => item.id === "health")!;
const theme = getCategoryTheme("health");

const PAGE_TITLE = "Health & Fitness Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free health calculators for BMI, calories (TDEE/BMR), running pace, steps to distance, ovulation fertile window, and pregnancy due dates — with formulas and limits explained.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/health`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/health`,
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
      name: "Health & Fitness",
      item: `${SITE_URL}/health`,
    },
  ],
};

export default function HealthCategoryPage() {
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
            { label: "Health & Fitness" },
          ]}
        />

        <header className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Health &amp; Fitness Calculators
            </h1>
          </div>
          <p className="text-base text-muted sm:text-lg">{category.description}</p>
        </header>

        <section aria-labelledby="health-tools-heading">
          <h2 id="health-tools-heading" className="sr-only">
            Available health and fitness calculators
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
          <section aria-labelledby="health-guide-heading">
            <h2
              id="health-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              How these health tools are meant to be used
            </h2>
            <p className="mt-3">
              The health calculators on CalcDaily are screening and planning
              helpers. They apply published formulas — adult BMI cut-offs,
              Mifflin–St Jeor for calorie needs, exact mile-to-kilometre pace
              conversion, steps-to-distance with step length, calendar-method
              ovulation dates, and common pregnancy dating methods — then show
              the arithmetic on the page. They are not a clinic visit, a
              diagnosis, or a prescription.
            </p>
            <p className="mt-3">
              Use{" "}
              <Link
                href="/health/bmi-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                BMI
              </Link>{" "}
              when you want a quick adult body-mass index with WHO categories
              (and optional Asian cut-offs). Use the{" "}
              <Link
                href="/health/calorie-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                calorie calculator
              </Link>{" "}
              for an estimated BMR and TDEE from age, sex, height, weight, and
              activity. Use the{" "}
              <Link
                href="/health/pace-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                pace calculator
              </Link>{" "}
              for running or walking pace, finish time, distance, and
              min/km–min/mile conversion. Use the{" "}
              <Link
                href="/health/steps-to-distance-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                steps to distance calculator
              </Link>{" "}
              to turn steps into km or miles (or the reverse). Use the{" "}
              <Link
                href="/health/ovulation-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                ovulation calculator
              </Link>{" "}
              for a calendar fertile-window estimate — not birth control. Use
              the{" "}
              <Link
                href="/health/pregnancy-due-date-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                pregnancy due date calculator
              </Link>{" "}
              when you already have an LMP, conception, IVF transfer, or
              ultrasound date and need an estimated due date and trimester
              markers.
            </p>
          </section>

          <section aria-labelledby="health-limits-heading">
            <h2
              id="health-limits-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Limits we state on every health page
            </h2>
            <p className="mt-3">
              BMI misclassifies some muscular people and is a poor fit in
              pregnancy. Calorie equations are population averages. Ovulation
              calendar math fails when cycles are irregular. Due dates are
              planning estimates — most births do not land on the exact day.
              Sensitive tools (ovulation and pregnancy dating) keep inputs in
              the browser and do not load analytics or ads.
            </p>
            <p className="mt-3">
              If symptoms worry you, or if you need contraception, prenatal
              care, or interpretation of lab results, talk with a qualified
              clinician. Official overviews we cite on tool pages include sources
              such as WHO guidance for BMI categories and NHS pages for
              menstrual-cycle fertility and pregnancy dating context.
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
