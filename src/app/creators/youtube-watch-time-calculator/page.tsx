import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Video } from "lucide-react";
import { YoutubeWatchTimeCalculator } from "@/components/calculators/YoutubeWatchTimeCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  averageViewSecondsFromPercent,
  calculateWatchTime,
  hoursFromViews,
  monthsToTarget,
  viewsNeededForHours,
  viewsNeededReferenceRow,
} from "@/lib/utils/youtube-watch-time";

const PAGE_PATH = "/creators/youtube-watch-time-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "YouTube Watch Time Calculator";
const PAGE_DESCRIPTION =
  "Free YouTube watch time calculator: estimate views needed for a hours target, project months with optional growth, or convert one video's views into hours.";

const SAMPLE_3MIN = viewsNeededForHours(4000, 180);
const SAMPLE_430 = viewsNeededForHours(4000, 270);
const SAMPLE_AVG_FROM_PCT = averageViewSecondsFromPercent(600, 45);
const SAMPLE_HOURS = hoursFromViews(12_000, 270);
const SAMPLE_VIDEO = calculateWatchTime({
  mode: "video",
  videoMinutes: 10,
  videoSeconds: 0,
  percentViewed: 45,
  views: 1000,
});
const SAMPLE_FLAT = monthsToTarget({
  remainingHours: 3400,
  monthlyHours: 250,
  growthRate: 0,
});
const SAMPLE_GROWTH = monthsToTarget({
  remainingHours: 3400,
  monthlyHours: 250,
  growthRate: 0.1,
});

const REF_DURATIONS_SEC = [60, 120, 180, 270, 300, 600];
const REF_TARGETS = [1000, 4000];
const REFERENCE_ROWS = REF_TARGETS.flatMap((target) =>
  REF_DURATIONS_SEC.map((seconds) => viewsNeededReferenceRow(target, seconds)),
);

