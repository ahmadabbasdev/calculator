import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Flag } from "lucide-react";
import { RaceTimePredictor } from "@/components/calculators/RaceTimePredictor";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { formatDuration } from "@/lib/utils/pace";
import {
  DEFAULT_RIEGEL_EXPONENT,
  predictRaceTime,
} from "@/lib/utils/race-predictor";

const PAGE_PATH = "/health/race-time-predictor";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Race Time Predictor — Equivalent Race Times";
const PAGE_DESCRIPTION =
  "Predict equivalent race times from a recent finish using Peter Riegel’s formula. Compare 5K, 10K, half marathon, marathon and more — free, in your browser.";

const EXAMPLE_10K = predictRaceTime(1500, 5, 10, DEFAULT_RIEGEL_EXPONENT);
const EXAMPLE_MARATHON = predictRaceTime(
  1500,
  5,
  42.195,
  DEFAULT_RIEGEL_EXPONENT,
);

export const FAQ_ITEMS = [
  {
    question: "How does this race time predictor work?",
    answer: `It applies Peter Riegel’s one-exponent model: T₂ = T₁ × (D₂ ÷ D₁)^e. Enter a recent race distance and finish time. With the default exponent ${DEFAULT_RIEGEL_EXPONENT}, a 25:00 5K predicts about ${formatDuration(EXAMPLE_10K)} for 10K.`,
  },
  {
    question: "What is Peter Riegel’s formula?",
    answer: `T₂ = T₁ × (D₂ ÷ D₁)^e, where T₁ and D₁ are your known race time and distance, T₂ and D₂ are the predicted time and target distance, and e is an exponent (default ${DEFAULT_RIEGEL_EXPONENT}). Same distance returns the same time exactly.`,
  },
  {
    question: "Can I predict my marathon time from a 5K?",
    answer: `Yes — enter your 5K time and read the marathon row. A 25:00 5K predicts about ${formatDuration(EXAMPLE_MARATHON)} at the default exponent. Predictions get less reliable the farther the target is from the race you ran.`,
  },
  {
    question: "Why change the exponent under More options?",
    answer: `${DEFAULT_RIEGEL_EXPONENT} is a common public default for this formula, not a personal constant. Values from 1.00 to 1.15 are allowed. Exponent 1.00 is pure pace scaling (a 25:00 5K becomes a 50:00 10K).`,
  },
  {
    question: "How is this different from a pace calculator?",
    answer:
      "A pace calculator converts distance and time into pace or speed for the same outing. This page estimates equivalent finish times at other distances using Riegel’s power law. For pace, splits, and speed conversion, use the Pace Calculator.",
  },
  {
    question: "Why might my real race differ from the table?",
    answer:
      "Course hills, weather, pacing mistakes, training specificity, and fatigue all move real times. The model only scales one past result. It does not know your fitness block or race-day conditions.",
  },
  {
    question: "Does this give training advice or a race plan?",
    answer:
      "No. It only shows mathematical equivalent times from one finish. It is not coaching, medical advice, or a training plan.",
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
  name: "Race Time Predictor",
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
      name: "Race Time Predictor",
      item: CANONICAL_URL,
    },
  ],
};

