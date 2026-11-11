import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Footprints } from "lucide-react";
import { StepsToDistanceCalculator } from "@/components/calculators/StepsToDistanceCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  CM_PER_INCH,
  METERS_PER_MILE,
  buildStepsReferenceTable,
  calculateSteps,
  formatWalkTime,
} from "@/lib/utils/steps";

const PAGE_PATH = "/health/steps-to-distance-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Steps to Distance Calculator — km & Miles";
const PAGE_DESCRIPTION =
  "Convert steps to km, miles, meters, and feet — or distance back to steps. Estimate walk time from cadence. Free results stay in your browser — no signup.";

const REF = buildStepsReferenceTable();
const EXAMPLE_10K = calculateSteps({
  mode: "steps-to-distance",
  steps: 10000,
  stepLength: 76.2,
  stepLengthUnit: "cm",
  stepLengthMode: "known",
});
const EXAMPLE_MILE = calculateSteps({
  mode: "distance-to-steps",
  distance: 1,
  distanceUnit: "miles",
  stepLength: 76.2,
  stepLengthUnit: "cm",
  stepLengthMode: "known",
});
const EXAMPLE_KM = calculateSteps({
  mode: "distance-to-steps",
  distance: 1,
  distanceUnit: "km",
  stepLength: 76.2,
  stepLengthUnit: "cm",
  stepLengthMode: "known",
});
const EXAMPLE_TIME = calculateSteps({
  mode: "time-to-walk",
  steps: 10000,
  cadence: 100,
  stepLength: 76.2,
  stepLengthUnit: "cm",
  stepLengthMode: "known",
});

