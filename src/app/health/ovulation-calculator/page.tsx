import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { OvulationCalculator } from "@/components/calculators/OvulationCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import {
  CYCLE_LENGTH_DEFAULT,
  FERTILE_DAYS_BEFORE_OVULATION,
  LUTEAL_LENGTH_DEFAULT,
} from "@/lib/utils/ovulation";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/health/ovulation-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Ovulation Calculator - Fertile Window Estimate";
const PAGE_DESCRIPTION =
  "Estimate ovulation and fertile window from last period date and cycle length. See this cycle and the next three — calendar method only, not birth control.";

export const FAQ_ITEMS = [
  {
    question: "How does this ovulation calculator work?",
    answer: `It uses the calendar method. Enter the first day of your last period, your average cycle length, and optionally luteal phase length (default ${LUTEAL_LENGTH_DEFAULT} days). Next period is period start plus cycle length. Estimated ovulation is next period minus luteal length. The fertile window is the ${FERTILE_DAYS_BEFORE_OVULATION + 1} days ending on ovulation day.`,
  },
  {
    question: "When do I ovulate after my period?",
    answer: `Timing depends on cycle length and luteal phase. In a ${CYCLE_LENGTH_DEFAULT}-day cycle with a ${LUTEAL_LENGTH_DEFAULT}-day luteal phase, ovulation is estimated about ${CYCLE_LENGTH_DEFAULT - LUTEAL_LENGTH_DEFAULT} days after the first day of the period. Longer cycles place ovulation later; shorter cycles place it earlier.`,
  },
  {
    question: "What is the fertile window?",
    answer: `The fertile window is the stretch of days when pregnancy is more likely if sperm is present. This tool estimates it as the ${FERTILE_DAYS_BEFORE_OVULATION} days before ovulation through ovulation day itself (${FERTILE_DAYS_BEFORE_OVULATION + 1} days total). Sperm can survive several days; the egg is typically viable for a shorter time after ovulation.`,
  },
  {
    question: "Why does luteal phase length matter?",
    answer: `The luteal phase is the time from ovulation to the next period. Counting backward from the next period by the luteal length places ovulation. The default is ${LUTEAL_LENGTH_DEFAULT} days. Values outside the supported range make calendar estimates less meaningful — discuss that with a healthcare professional.`,
  },
  {
    question: "Are these dates accurate if my cycles are irregular?",
    answer:
      "No. The calendar method assumes a fairly steady cycle length. Stress, illness, PCOS and other conditions, breastfeeding, and recently stopping hormonal contraception can shift ovulation. Irregular cycles make these estimates unreliable. A clinician can advise on tracking that fits your situation.",
  },
  {
    question: "Is this ovulation calculator a form of birth control?",
    answer:
      "No. This page does not provide contraception guidance and never labels days as safe or infertile. Calendar estimates alone are not a reliable way to prevent pregnancy. Use proven contraception methods if that is your goal, and talk with a healthcare professional.",
  },
  {
    question: "When should I talk to a doctor?",
    answer:
      "Contact a healthcare professional if cycles are very short or long, if periods suddenly change, if you have ongoing pain or unusual bleeding, or if you have questions about fertility. This tool does not diagnose conditions or replace clinical care.",
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
  name: "Ovulation Calculator",
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
      name: "Ovulation Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function OvulationCalculatorPage() {
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
            { label: "Ovulation Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <CalendarDays className="size-4.5" aria-hidden="true" />
            Calendar-method ovulation &amp; fertile window
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ovulation Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate when ovulation may occur and the fertile window for this
            cycle and the next three, from the first day of your last period and
            your average cycle length. Results stay in your browser.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            This is not birth control. Calendar estimates are not a reliable way
            to prevent pregnancy, and irregular cycles make the dates less
            reliable.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <OvulationCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-calendar-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calendar-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How the Calendar Method Works
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                A simple date arithmetic estimate — not a hormone test or
                ultrasound.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The calendar method places ovulation by counting forward from the
                first day of the last period. Your average cycle length is the
                number of days from one period start to the next. The luteal
                phase is the stretch from ovulation to the following period —
                often about {LUTEAL_LENGTH_DEFAULT} days. Enter those values
                above; the tool does the arithmetic with local calendar dates
                and does not send inputs to a server.
              </p>
              <p>
                Formulas used here: next period = period start + cycle length;
                estimated ovulation = next period − luteal phase length; fertile
                window = ovulation minus {FERTILE_DAYS_BEFORE_OVULATION} days
                through ovulation day ({FERTILE_DAYS_BEFORE_OVULATION + 1} days
                in total). The table also projects the next three cycles by
                advancing the period start by one cycle length each time, so you
                can see how the same assumptions look a few months ahead.
              </p>
              <p>
                Worked example: last period starts on January 1 with a{" "}
                {CYCLE_LENGTH_DEFAULT}-day cycle and a {LUTEAL_LENGTH_DEFAULT}
                -day luteal phase. Next period falls on January 29. Ovulation is
                estimated on January 15. The fertile window runs from January 10
                through January 15. If the cycle were 32 days with the same
                luteal length, next period would fall on February 2 and
                ovulation on January 19. Longer cycles shift ovulation later; a
                shorter luteal phase moves ovulation closer to the next period.
              </p>
            </div>
          </section>

          <section aria-labelledby="ovulation-window-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="ovulation-window-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Ovulation and the Fertile Window
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Plain definitions for the dates shown above.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Ovulation is the release of an egg from an ovary. On a calendar
                estimate, it is a single day derived from cycle length and luteal
                length. The fertile window is a short range of days around that
                estimate when pregnancy is more likely if sperm is present —
                because sperm can live for several days and the egg for a shorter
                time after release. The month view highlights those days with
                text labels as well as visual markers so the meaning is not
                conveyed by color alone.
              </p>
              <p>
                Cycle length and luteal length both matter. Cycle length moves
                the predicted next period, and therefore the whole timeline.
                Luteal length places ovulation relative to that next period. Many
                people use a {CYCLE_LENGTH_DEFAULT}-day cycle and a{" "}
                {LUTEAL_LENGTH_DEFAULT}-day luteal phase as a starting point;
                your own averages may differ. If either value is outside the
                ranges this tool accepts, a calm message asks you to speak with a
                healthcare professional instead of inventing a date.
              </p>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Limits of Calendar Estimates
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Why the month view is an estimate, not a diagnosis.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Stress, illness, travel, and sleep changes can shift when
                ovulation occurs. Conditions such as PCOS, thyroid disorders, and
                other hormonal issues often produce irregular cycles.
                Breastfeeding and recently stopping hormonal contraception can
                also change timing for months. In those situations, calendar math
                alone is a weak guide, and the dates on this page should be treated
                as rough illustrations only.
              </p>
              <p>
                This page never labels days as “safe” or “infertile,” and it is
                not birth control. Calendar estimates alone are not a reliable way
                to prevent pregnancy. If preventing pregnancy is the goal, use
                methods a clinician recommends. If you are already pregnant and
                need a due date estimate, use the{" "}
                <Link
                  href="/health/pregnancy-due-date-calculator"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Pregnancy Due Date Calculator
                </Link>
                . To move a known date by a fixed number of days, try{" "}
                <Link
                  href="/date-time/add-subtract-days"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  Add or Subtract Days
                </Link>
                .
              </p>
              <p>
                Talk with a doctor or other qualified clinician about pain,
                sudden cycle changes, very short or very long cycles, or fertility
                questions. This calculator does not diagnose conditions, recommend
                supplements, or replace clinical assessment.
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
                Fertile window timing, luteal length, irregular cycles, and when
                to seek care.
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
              Fertility across the menstrual cycle:{" "}
              <a
                href="https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                NHS — Fertility in the menstrual cycle
              </a>
              . Overview of ovulation:{" "}
              <a
                href="https://my.clevelandclinic.org/health/articles/23439-ovulation"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Cleveland Clinic — Ovulation
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information only. It is not
              medical advice and is not a form of contraception. Dates are
              estimated with the calendar method and may not match your actual
              ovulation. Your healthcare provider’s guidance takes priority.
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
                Estimate a pregnancy due date, or shift a calendar date by days.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/health/pregnancy-due-date-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pregnancy Due Date Calculator
                </span>
                <span className="text-sm text-muted">
                  Due date from LMP, conception, IVF, or ultrasound
                </span>
              </Link>
              <Link
                href="/date-time/add-subtract-days"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Add or Subtract Days
                </span>
                <span className="text-sm text-muted">
                  Date plus or minus days, weeks, months, or years
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