export default function RaceTimePredictorPage() {
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
            { label: "Race Time Predictor" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Flag className="size-4.5" aria-hidden="true" />
            Equivalent race times
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Race Time Predictor
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate finish times at other distances from one recent race using
            Peter Riegel’s formula. For pace from distance and time, use the{" "}
            <Link
              href="/health/pace-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Pace Calculator
            </Link>
            ; for finish-time charts and goal splits, the{" "}
            <Link
              href="/health/pace-chart"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Pace Chart &amp; Splits Calculator
            </Link>
            ; for clock spans between two times, the{" "}
            <Link
              href="/date-time/time-duration-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Time Duration Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <RaceTimePredictor />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Race Time Predictor
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                One recent finish is enough. Results update as you type.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose a race preset (1 mile through marathon) or enter a custom
                distance in km or miles.
              </li>
              <li>Enter your finish time as hours, minutes, and seconds.</li>
              <li>
                Read the table of predicted times with pace per km and per mile.
                Optionally open More options to change the exponent or add a
                custom target distance.
              </li>
            </ol>
          </section>

          <section aria-labelledby="what-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="what-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What a Race Predictor Is
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A race predictor estimates how a finish at one distance might
                scale to another. It is a mathematical comparison of past
                performances, not a forecast of what you will run next weekend.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Runners often ask what a 5K implies for a 10K or half marathon.
                This tool answers that question with a single published power-law
                model. It does not invent training load, VO₂ figures, or accuracy
                percentages.
              </p>
            </div>
          </section>

          <section aria-labelledby="formula-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="formula-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Formula (Peter Riegel)
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                T₂ = T₁ × (D₂ ÷ D₁)^e, with e = {DEFAULT_RIEGEL_EXPONENT} by
                default.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Worked example: a 5 km race in 25:00 is T₁ = 1,500 seconds and D₁
                = 5. For a 10 km target, T₂ = 1,500 × (10 ÷ 5)^
                {DEFAULT_RIEGEL_EXPONENT} ≈{" "}
                {formatDuration(EXAMPLE_10K)}. For a marathon (42.195 km), the
                same 5K predicts about {formatDuration(EXAMPLE_MARATHON)}. Times
                display to the nearest second with correct carry.
              </p>
              <p>
                The model is credited to Peter Riegel, who published on race-time
                prediction in the late 1970s and expanded the endurance analysis
                in American Scientist (1981). A public overview of his work and
                the familiar form of the formula is on{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Peter_Riegel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Wikipedia — Peter Riegel
                </a>
                . Confirmed loading for this page:{" "}
                <span className="tabular-nums">
                  https://en.wikipedia.org/wiki/Peter_Riegel
                </span>
                .
              </p>
            </div>
          </section>

          <section aria-labelledby="reliability-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="reliability-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why Longer Distances Are Harder to Predict
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Scaling a short race a long way multiplies any mismatch between
                the model and your current fitness.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                A 5K-to-10K jump stays near the same event family. A 5K-to-marathon
                jump assumes the same endurance shape holds across many times
                longer. Fueling, muscle damage, and heat matter more as the clock
                grows. Treat distant rows as rough comparisons, not targets you
                must hit.
              </p>
            </div>
          </section>

          <section aria-labelledby="real-race-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="real-race-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Affects Real Race Times
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The table ignores the day-to-day factors that move finish times.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Course profile — hills, turns, and surface</li>
              <li>Weather — heat, humidity, wind, and cold</li>
              <li>Pacing — even splits versus early surges</li>
              <li>Training — how prepared you are for that distance</li>
              <li>Fatigue and illness on race day</li>
            </ul>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              For converting a known distance and time into pace or speed without
              predicting another race, use the{" "}
              <a
                href="/health/pace-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Pace Calculator
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Do
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Equivalent times only — no coaching and no health claims.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>No training plans, workouts, or taper schedules</li>
              <li>No claimed accuracy percentages or “guaranteed” times</li>
              <li>No medical advice or fitness diagnoses</li>
              <li>
                No pace charts or step conversions — use the{" "}
                <a
                  href="/health/pace-chart"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Pace Chart &amp; Splits Calculator
                </a>{" "}
                or{" "}
                <a
                  href="/health/steps-to-distance-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Steps to Distance Calculator
                </a>
              </li>
            </ul>
          </section>

          <section aria-labelledby="faq-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-3xl divide-y divide-border border-y border-border">
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

          <section aria-labelledby="disclaimer-heading" className="max-w-3xl">
            <h2
              id="disclaimer-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Disclaimer
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              Predicted times are estimates for general information. They are not
              coaching advice or medical advice. Your inputs stay in the browser
              and are not stored by CalcDaily.
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
                Pace conversion, race pace charts, and clock durations.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/health/pace-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Calculator
                </span>
                <span className="text-sm text-muted">
                  Find pace, time, distance, or convert min/km and min/mile
                </span>
              </a>
              <a
                href="/health/pace-chart"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Chart &amp; Splits Calculator
                </span>
                <span className="text-sm text-muted">
                  Marathon to 5K charts and goal-time splits
                </span>
              </a>
              <a
                href="/date-time/time-duration-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Time Duration Calculator
                </span>
                <span className="text-sm text-muted">
                  Hours between clock times, add/subtract time, and timecards
                </span>
              </a>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
