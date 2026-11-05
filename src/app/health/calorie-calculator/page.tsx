import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Flame } from "lucide-react";
import { CalorieCalculator } from "@/components/calculators/CalorieCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { ACTIVITY_LEVELS, SAFETY_FLOORS } from "@/lib/utils/calories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/health/calorie-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Calorie Calculator - TDEE & BMR (Maintenance Calories)";
const PAGE_DESCRIPTION =
  "Free calorie calculator for TDEE, BMR, and maintenance calories. Metric or imperial units with activity levels — estimates that run in your browser.";

export const FAQ_ITEMS = [
  {
    question: "How many calories should I eat a day?",
    answer:
      "It depends on your age, sex, height, weight, and how active you are. This calorie calculator estimates maintenance calories (TDEE) from your basal metabolic rate and activity level. Treat the number as a starting point, not an exact prescription, and adjust with guidance from a healthcare professional if needed.",
  },
  {
    question: "What is the difference between BMR and TDEE?",
    answer:
      "BMR (basal metabolic rate) estimates the energy your body uses at rest. TDEE (total daily energy expenditure) multiplies BMR by an activity factor to estimate the energy you use across a typical day, including movement and exercise. Maintenance calories on this page are your estimated TDEE.",
  },
  {
    question: "What are maintenance calories?",
    answer:
      "Maintenance calories are an estimate of how much energy you need each day to keep your current weight roughly steady, assuming your activity stays similar. Eating notably more or less than that estimate over time can change weight for many people, but individual responses vary.",
  },
  {
    question: "Which activity level should I choose?",
    answer:
      "Pick the description that best matches a typical week. If you are unsure, choose the lower option — people often overestimate how active they are. You can also compare estimated maintenance calories across all activity levels in the results table.",
  },
  {
    question: "How accurate is the Mifflin-St Jeor equation?",
    answer:
      "Mifflin–St Jeor is a widely used population equation for resting energy needs. Studies suggest many people’s measured resting values fall within roughly 10% of the prediction, but body composition, genetics, medications, health conditions, and daily movement still cause real-world differences. Use the result as an estimate to refine over time.",
  },
  {
    question: "Why does this calculator ask for sex?",
    answer:
      "The Mifflin–St Jeor equation uses different constants for the male and female formulas (plus 5 versus minus 161). That is why the field is labeled “Sex used in the formula” — it changes the math, not a social category beyond the equation’s design.",
  },
  {
    question:
      "Can I use this calculator if I am pregnant, breastfeeding, under 18, or have a medical condition?",
    answer:
      "No. This tool is for adults aged 18 and over and is not intended for pregnancy, breastfeeding, or people whose metabolism is affected by a medical condition. Please ask a healthcare professional or registered dietitian for personal guidance.",
  },
  {
    question: "Is it safe to eat below the estimated calories?",
    answer: `Very low daily intakes are generally not recommended without medical supervision. This calculator will not show a goal estimate below ${SAFETY_FLOORS.female.toLocaleString("en-US")} kcal/day for the Female formula setting or ${SAFETY_FLOORS.male.toLocaleString("en-US")} kcal/day for the Male setting. If you have questions about energy intake, talk to a doctor or registered dietitian.`,
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
  name: "Calorie Calculator",
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
      name: "Calorie Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function CalorieCalculatorPage() {
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
            { label: "Calorie Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Flame className="size-4.5" aria-hidden="true" />
            Daily calorie, TDEE &amp; BMR estimate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Calorie Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate how many calories you may need each day to maintain your
            current weight. See basal metabolic rate (BMR), total daily energy
            expenditure (TDEE), and maintenance calories using metric or
            imperial units.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <CalorieCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Calorie Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A short path from your stats to an estimated daily energy need.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Metric (cm, kg) or Imperial (ft, in, lb). Switching units
                converts values you already entered.
              </li>
              <li>
                Select the sex used in the formula, then enter age, height, and
                weight.
              </li>
              <li>
                Pick an activity level that matches a typical week. Results
                update live — no submit button.
              </li>
              <li>
                Read estimated maintenance calories (TDEE), BMR, and the
                comparison table. Optionally open “Adjusting for a goal” for a
                gradual range with safety floors.
              </li>
            </ol>
          </section>

          <section aria-labelledby="bmr-tdee-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="bmr-tdee-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                BMR vs. TDEE
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two related estimates — rest versus a full day of activity.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                <strong className="font-semibold text-foreground">BMR</strong>{" "}
                (basal metabolic rate) estimates the energy your body uses at
                rest to support basic functions. It is the foundation of most
                daily calorie calculators.
              </p>
              <p>
                <strong className="font-semibold text-foreground">TDEE</strong>{" "}
                (total daily energy expenditure) multiplies BMR by an activity
                factor so the estimate includes everyday movement and exercise.
                The large number on this page — estimated maintenance calories —
                is your TDEE for the activity level you selected.
              </p>
            </div>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Your Calorie Needs Are Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                This tool uses the Mifflin–St Jeor equation, then applies an
                activity multiplier.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                <strong className="font-semibold text-foreground">Male:</strong>{" "}
                BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5
              </p>
              <p>
                <strong className="font-semibold text-foreground">
                  Female:
                </strong>{" "}
                BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age − 161
              </p>
              <p>
                Then TDEE = BMR × activity multiplier. Example: a 30-year-old
                using the male formula at 70 kg and 175 cm has BMR ≈ 1,649
                kcal/day; at moderate activity (×1.55) TDEE ≈ 2,560 kcal/day
                when rounded to the nearest 10.
              </p>
            </div>
            <div className="mt-6 overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[28rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Activity level multipliers used for TDEE
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3">
                      Activity level
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Multiplier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY_LEVELS.map((level) => (
                    <tr
                      key={level.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3 text-zinc-800">
                        <span className="font-medium text-foreground">
                          {level.label}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-zinc-600">
                          {level.description}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                        ×{level.multiplier}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="accuracy-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="accuracy-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Accurate Is This Estimate?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Honest limits of a population-based calorie calculator.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Equations like Mifflin–St Jeor describe average patterns across
                large groups. Your real needs can differ because of body
                composition, genetics, medications, health conditions, sleep, and
                how much you move outside formal exercise.
              </p>
              <p>
                The best use of a daily calorie calculator is as a starting
                point. Notice how you feel and what changes over time, and talk
                with a healthcare professional or registered dietitian before
                making large changes — especially if you have a medical
                condition, are pregnant or breastfeeding, or are under 18.
              </p>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Maintenance calories, BMR vs TDEE, activity levels, and safety.
              </p>
            </div>
            <div className="max-w-3xl divide-y divide-border/80">
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
              Mifflin–St Jeor equation:{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Mifflin et al., Am J Clin Nutr (1990) on PubMed
              </a>
              . General information on calories and average daily energy needs:{" "}
              <a
                href="https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/understanding-calories/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                NHS — Understanding calories
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and is not medical or
              nutritional advice. Talk to a qualified healthcare professional or
              registered dietitian about your diet.
            </p>
            <p className="mt-2 text-[12px] text-zinc-600">
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
                BMI screening, unit conversion, age, and everyday percent math.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/health/bmi-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BMI Calculator
                </span>
                <span className="text-sm text-muted">
                  Body mass index from height and weight
                </span>
              </Link>
              <Link
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Convert kg/lb, cm/ft, and other units
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