export const FAQ_ITEMS = [
  {
    question: "How many km is 10,000 steps?",
    answer: EXAMPLE_10K.ok
      ? `It depends on your step length. At 76.2 cm per step, 10,000 steps are ${EXAMPLE_10K.meters.toLocaleString("en-US")} m, or ${EXAMPLE_10K.km.toFixed(2)} km (about ${EXAMPLE_10K.miles.toFixed(2)} miles). Shorter steps cover less distance; longer steps cover more.`
      : "It depends on your step length. Enter your steps and step length above to see km and miles.",
  },
  {
    question: "How many steps are in a mile?",
    answer: EXAMPLE_MILE.ok
      ? `At 76.2 cm per step, one mile (${METERS_PER_MILE} m) is ${EXAMPLE_MILE.steps.toLocaleString("en-US")} steps. The calculator rounds to the nearest whole step. Change the step length to match your walk.`
      : "Enter one mile and your step length in Distance to steps to see the count.",
  },
  {
    question: "How many steps are in a kilometre?",
    answer: EXAMPLE_KM.ok
      ? `At 76.2 cm per step, one kilometre is about ${EXAMPLE_KM.steps.toLocaleString("en-US")} steps. With a 70 cm step, the same kilometre is about 1,429 steps.`
      : "Enter 1 km and your step length in Distance to steps to see the count.",
  },
  {
    question: "How long does it take to walk 10,000 steps?",
    answer: EXAMPLE_TIME.ok
      ? `Time = steps ÷ cadence. At 100 steps per minute, 10,000 steps take ${formatWalkTime(EXAMPLE_TIME.totalMinutes!)}. A slower cadence takes longer; a quicker one finishes sooner. 100 spm is only an example default.`
      : "Enter steps and cadence in Time to walk to see hours and minutes.",
  },
  {
    question: "Is 10,000 steps a required daily goal?",
    answer:
      "No. 10,000 is a commonly used round number for counting steps, not a personal requirement. How much activity suits you depends on your situation — a healthcare professional can advise on activity levels.",
  },
  {
    question: "How do I measure my step length?",
    answer:
      "Take 10 normal walking steps in a straight line, measure the total distance from the first push-off to the tenth landing, then divide by 10. Enter that average as your step length. You can also estimate from height × a percentage (default 41.5%), which is only a rough rule of thumb.",
  },
  {
    question: "Why do phones and pedometers disagree on steps?",
    answer:
      "Devices use different sensors, filters, and arm or pocket motion models. Some count every oscillation; others ignore short movements. Wrist watches, phones in a bag, and hip pedometers often disagree on the same walk. This calculator uses the step count and step length you enter — it does not read a device.",
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
  name: "Steps to Distance Calculator",
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
      name: "Steps to Distance Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function StepsToDistanceCalculatorPage() {
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
            { label: "Steps to Distance Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Footprints className="size-4.5" aria-hidden="true" />
            Steps, distance, and walk time
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Steps to Distance Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Convert a step count into kilometres, miles, metres, and feet — or
            turn a distance into steps. Optionally estimate how long a walk
            takes from cadence. For running pace, use the{" "}
            <Link
              href="/health/pace-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Pace Calculator
            </Link>
            ; for length units alone, the{" "}
            <Link
              href="/math/unit-converter"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Unit Converter
            </Link>
            ; for clock durations, the{" "}
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

        <StepsToDistanceCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use This Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Three modes cover steps to distance, distance to steps, and walk
                time. Results update as you type.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Steps to distance, Distance to steps, or Time to walk.
              </li>
              <li>
                Set your step length directly (cm or inches) or estimate it from
                height × a percentage. Use a preset such as 76.2 cm if you want
                a common example.
              </li>
              <li>
                Enter steps, distance, or cadence. Read the primary result, the
                other units, and the one-line worked step.
              </li>
            </ol>
          </section>

          <section aria-labelledby="convert-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="convert-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Steps Convert to Distance
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Distance in metres equals steps multiplied by step length in
                metres. One international mile is exactly {METERS_PER_MILE} m;
                one inch is exactly {CM_PER_INCH} cm.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Worked example: 10,000 steps at 76.2 cm (0.762 m) each cover{" "}
                {EXAMPLE_10K.ok
                  ? `${EXAMPLE_10K.meters.toLocaleString("en-US")} m = ${EXAMPLE_10K.km.toFixed(2)} km ≈ ${EXAMPLE_10K.miles.toFixed(2)} miles (${EXAMPLE_10K.feet.toLocaleString("en-US")} ft)`
                  : "7,620 m"}
                . Going the other way, steps = distance ÷ step length, rounded to
                the nearest whole step — so one mile at 76.2 cm is{" "}
                {EXAMPLE_MILE.ok ? EXAMPLE_MILE.steps.toLocaleString("en-US") : "2,112"}{" "}
                steps.
              </p>
            </div>
          </section>

          <section aria-labelledby="reference-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="reference-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Steps to Distance Reference
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Values below are generated from the same conversion functions as
                the calculator — not typed by hand.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl min-w-[28rem] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Steps
                    </th>
                    {REF.stepLengthsCm.map((cm) => (
                      <th
                        key={cm}
                        scope="col"
                        className="py-2 pr-3 font-semibold tabular-nums"
                      >
                        {cm} cm
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REF.stepCounts.map((steps) => (
                    <tr
                      key={steps}
                      className="border-b border-border/60 text-foreground"
                    >
                      <th
                        scope="row"
                        className="py-2.5 pr-3 text-left font-semibold tabular-nums"
                      >
                        {steps.toLocaleString("en-US")}
                      </th>
                      {REF.stepLengthsCm.map((cm) => {
                        const row = REF.rows.find(
                          (r) => r.steps === steps && r.stepLengthCm === cm,
                        )!;
                        return (
                          <td
                            key={`${steps}-${cm}`}
                            className="py-2.5 pr-3 tabular-nums text-muted"
                          >
                            {row.km} km
                            <span className="block text-[12px]">
                              {row.miles} mi
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="measure-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="measure-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Measure Your Step Length
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A measured average beats a height estimate when you care about
                accuracy.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Mark a start point and walk 10 normal steps in a straight line.</li>
              <li>
                Measure the distance from the first push-off mark to where the
                tenth step lands.
              </li>
              <li>Divide that distance by 10 and enter the result as step length.</li>
            </ol>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              Height × 41.5% (editable) is only a rough rule of thumb. Real step
              length changes with speed, fatigue, shoes, and terrain.
            </p>
          </section>

          <section aria-labelledby="devices-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="devices-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why Phones, Watches, and Pedometers Disagree
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Step counters infer motion from sensors. Different placements and
                algorithms produce different totals for the same outing.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                A phone in a bag, a wrist watch, and a hip clip do not feel the
                same motion. Filters that drop “non-walking” movement also differ.
                Use this page to convert whatever count you already have — it does
                not sync with a device.
              </p>
            </div>
          </section>

          <section aria-labelledby="stride-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="stride-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Walking Versus Running Stride
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Running strides are usually longer than walking steps at the same
                height. If you mix walking and running, one fixed step length is
                only an average for the whole outing.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                For pace and finish times on a known course distance, use the{" "}
                <a
                  href="/health/pace-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Pace Calculator
                </a>
                . For converting metres and miles without steps, use the{" "}
                <a
                  href="/math/unit-converter"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Unit Converter
                </a>
                .
              </p>
            </div>
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
                Distance math only — no calories, goals, or health advice.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>No calorie burn or weight-loss estimates</li>
              <li>No daily step targets or comparisons to “goals”</li>
              <li>No medical, coaching, or fitness prescriptions</li>
              <li>
                No device sync — enter the numbers you already have from a watch
                or counter
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
              This page provides general information about converting steps,
              distance, and walk time. It is not medical advice. Your inputs stay
              in the browser and are not stored by CalcDaily.
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
                Pace, length units, and clock durations.
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
                  Running and walking pace, speed, and race splits
                </span>
              </a>
              <a
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Convert length, mass, and other everyday units
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
