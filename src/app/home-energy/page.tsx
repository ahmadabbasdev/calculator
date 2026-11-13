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
  (item) => item.id === "home-energy",
)!;
const theme = getCategoryTheme("home-energy");

const PAGE_TITLE = "Home & Energy Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Free home and energy calculators for BTU room sizing, solar panel sizing, and battery backup runtime estimates — results stay in your browser.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/home-energy`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/home-energy`,
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
      name: "Home & Energy",
      item: `${SITE_URL}/home-energy`,
    },
  ],
};

export default function HomeEnergyCategoryPage() {
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
            { label: "Home & Energy" },
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

        <section aria-labelledby="home-energy-tools-heading">
          <h2 id="home-energy-tools-heading" className="sr-only">
            Available home and energy calculators
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
          <section aria-labelledby="home-energy-guide-heading">
            <h2
              id="home-energy-guide-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Rough capacity helpers, not full heat-load designs
            </h2>
            <p className="mt-3">
              Home &amp; Energy tools on CalcDaily start with simple estimates.
              The{" "}
              <Link
                href="/home-energy/btu-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                BTU calculator
              </Link>{" "}
              applies a square-footage rule of thumb for cooling or heating
              output. The{" "}
              <Link
                href="/home-energy/solar-panel-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                solar panel calculator
              </Link>{" "}
              sizes an array from electricity use, sun hours and losses, with
              optional cost and payback. The{" "}
              <Link
                href="/home-energy/battery-backup-calculator"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                battery backup time calculator
              </Link>{" "}
              estimates UPS or inverter runtime from volts, amp-hours and load.
              None of these tools replace a professional heat-load design, a
              qualified solar installer, or a qualified electrician for battery
              systems — ask someone qualified before you buy or install
              equipment.
            </p>
          </section>

          <section aria-labelledby="home-energy-units-heading">
            <h2
              id="home-energy-units-heading"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Units and conversions
            </h2>
            <p className="mt-3">
              Area and ceiling inputs accept square feet or square metres and
              feet or metres. For general length, mass, volume, or temperature
              conversion outside HVAC sizing, use the{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                Unit Converter
              </Link>
              . All of these tools run locally in your browser.
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
