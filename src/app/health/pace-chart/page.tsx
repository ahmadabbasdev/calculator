import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Table2 } from "lucide-react";
import { PaceChartCalculator } from "@/components/calculators/PaceChartCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { KM_PER_MILE, formatDuration, formatPace } from "@/lib/utils/pace";
import {
  HALF_MARATHON_KM,
  MARATHON_KM,
  buildStaticPaceChart,
  rowFromFinishTime,
} from "@/lib/utils/pace-chart";

const PAGE_PATH = "/health/pace-chart";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Pace Chart & Splits — 5K to Marathon";
const PAGE_DESCRIPTION =
  "Marathon, half marathon, 5K and 10K pace charts with finish times, pace and speed. Build goal-time splits with even or adjusted halves — free in your browser.";

const MARATHON_CHART = buildStaticPaceChart("marathon");
const HALF_CHART = buildStaticPaceChart("half-marathon");
const SAMPLE_4H = rowFromFinishTime(MARATHON_KM, 4 * 3600);

/** Compact sample rows for the article (every other hour-ish for marathon). */
const MARATHON_SAMPLE_ROWS = MARATHON_CHART.rows.filter((_, i) => i % 3 === 0);
const HALF_SAMPLE_ROWS = HALF_CHART.rows.filter((_, i) => i % 2 === 0);

export const FAQ_ITEMS = [
  {
    question: "How do I read a marathon pace chart?",
    answer: `Each row is a finish time. Divide that time by ${MARATHON_KM} km to get pace per kilometre, then multiply by ${KM_PER_MILE} for pace per mile. Example: a 4:00:00 marathon is ${formatPace(SAMPLE_4H.secPerKm)} per km and ${formatPace(SAMPLE_4H.secPerMile)} per mile.`,
  },
  {
    question: "What is the difference between a pace chart and a pace calculator?",
    answer:
      "A pace chart lists many finish times at once for a fixed race distance. A pace calculator converts one distance and time into pace or speed (or the reverse). Use this page for charts and goal splits; use the Pace Calculator for single conversions.",
  },
  {
    question: "How are even splits calculated?",
    answer:
      "Even splits use a constant pace: total time divided by distance. Cumulative time at any marker is that pace times the distance covered. Halves each take exactly half the goal time when the plan is even.",
  },
  {
    question: "What does slower or faster first half mean here?",
    answer:
      "The first-half pace is the average pace multiplied by (1 + s) or (1 − s), and the second half uses the opposite factor so the total finish time stays the same. s is your chosen 1–5%. This page does not recommend either plan.",
  },
  {
    question: "How long is a marathon and a half marathon?",
    answer: `A marathon is ${MARATHON_KM} km (about ${(MARATHON_KM / KM_PER_MILE).toFixed(4)} miles). A half marathon is exactly half of that: ${HALF_MARATHON_KM} km.`,
  },
  {
    question: "Can I print or download the chart?",
    answer:
      "Yes. Use Print for a printer-friendly view (site chrome is hidden). Download CSV exports the current chart rows from your browser; cells that look like spreadsheet formulas are prefixed with an apostrophe.",
  },
  {
    question: "Does this tool give coaching or training advice?",
    answer:
      "No. It only shows arithmetic for finish times, paces, and splits. It is not coaching or medical advice.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
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
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
    },
  };
}

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pace Chart & Splits Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "HealthApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Health & Fitness",
      item: `${SITE_URL}/health`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Pace Chart & Splits",
      item: CANONICAL_URL,
    },
  ],
};

