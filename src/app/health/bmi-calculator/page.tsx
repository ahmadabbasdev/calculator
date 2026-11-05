import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChevronDown } from "lucide-react";
import { BmiCalculator } from "@/components/calculators/BmiCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/health/bmi-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "BMI Calculator - Body Mass Index (kg, cm, lb, ft)";
const PAGE_DESCRIPTION =
  "Free BMI calculator in kg and cm (or pounds and feet). WHO adult categories and the healthy BMI range of 18.5–24.9. Results in your browser — no signup.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate my BMI?",
    answer:
      "BMI is weight in kilograms divided by height in meters squared: BMI = kg ÷ m². In imperial units, an equivalent formula is BMI = 703 × lb ÷ in². Enter height and weight above — metric (cm, kg) or imperial (feet and inches, pounds) — and the calculator shows the result with a worked step.",
  },
  {
    question: "How do I calculate my BMI in kg and cm?",
    answer:
      "Use BMI = weight in kg ÷ (height in cm ÷ 100)². Convert height from centimetres to metres by dividing by 100, square that value, then divide weight by it. Example: 70 kg and 175 cm → 175 ÷ 100 = 1.75 m, 1.75² = 3.0625, 70 ÷ 3.0625 ≈ 22.9.",
  },
  {
    question: "What is a healthy BMI range?",

    answer:
      "For adults, the WHO normal-weight category is a BMI of 18.5 to 24.9. This tool also shows the weight range that corresponds to 18.5–24.9 for your height. BMI is only a screening measure; a healthcare professional can interpret it alongside other factors.",
  },
  {
    question: "Is BMI different for men and women?",
    answer:
      "The BMI formula is the same for men and women. Adult WHO categories also use the same cut-offs for both. That is why this calculator has no sex field — sex does not change the BMI number or the standard adult category thresholds.",
  },
  {
    question: "Is BMI accurate for athletes or muscular people?",
    answer:
      "Not always. BMI does not measure body fat directly. People with high muscle mass can have a higher BMI without high body fat, so the category may overestimate risk. Use BMI as one screening input and discuss results with a healthcare professional.",
  },
  {
    question: "Does BMI work for children and teenagers?",
    answer:
      "No. For children and teens under 20, BMI is interpreted with age- and sex-specific percentiles, not the adult categories used here. This calculator does not provide pediatric percentiles — ask a doctor or pediatric clinician.",
  },
  {
    question: "What BMI cut-offs are used for Asian populations?",
    answer:
      "A WHO expert consultation described public-health action points often applied as overweight from 23.0 and obesity from 27.5 for many Asian populations, while retaining WHO’s international categories. Individual countries and organizations may use slightly different cut-offs. Choose “Asian cut-offs” in the calculator for this alternative guideline.",
  },
  {
    question: "Does BMI apply during pregnancy or for older adults?",
    answer:
      "BMI is less reliable in pregnancy and can be harder to interpret for older adults because body composition changes with age. Do not use this tool to make health decisions in those situations — speak with a qualified healthcare professional.",
  },
  {
    question: "What are the limitations of BMI?",
    answer:
      "BMI does not measure body fat, fat distribution, muscle mass, bone density, or metabolic health. It can misclassify muscular athletes, overlook risks linked to waist circumference, and is not designed as a diagnosis. It is a quick screening number, not a full health assessment.",
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
  name: "BMI Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "HealthApplication",
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
      name: "Health & Fitness",
      item: `${SITE_URL}/health`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "BMI Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function BmiCalculatorPage() {
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
          theme="health"
          items={[
            { label: "Home", href: "/" },
            { label: "Health & Fitness", href: "/health" },
            { label: "BMI Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Activity className="size-4.5" aria-hidden="true" />
            Body mass index for adults
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            BMI Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Calculate body mass index from height and weight. Metric (kg, cm) is
            selected by default and shown first in the form. The calculator also
            supports pounds, feet and inches. See WHO adult categories, an
            optional Asian cut-offs guideline, and the weight range for a BMI of
            18.5 to 24.9.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            BMI = weight in kg ÷ (height in metres)². For example, 70 kg and 175
            cm gives a BMI of 22.9.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <BmiCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the BMI Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Height and weight only — the adult BMI formula does not need age
                or sex.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Metric (cm, kg) or Imperial (ft, in, lb). Switching units
                converts values you already entered.
              </li>
              <li>
                Enter height and weight. Results update live — no submit button.
              </li>
              <li>
                Read your BMI to one decimal place, the category label, and the
                labeled scale marker.
              </li>
              <li>
                Optionally switch to Asian cut-offs if that guideline is relevant
                for you; Standard (WHO) remains the default.
              </li>
            </ol>
          </section>

          <section aria-labelledby="bmi-kg-cm-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="bmi-kg-cm-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to calculate your BMI in kg and cm
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Use your weight in kilograms and your height in centimetres, then
                convert height to metres before dividing.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Convert height from cm to metres by dividing by 100 (for example,
                175 cm ÷ 100 = 1.75 m).
              </li>
              <li>Square that height in metres (1.75 × 1.75 = 3.0625).</li>
              <li>
                Divide weight in kg by that squared height (70 ÷ 3.0625 ≈ 22.9).
              </li>
            </ol>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              Worked example: 70 kg and 175 cm → BMI = 70 ÷ (1.75)² = 70 ÷ 3.0625
              ≈ 22.9. Enter the same figures above with Metric (cm, kg) selected
              to see the category and healthy weight range for that height.
            </p>
          </section>

          <section aria-labelledby="how-bmi-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-bmi-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How BMI Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Body mass index is a ratio of weight to height squared. The metric
                steps above use kilograms and metres; imperial units use a
                conversion factor so the result matches.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                <strong className="font-semibold text-foreground">
                  Imperial:
                </strong>{" "}
                BMI = 703 × weight (lb) ÷ [height (in)]². The factor 703 converts
                the pound–inch system so the result matches the metric definition.
                Switch to Imperial (ft, lb) in the form if you prefer those units.
              </p>
            </div>
          </section>

          <section aria-labelledby="bmi-categories-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="bmi-categories-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                BMI Categories
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Adult categories used by this calculator. Cut-offs can vary
                between organizations and countries.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[40rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  WHO adult BMI categories and Asian cut-off guidelines
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Standard (WHO) BMI
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Asian cut-offs BMI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Underweight
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      Less than 18.5
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      Less than 18.5
                    </td>
                  </tr>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Normal weight
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      18.5 – 24.9
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      18.5 – 22.9
                    </td>
                  </tr>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Overweight
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      25.0 – 29.9
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      23.0 – 27.4
                    </td>
                  </tr>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Obesity (class I)
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      30.0 – 34.9
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      Obesity from 27.5 (single band in this guideline)
                    </td>
                  </tr>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Obesity (class II)
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      35.0 – 39.9
                    </td>
                    <td className="px-4 py-3 text-zinc-600">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Obesity (class III)
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      40.0 or above
                    </td>
                    <td className="px-4 py-3 text-zinc-600">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-zinc-600">
              Asian cut-offs follow commonly cited public-health action points
              (23.0 and 27.5). National guidelines may differ.
            </p>
          </section>

          <section aria-labelledby="limitations-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limitations-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What BMI Can and Cannot Tell You
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                BMI is a screening tool, not a complete picture of health.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                BMI estimates weight relative to height. It is widely used because
                it is simple and does not require specialized equipment. Public
                health agencies use category bands to describe populations, and
                clinicians may use BMI as one of several screening inputs.
              </p>
              <p>
                BMI does not measure body fat directly. It does not show where fat
                is stored (for example around the waist), and it can be misleading
                for athletes with high muscle mass, for some older adults, and
                during pregnancy. It also does not replace blood pressure, blood
                tests, waist circumference, or a full clinical history.
              </p>
              <p>
                For any decision about your health, talk to a qualified healthcare
                professional. This page does not diagnose conditions or recommend
                diets, calorie targets, or weight-change plans.
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
                Healthy BMI range, men vs women, athletes, children, and Asian
                cut-offs.
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
              Adult BMI categories:{" "}
              <a
                href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                CDC — Adult BMI Categories
              </a>
              . Obesity and overweight overview:{" "}
              <a
                href="https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                WHO — Obesity and overweight fact sheet
              </a>
              . Asian public-health action points (23.0 / 27.5) are described in
              the WHO expert consultation published in The Lancet (2004).
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and is not medical
              advice or a diagnosis. Talk to a qualified healthcare professional
              about your health.
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
                Convert units, check age, or run everyday percent math.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Convert kg/lb, cm/ft, and other everyday units
                </span>
              </Link>
              <Link
                href="/health/calorie-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Calorie Calculator
                </span>
                <span className="text-sm text-muted">
                  TDEE, BMR, and maintenance calorie estimates
                </span>
              </Link>
              <Link
                href="/date-time/age-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Age Calculator
                </span>
                <span className="text-sm text-muted">
                  Exact years, months, and days from a date of birth
                </span>
              </Link>
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and more
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
