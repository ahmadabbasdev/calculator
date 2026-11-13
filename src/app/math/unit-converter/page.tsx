import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Ruler } from "lucide-react";
import { UnitConverter } from "@/components/calculators/UnitConverter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { COMMON_CONVERSIONS } from "@/lib/utils/unit-conversion";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/unit-converter";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Unit Converter - Length, Weight, Volume & Temperature";
const PAGE_DESCRIPTION =
  "Free unit converter for length, weight, volume, and temperature. Convert cm to inches, kg to lbs, miles to km, Celsius to Fahrenheit, and more — instantly.";

export const FAQ_ITEMS = [
  {
    question: "How do I convert length, weight, or volume units?",
    answer:
      "Pick a category (Length, Weight / Mass, or Volume), enter a value, choose the From and To units, and read the live result. Use the swap button to flip the pair — useful for cm to inches, kg to lbs, miles to km, liters to gallons, and similar everyday conversions.",
  },
  {
    question: "How do I convert Celsius to Fahrenheit?",
    answer:
      "Open the Temperature category, set From to °C and To to °F, then enter the temperature. The formula is °F = °C × 9/5 + 32. The converter also supports Fahrenheit to Celsius and Kelvin both ways.",
  },
  {
    question: "What is the difference between a US cup and a metric cup?",
    answer:
      "A US customary cup is about 236.6 milliliters. A metric cup (common in some recipes and countries) is 250 milliliters. They are not the same. This converter uses US cups, teaspoons, tablespoons, fluid ounces, and gallons — look for the “US units” label on the Volume tab.",
  },
  {
    question: "Why are there different gallon sizes?",
    answer:
      "The US liquid gallon is about 3.785 liters. The Imperial (UK) gallon is larger — about 4.546 liters. Recipes, fuel, and product labels can use either system depending on the country. CalcDaily defaults to the US gallon so US cooking and packaging conversions stay consistent; Imperial gallons are not mixed into the same dropdown.",
  },
  {
    question: "Is this converter accurate for scientific or engineering use?",
    answer:
      "Factors follow standard SI and US customary definitions, and results are rounded for readable everyday use (cooking, schoolwork, travel). For lab or engineering work that needs many significant figures or uncertainty analysis, use a dedicated scientific tool and treat these displays as rounded convenience values.",
  },
  {
    question: "Can I convert metric to imperial units?",
    answer:
      "Yes. Length, weight, and volume each include metric units (such as cm, m, kg, liters) and common imperial / US customary units (inches, feet, miles, pounds, US cups and gallons). Temperature covers Celsius, Fahrenheit, and Kelvin on the same panel.",
  },
  {
    question: "Why can’t I enter a negative length or weight?",
    answer:
      "Physical lengths, masses, and volumes cannot be negative, so the converter shows a short message instead of a fake result. Temperature is different: Celsius and Fahrenheit may be negative, while Kelvin cannot go below absolute zero (0 K).",
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
  name: "Unit Converter",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
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
      name: "Math & Education",
      item: `${SITE_URL}/math`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Unit Converter",
      item: CANONICAL_URL,
    },
  ],
};

export default function UnitConverterPage() {
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
          theme="math"
          items={[
            { label: "Home", href: "/" },
            { label: "Math & Education", href: "/math" },
            { label: "Unit Converter" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <Ruler className="size-4.5" aria-hidden="true" />
            Metric &amp; US customary conversion calculator
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Unit Converter
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Convert length, weight, volume, and temperature in one place — cm to
            inches, kg to lbs, miles to km, liters to gallons, Celsius to
            Fahrenheit, and more. Results update as you type.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <UnitConverter />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Unit Converter
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Four categories, two unit menus, and a live result — no submit
                button required.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Length, Weight / Mass, Volume, or Temperature from the
                category tabs.
              </li>
              <li>
                Enter the value you want to convert, then pick From and To units
                (for example centimeters and inches, or kilograms and pounds).
              </li>
              <li>
                Read the large converted value and the one-line formula under it.
                Use the swap control to reverse the pair instantly.
              </li>
              <li>
                On Volume, the “US units” badge means cups, spoons, fluid ounces,
                and gallons follow US customary sizes — not Imperial UK gallons.
              </li>
            </ol>
          </section>

          <section aria-labelledby="common-conversions-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="common-conversions-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Conversions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Frequently searched pairs and their exact factors — a quick
                reference alongside the interactive converter.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[36rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Common unit conversion factors for length, weight, volume, and
                  temperature
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      From
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Equals
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMMON_CONVERSIONS.map((row) => (
                    <tr
                      key={`${row.from}-${row.to}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                        {row.from}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 tabular-nums">
                        {row.factor}{" "}
                        <span className="text-zinc-500">({row.to})</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="metric-imperial-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="metric-imperial-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Metric vs. Imperial / US Customary Units
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two everyday measurement families — and why volume labels matter.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The <strong className="font-semibold text-foreground">metric</strong>{" "}
                system (SI) builds on meters, kilograms, and liters with powers of
                ten — centimeters, millimeters, grams, and milliliters stay easy
                to scale. Most of the world uses metric for science, medicine, and
                daily life.
              </p>
              <p>
                <strong className="font-semibold text-foreground">
                  Imperial and US customary
                </strong>{" "}
                units (inches, feet, miles, pounds, cups, gallons) share history
                but are not always identical. The US gallon and US cup differ from
                Imperial (UK) sizes. This metric to imperial converter keeps
                cooking and liquid measures on US customary defaults so a “cup”
                or “gallon” matches typical US packaging and recipes.
              </p>
              <p>
                Temperature sits apart: Celsius and Kelvin are metric-aligned,
                while Fahrenheit remains common in the United States. Convert
                between them with the Temperature tab rather than a simple
                multiply-by factor.
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
                Cups vs metric cups, gallons, Celsius to Fahrenheit, and accuracy.
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

          <section aria-labelledby="related-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="related-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Related Calculators
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                More math tools on CalcDaily.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and increase or decrease
                </span>
              </Link>
              <Link
                href="/finance/zakat-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Zakat Calculator
                </span>
                <span className="text-sm text-muted">
                  Nisab, gold, silver and savings estimates (calculation aid)
                </span>
              </Link>
              <Link
                href="/health/bmi-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BMI Calculator
                </span>
                <span className="text-sm text-muted">
                  Body mass index from height and weight
                </span>
              </Link>
              <Link
                href="/health/calorie-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Calorie Calculator
                </span>
                <span className="text-sm text-muted">
                  TDEE, BMR, and maintenance calorie estimates
                </span>
              </Link>
              <Link
                href="/health/pace-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert min/km, min/mile, km/h, and mph
                </span>
              </Link>
              <Link
                href="/health/steps-to-distance-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Steps to Distance Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert steps to km, miles, meters, and feet
                </span>
              </Link>
              <Link
                href="/home-energy/btu-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BTU Calculator
                </span>
                <span className="text-sm text-muted">
                  Room AC and heater BTU/h, tons, and thermal kW
                </span>
              </Link>
              <Link
                href="/home-energy/battery-backup-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Battery Backup Time Calculator
                </span>
                <span className="text-sm text-muted">
                  UPS and inverter runtime from volts, Ah and load
                </span>
              </Link>
              <Link
                href="/home-energy/electricity-cost-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Electricity Cost Calculator
                </span>
                <span className="text-sm text-muted">
                  Watts to kWh and appliance or bill cost estimates
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