function SampleChartTable({
  caption,
  rows,
}: {
  caption: string;
  rows: typeof MARATHON_SAMPLE_ROWS;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-3xl min-w-[28rem] border-collapse text-left text-[14px]">
        <caption className="mb-2 text-left text-[13px] text-muted">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-3">
              Finish
            </th>
            <th scope="col" className="py-2 pr-3 tabular-nums">
              /km
            </th>
            <th scope="col" className="py-2 pr-3 tabular-nums">
              /mi
            </th>
            <th scope="col" className="py-2 pr-3 tabular-nums">
              km/h
            </th>
            <th scope="col" className="py-2 tabular-nums">
              mph
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.finishSeconds}
              className="border-b border-border/60 text-foreground tabular-nums"
            >
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                {formatDuration(row.finishSeconds)}
              </th>
              <td className="py-2 pr-3">{formatPace(row.secPerKm)}</td>
              <td className="py-2 pr-3">{formatPace(row.secPerMile)}</td>
              <td className="py-2 pr-3">{row.kmh.toFixed(2)}</td>
              <td className="py-2">{row.mph.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaceChartPage() {
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
            { label: "Pace Chart & Splits" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Table2 className="size-4.5" aria-hidden="true" />
            Race pace charts and goal splits
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pace Chart &amp; Splits Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Browse finish-time charts for the 5K, 10K, half marathon and marathon,
            or build kilometre and mile splits for a goal time. For converting a
            single distance and time into pace, use the{" "}
            <Link
              href="/health/pace-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Pace Calculator
            </Link>
            ; for equivalent race times across distances, the{" "}
            <Link
              href="/health/race-time-predictor"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Race Time Predictor
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

        <PaceChartCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use This Tool
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two tabs cover charts and goal splits. Results update as you
                type.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Open Pace chart to pick a race distance and finish-time range, or
                Splits for my goal to enter a goal finish.
              </li>
              <li>
                Read pace per km and per mile plus km/h and mph on each chart
                row. Print or download CSV when you need a copy.
              </li>
              <li>
                For splits, choose per km or per mile and an even, slower-first,
                or faster-first plan. Halves are adjusted so the total time does
                not change.
              </li>
            </ol>
          </section>

          <section aria-labelledby="built-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="built-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How a Pace Chart Is Built
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Each finish time is divided by the race distance. One mile is
                exactly {KM_PER_MILE} km.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Pace per kilometre (seconds) = finish time (seconds) ÷ distance
                (km). Pace per mile = pace per km × {KM_PER_MILE}. Speed in km/h
                is 3600 ÷ seconds per km; mph is 3600 ÷ seconds per mile. A
                4:00:00 marathon ({MARATHON_KM} km) is{" "}
                {formatPace(SAMPLE_4H.secPerKm)} per km and{" "}
                {formatPace(SAMPLE_4H.secPerMile)} per mile. The interactive
                chart and the sample tables on this page share that same
                arithmetic so a finish time always maps to one pace pair.
              </p>
              <p>
                Work stays in unrounded seconds until display. Shown times and
                paces round to the nearest second with half-up rounding and
                correct minute or hour carry. Custom ranges use the same
                formulas; the tool caps a chart at 200 rows so a very fine step
                cannot flood the table.
              </p>
            </div>
          </section>

          <section aria-labelledby="marathon-chart-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="marathon-chart-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Sample Marathon Pace Chart
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same functions as the interactive chart (sample
                of the 2:30–6:30 range).
              </p>
            </div>
            <SampleChartTable
              caption={`Marathon (${MARATHON_KM} km) — sample rows`}
              rows={MARATHON_SAMPLE_ROWS}
            />
          </section>

          <section aria-labelledby="half-chart-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="half-chart-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Sample Half Marathon Pace Chart
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Also generated at build time from the shared math module.
              </p>
            </div>
            <SampleChartTable
              caption={`Half marathon (${HALF_MARATHON_KM} km) — sample rows`}
              rows={HALF_SAMPLE_ROWS}
            />
          </section>

          <section aria-labelledby="splits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="splits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Read Splits
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Split tables show the time for each kilometre or mile and the
                running total. Marathon checkpoints (5K, 10K, half, 30K, 40K)
                appear when the distance is long enough.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Even splits keep the same pace from start to finish. Cumulative
                time at a marker is average pace times the distance covered. A
                slower first half multiplies average pace by (1 + s) for the first
                half of the distance and by (1 − s) for the second half; a faster
                first half swaps those factors. The halves meet at exactly half
                the race distance so first-half time plus second-half time equals
                the goal. The tool states the half times and their difference in
                neutral wording — it does not say which plan to choose.
              </p>
              <p>
                When the remaining distance after the last full kilometre or mile
                is not a whole unit, the table adds a final partial split so the
                last cumulative time matches the goal. Standard marathon
                checkpoints appear alongside the unit splits when the race is
                long enough for those markers.
              </p>
            </div>
          </section>

          <section aria-labelledby="distances-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="distances-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Standard Race Distances
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The marathon is {MARATHON_KM} km (about{" "}
                {(MARATHON_KM / KM_PER_MILE).toFixed(4)} miles). The half
                marathon is exactly half of that: {HALF_MARATHON_KM} km. The 5K
                and 10K are 5 km and 10 km. Custom distances accept kilometres or
                miles and convert with the same mile factor used everywhere else
                on the site.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Preset chart ranges cover common finish bands: marathon from
                2:30 to 6:30 in 10-minute steps, half marathon from 1:10 to 3:00
                in 5-minute steps, 10K from 35:00 to 1:30:00 in 5-minute steps,
                and 5K from 17:00 to 45:00 in 1-minute steps. You can override
                start, end, and step for any distance, including custom.
              </p>
            </div>
          </section>

          <section aria-labelledby="gps-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="gps-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Why Course, Weather, and GPS Differ
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Charts assume a flat, accurate distance and steady effort. Hills,
                wind, heat, and GPS path error move real splits away from the
                table.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Certified courses are measured along a defined route. Watches
                sample position and often cut corners or drift under trees or
                tall buildings. Heat, wind, and hills change how a given pace
                feels even when the arithmetic on the chart is unchanged. Use
                the official race distance with your goal time when you care
                about checkpoint math rather than a GPS trace alone.
              </p>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Tool Does Not Cover
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Arithmetic only — no coaching and no health claims.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>No training plans or taper schedules</li>
              <li>No recommendation of even vs uneven pacing</li>
              <li>No medical advice</li>
              <li>
                No race-time prediction across distances — use the{" "}
                <a
                  href="/health/race-time-predictor"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Race Time Predictor
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
              Pace charts and splits are general information. They are not
              coaching or medical advice. Your inputs stay in the browser and are
              not stored by CalcDaily.
            </p>
            <p className="mt-2 text-[12px] text-zinc-500">
              Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
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
                Single-pace conversion, race-time scaling, and clock durations.
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
                  Convert distance, time, pace, and speed
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
                  Equivalent times from a recent finish (Riegel)
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
                  Hours between clock times and timecards
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
