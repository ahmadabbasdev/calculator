import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Timer } from "lucide-react";
import { PaceCalculator } from "@/components/calculators/PaceCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  KM_PER_MILE,
  RACE_PRESETS,
  buildCommonPaceTable,
  formatPace,
  kmToMiles,
} from "@/lib/utils/pace";

const PAGE_PATH = "/health/pace-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Pace Calculator — min/km, min/mile & Speed";
const PAGE_DESCRIPTION =
  "Free running and walking pace calculator. Convert min/km and min/mile, find time or distance, and see km/h and mph. For race charts, use Pace Chart & Splits.";

const COMMON_PACE_ROWS = buildCommonPaceTable();

const RACE_DISTANCE_ROWS = RACE_PRESETS.map((preset) => ({
  name: preset.label,
  km: preset.km,
  miles: kmToMiles(preset.km),
}));

export const FAQ_ITEMS = [
  {
    question: "How do I convert min per km to min per mile?",
    answer:
      "Multiply minutes per kilometre by 1.609344 (the exact length of one international mile in kilometres). Example: 5:00 per km is 300 seconds × 1.609344 = 482.8032 seconds per mile, which displays as 8:03 per mile when rounded to the nearest second.",
  },
  {
    question: "How many minutes are in a mile at X pace?",
    answer:
      "Enter your pace in the Convert tab (or Find pace after a known distance and time). At 5:00 per km, one mile takes about 8:03. At 6:00 per km, one mile takes about 9:39. Use min/mile directly if that is how you train.",
  },
  {
    question: "How fast is a 20-minute mile?",
    answer:
      "A 20:00 mile is 20 minutes per mile. That converts to about 12:26 per km, 3.00 mph, and 4.83 km/h. Many people treat that range as a steady walking pace; exact feel still depends on terrain and fitness.",
  },
  {
    question: "What is the difference between pace and speed?",
    answer:
      "Pace is time per unit of distance (for example minutes per kilometre or per mile). Speed is distance per unit of time (km/h or mph). They describe the same movement in inverse units: faster speed means a lower (quicker) pace number.",
  },
  {
    question: "How do I find marathon or 5K pace from a finish time?",
    answer:
      "Open Find pace, choose a race preset (5K, 10K, half marathon, or marathon) or type the distance, then enter your finish time as hours, minutes, and seconds. The calculator shows pace per km and per mile plus km/h and mph.",
  },
  {
    question: "Why do GPS watches and race courses disagree?",
    answer:
      "GPS traces can cut corners, drift under trees or tall buildings, and sample position only every second or two. Certified road courses are measured along a defined path with a calibrated wheel. Small path differences add up over long races, so watch distance and official distance are often not identical.",
  },
  {
    question: "Does this calculator give training plans or race predictions?",
    answer:
      "No. It only converts distance, time, pace, and speed, and builds even-split tables from the numbers you enter. It does not predict race times, prescribe workouts, estimate calories, or give medical or coaching advice.",
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
  name: "Pace Calculator",
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
      name: "Pace Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function PaceCalculatorPage() {
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
            { label: "Pace Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Timer className="size-4.5" aria-hidden="true" />
            Running and walking pace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pace Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Find running or walking pace from distance and time, solve for finish
            time or distance, or convert min/km, min/mile, km/h, and mph. Includes
            race presets and a splits table. For full race pace charts and
            goal-time splits, use the{" "}
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
            ; for general length units, the{" "}
            <Link
              href="/math/unit-converter"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Unit Converter
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <PaceCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Pace Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Four modes cover the usual pace questions. Results update as you
                type — nothing is sent to a server.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Find pace, Find time, Find distance, or Convert pace or
                speed.
              </li>
              <li>
                Enter distance (with km, miles, or meters, or a race preset),
                time as hours/minutes/seconds, or pace as minutes and seconds
                with a min/km or min/mile toggle.
              </li>
              <li>
                Read pace, speed, total time, or distance, plus a one-line worked
                step. Optionally switch splits between per kilometre and per
                mile.
              </li>
            </ol>
          </section>

          <section aria-labelledby="pace-speed-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="pace-speed-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Pace and Speed Mean
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Pace answers “how long does each kilometre or mile take?” Speed
                answers “how far do I cover each hour?” Runners and walkers often
                talk in pace; treadmills and road signs often show speed.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                This tool works internally in seconds so conversions stay exact
                until display. Pace is rounded to the nearest second (half up)
                with correct carry — 5:59.6 shows as 6:00, never 5:60. Speed is
                shown to two decimal places for km/h and mph.
              </p>
              <p>
                Example: 5 km in 25:00 is 300 seconds per kilometre (5:00/km).
                Speed is 3600 ÷ 300 = 12.00 km/h, or about 7.46 mph. The same
                effort is 8:03 per mile after applying the mile factor below.
              </p>
            </div>
          </section>

          <section aria-labelledby="convert-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="convert-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Converting min/km and min/mile
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                One international mile is exactly {KM_PER_MILE} kilometres. That
                single factor links every pace and speed pair on this page.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Minutes per mile = minutes per kilometre × {KM_PER_MILE}. Minutes
                per kilometre = minutes per mile ÷ {KM_PER_MILE}. In speed form,
                km/h = 3600 ÷ seconds per kilometre, and mph = km/h ÷{" "}
                {KM_PER_MILE}.
              </p>
              <p>
                Worked example: 8:00 per mile is 480 seconds per mile. Seconds per
                kilometre = 480 ÷ {KM_PER_MILE} ≈ 298.26, which displays as{" "}
                {formatPace(480 / KM_PER_MILE)} per km. The matching speeds are
                7.50 mph and about 12.07 km/h. Use Convert pace or speed to enter
                any one unit and see all four at once.
              </p>
            </div>
          </section>

          <section aria-labelledby="race-distances-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="race-distances-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Standard Race Distances
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Presets in the calculator use these kilometre values. Miles are
                derived with the same exact factor.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[20rem] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Distance
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold tabular-nums">
                      Kilometres
                    </th>
                    <th scope="col" className="py-2 font-semibold tabular-nums">
                      Miles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RACE_DISTANCE_ROWS.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-border/60 text-foreground"
                    >
                      <td className="py-2.5 pr-4">{row.name}</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {row.km.toFixed(row.km % 1 === 0 ? 0 : 4)}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {row.miles.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="common-paces-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="common-paces-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Common Pace Reference
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Values below are generated from the same conversion functions as
                the calculator — not typed by hand — so display rounding matches
                what you see in the tool.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[22rem] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      min/km
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      min/mile
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      km/h
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      mph
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMMON_PACE_ROWS.map((row) => (
                    <tr
                      key={row.minPerKm}
                      className="border-b border-border/60 text-foreground tabular-nums"
                    >
                      <td className="py-2.5 pr-3">{row.minPerKm}</td>
                      <td className="py-2.5 pr-3">{row.minPerMile}</td>
                      <td className="py-2.5 pr-3">{row.kmh}</td>
                      <td className="py-2.5">{row.mph}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="walking-treadmill-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="walking-treadmill-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Walking and Treadmill Notes
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The same math applies to walking and treadmill sessions. Enter
                the distance and time you actually covered, or convert the
                treadmill&apos;s km/h or mph readout in Convert pace or speed.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Treadmill belts report speed; many outdoor apps report pace. A
                displayed 6.0 km/h is exactly 6:00 per km. Incline, soft surfaces,
                and stop-start walking change effort without changing the
                arithmetic of average pace for a completed segment.
              </p>
              <p>
                If you need the elapsed clock time between a start and end clock
                reading rather than pace for a distance, use the{" "}
                <a
                  href="/date-time/time-duration-calculator"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Time Duration Calculator
                </a>
                . For converting metres, kilometres, and miles without pace, use
                the{" "}
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

          <section aria-labelledby="gps-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="gps-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why GPS Watches and Courses Differ
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Consumer GPS estimates a path from sampled positions. Race
                courses are measured along a defined route. Those two lengths are
                often close but not identical.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Tall buildings, dense trees, tunnels, and sharp turns can shorten
                or lengthen a watch&apos;s recorded distance. Averaging pace from
                a GPS file therefore reflects the watch&apos;s path, not
                necessarily the official course. When you care about a race
                distance, prefer the certified length (or the preset above) and
                your finish time.
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
                Pace math only — no coaching, predictions, or health claims.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>No training plans, interval prescriptions, or recovery advice</li>
              <li>No race-time predictions from a recent result</li>
              <li>No calorie burn, heart-rate zones, or medical guidance</li>
              <li>
                No vehicle speed tools or general unit conversion beyond pace and
                distance helpers linked above
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
              This page provides general information about converting distance,
              time, pace, and speed. It is not medical advice, coaching advice,
              or a substitute for guidance from a qualified professional. Your
              inputs stay in the browser and are not stored by CalcDaily.
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
                Race pace charts, predictions, steps to distance, clock
                durations, and unit conversion.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                href="/health/race-time-predictor"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Race Time Predictor
                </span>
                <span className="text-sm text-muted">
                  Equivalent times from a recent race (Riegel formula)
                </span>
              </a>
              <a
                href="/health/steps-to-distance-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-health/45 hover:bg-cat-health-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Steps to Distance Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert steps to km and miles, or distance back to steps
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
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