function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export const FAQ_ITEMS = [
  {
    question: "How do I calculate views needed for a watch-hours target?",
    answer: `Views needed = target hours × 3,600 ÷ average view duration in seconds, then round up. Example: 4,000 hours at a 3:00 average needs ${SAMPLE_3MIN.toLocaleString("en-US")} views. At 4:30 it needs ${SAMPLE_430.toLocaleString("en-US")} views.`,
  },
  {
    question: "How is average view duration related to percentage viewed?",
    answer: `Average view duration ≈ video length × (percentage viewed ÷ 100). A 10:00 video at 45% viewed averages ${formatClock(SAMPLE_AVG_FROM_PCT)} (${SAMPLE_AVG_FROM_PCT} seconds).`,
  },
  {
    question: "How do views turn into watch hours?",
    answer:
      SAMPLE_VIDEO.ok && SAMPLE_VIDEO.mode === "video"
        ? `Hours = views × average view seconds ÷ 3,600. Example: 12,000 views at 4:30 average is ${SAMPLE_HOURS.toLocaleString("en-US")} hours. One thousand views of a 10-minute video at 45% viewed is ${SAMPLE_VIDEO.totalHours.toLocaleString("en-US")} hours.`
        : "Hours = views × average view seconds ÷ 3,600.",
  },
  {
    question: "How does the time-to-target tab work?",
    answer: `It subtracts current hours from the target, then adds monthly gained hours. With 0% growth, remaining ÷ monthly hours is the months needed (3,400 ÷ 250 = ${SAMPLE_FLAT.interpolatedMonths.toFixed(1)}). With growth, each month’s gain is monthly hours × (1 + growth)^(month − 1).`,
  },
  {
    question: "What does monthly growth percent mean here?",
    answer: `It scales the hours you gain each month. At 10% growth and 250 hours in month 1, month 2 is 275, and so on. For 3,400 remaining hours, cumulative gain is about ${SAMPLE_GROWTH.cumulativeBefore.toFixed(2)} after month 9, and the target is reached in month ${SAMPLE_GROWTH.monthReached} (about ${SAMPLE_GROWTH.interpolatedMonths.toFixed(2)} months interpolated). Growth is an assumption you enter — not a forecast.`,
  },
  {
    question: "Does this page state YouTube eligibility rules?",
    answer:
      "No. It only does arithmetic on the numbers you enter. The target hours field is editable. Programme rules, thresholds and windows change — check the platform’s official help pages for anything current. This page does not promise income or recommend ways to get views.",
  },
  {
    question: "What does the calculator not model?",
    answer:
      "It does not model seasonality, changing audiences, retention curves over the video timeline, or different counting rules for formats such as Shorts and live streams. Results are estimates from the inputs you provide.",
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
  name: "YouTube Watch Time Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
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
      name: "Creators",
      item: `${SITE_URL}/creators`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "YouTube Watch Time Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function YoutubeWatchTimeCalculatorPage() {
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
          theme="creators"
          items={[
            { label: "Home", href: "/" },
            { label: "Creators", href: "/creators" },
            { label: "YouTube Watch Time Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Video className="size-4.5" aria-hidden="true" />
            Watch hours, views and average view duration
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            YouTube Watch Time Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate how many views are needed for a watch-hours target, project
            months to a target with optional monthly growth, or convert one
            video&apos;s views into hours. This page does arithmetic only — check
            official help pages for any current programme rules. For clock-time
            spans, use the{" "}
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

        <YoutubeWatchTimeCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Watch time, views and average view duration
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Watch hours are total viewing time. Views are how many times a
              video was started (counting rules vary by product). Average view
              duration is how long a typical view lasts. Linking them is
              arithmetic: hours ≈ views × average seconds ÷ 3,600, and views
              needed for a hours target ≈ hours × 3,600 ÷ average seconds,
              rounded up to a whole view.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked examples: 4,000 hours at a 3:00 average needs{" "}
              {SAMPLE_3MIN.toLocaleString("en-US")} views. At 4:30 the same
              target needs {SAMPLE_430.toLocaleString("en-US")} views because
              4,000 × 3,600 ÷ 270 = 53,333.33… and the calculator rounds up.
              Going the other way, 12,000 views at 4:30 average contribute{" "}
              {SAMPLE_HOURS.toLocaleString("en-US")} hours.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Percentage viewed matters when you only know length and retention.
              A 10:00 video watched 45% of the way averages{" "}
              {formatClock(SAMPLE_AVG_FROM_PCT)}. One thousand such views add{" "}
              {SAMPLE_VIDEO.ok && SAMPLE_VIDEO.mode === "video"
                ? SAMPLE_VIDEO.totalHours.toLocaleString("en-US")
                : "75"}{" "}
              hours. The same length at a higher percentage viewed needs fewer
              views for the same hours target — or produces more hours from the
              same view count.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Searchers often ask for a watch hours calculator, a 4,000 watch
              hours calculator, how many views for 4,000 hours, or an average
              view duration calculator. This page answers those with the same
              three formulas: views needed from a hours target and average
              duration; months from remaining hours, monthly gain and optional
              growth; and hours from one video&apos;s length, percentage viewed
              and view count. It is not an earnings or CPM tool.
            </p>
          </section>

          <section aria-labelledby="mistakes-heading" className="max-w-3xl">
            <h2
              id="mistakes-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Common input mistakes
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Mixing units is the usual error: entering average view duration
              in minutes when the field pair expects minutes and seconds, or
              treating percentage viewed as a fraction (0.45) instead of 45.
              Another is using total video length as if every viewer watched
              to the end — if retention is lower, average view duration is
              shorter and views needed for the same hours target rise. On the
              timeline tab, entering current hours above the target correctly
              reports that the target is already met; a zero or blank monthly
              gain cannot project a date. Zero duration and negative numbers
              return an error state instead of a fake view count.
            </p>
          </section>

          <section aria-labelledby="limits-heading" className="max-w-3xl">
            <h2
              id="limits-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Targets, growth and limits
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              The target hours field defaults to 4,000 but is editable. This
              page does not state or imply that any number is a current
              eligibility rule, threshold, programme window or payout
              requirement — those change. Confirm anything that matters on the
              platform&apos;s official help pages. The calculator does not
              estimate earnings, CPM or income, and it does not recommend ways
              to get views or watch time.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              The timeline tab starts from your current hours and adds monthly
              gained hours. With no growth, remaining hours ÷ monthly hours is
              the interpolated months (for example 3,400 ÷ 250 ={" "}
              {SAMPLE_FLAT.interpolatedMonths.toFixed(1)}). With 10% monthly
              growth, each month&apos;s gain is 1.1 times the previous; after
              month 9 the cumulative gain is about{" "}
              {SAMPLE_GROWTH.cumulativeBefore.toFixed(2)} hours, and the
              remaining target is crossed in month {SAMPLE_GROWTH.monthReached}{" "}
              (about {SAMPLE_GROWTH.interpolatedMonths.toFixed(2)} months
              interpolated). Growth is an assumption you type in, not a
              prediction.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              What this tool does not model: seasonality, audiences that change
              over time, second-by-second retention curves, or formats that may
              be counted differently (for example Shorts and live streams). For
              percent-of math without watch hours, use the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </Link>
              . For means of a list of numbers, use the{" "}
              <Link
                href="/math/average-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Average Calculator
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="table-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Views needed reference
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same views-needed function as the calculator
                (rounded up), not typed by hand.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Target hours
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Average duration
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Views needed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.targetHours}-${row.averageViewSeconds}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.targetHours.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {formatClock(row.averageViewSeconds)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.viewsNeeded.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="faq-heading" className="max-w-3xl">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently asked questions
            </h2>
            <div className="mt-4 divide-y divide-border/80 rounded-xl border border-border/80 bg-panel shadow-card">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-semibold text-foreground">
                    {item.question}
                    <ChevronDown
                      className="mt-0.5 size-4 shrink-0 text-muted transition group-open:rotate-180"
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
              This calculator performs arithmetic on the numbers you enter. It
              does not state platform eligibility rules, thresholds, programmes
              or payouts as current or required. It does not promise growth or
              income, and it does not recommend ways to obtain views or watch
              time. Your inputs stay in the browser and are not stored by
              CalcDaily.
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
                Clock durations, percent math, and averages of number lists.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/date-time/time-duration-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-creators/45 hover:bg-cat-creators-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Time Duration Calculator
                </span>
                <span className="text-sm text-muted">
                  Hours between clock times, add or subtract time
                </span>
              </a>
              <a
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-creators/45 hover:bg-cat-creators-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of, change, and increase or decrease
                </span>
              </a>
              <a
                href="/math/average-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-creators/45 hover:bg-cat-creators-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Calculator
                </span>
                <span className="text-sm text-muted">
                  Mean, median, mode, range, and standard deviation
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
