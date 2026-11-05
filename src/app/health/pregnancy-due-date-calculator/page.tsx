import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ChevronDown } from "lucide-react";
import { PregnancyDueDateCalculator } from "@/components/calculators/PregnancyDueDateCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import {
  CONCEPTION_TO_EDD_DAYS,
  CYCLE_LENGTH_DEFAULT,
  GESTATION_DAYS,
  TERM_DEFINITIONS,
  TRIMESTERS,
  weeksAndDaysFromTotal,
} from "@/lib/utils/pregnancy";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/health/pregnancy-due-date-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Pregnancy Due Date Calculator - LMP, Conception & IVF";
const PAGE_DESCRIPTION =
  "Estimate your due date from last period, conception, IVF transfer or ultrasound. See weeks pregnant, trimester dates and key milestones — in your browser.";

export const FAQ_ITEMS = [
  {
    question: "What's my due date?",
    answer:
      "Enter a dating method in the calculator above — last menstrual period (LMP) is selected first — to see an estimated due date (EDD), weeks pregnant when applicable, and related dates. The result is an estimate for planning, not a prediction of the exact day of birth. A healthcare provider may adjust dating based on clinical information.",
  },
  {
    question: "How is my due date calculated?",
    answer:
      "This due date calculator estimates an EDD from one of four inputs: last menstrual period (LMP) with cycle length, conception date, IVF embryo transfer (with embryo age), or an ultrasound with gestational age on the scan date. All modes compute an estimated due date, then derive weeks pregnant and key dates from that EDD.",
  },
  {
    question: "What does LMP mean?",
    answer:
      "LMP means last menstrual period — specifically the first day of that period. Clinicians often use the LMP date, with average cycle length, to estimate how far along a pregnancy is and to calculate an estimated due date. Choose the Last menstrual period (LMP) mode above to enter that date.",
  },
  {
    question: "How accurate is an estimated due date?",
    answer:
      "An estimated due date is a planning estimate, not a birth prediction. Only a small percentage of births happen on the exact date. Most births occur between 37 and 42 weeks. An early ultrasound can be more accurate than period dating alone, especially with irregular cycles, and a healthcare provider may adjust the date.",
  },
  {
    question: "What if my cycle is not 28 days long?",
    answer: `In Last menstrual period (LMP) mode, enter your average cycle length. The calculator adjusts from a ${CYCLE_LENGTH_DEFAULT}-day baseline: EDD = LMP + ${GESTATION_DAYS} days + (cycle length − ${CYCLE_LENGTH_DEFAULT}). Cycles outside the supported range are better discussed with a healthcare professional, and ultrasound dating may help.`,
  },
  {
    question: "How do I calculate my due date from my conception date?",
    answer: `Choose the Conception date mode and enter the date of conception. The due date from conception is the conception date plus ${CONCEPTION_TO_EDD_DAYS} days. Pregnancy weeks are still counted from a theoretical last period about two weeks earlier, which is why gestational age can look ahead of the conception date.`,
  },

  {
    question: "How is the due date calculated with IVF?",
    answer: `In IVF transfer mode, enter the transfer date and whether the embryo was Day 3, Day 5, or Day 6. The estimated due date is the transfer date plus ${CONCEPTION_TO_EDD_DAYS} days, minus the embryo age in days. Your clinic’s dating may still differ slightly — follow their guidance.`,
  },
  {
    question: "Can an ultrasound change my due date?",
    answer:
      "Yes. When a scan reports gestational age on a given date, this calculator estimates the due date as scan date plus the remaining days to 40 weeks. Healthcare providers often prefer early ultrasound dating when it differs meaningfully from period dating, especially if cycles are irregular.",
  },
  {
    question: "How are weeks of pregnancy counted?",
    answer:
      "Pregnancy weeks are usually counted from the first day of the last menstrual period, not from conception. Conception typically occurs around week 2 on that calendar. That is why a pregnancy can be dated as several weeks along even shortly after conception.",
  },
  {
    question: "What if I am not sure of my last period date?",
    answer:
      "If the last period date is uncertain, try the Ultrasound mode with a dating scan’s gestational age, or ask a midwife, doctor, or other healthcare professional. They can confirm dating and a care plan.",
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
  name: "Pregnancy Due Date Calculator",
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
      name: "Pregnancy Due Date Calculator",
      item: CANONICAL_URL,
    },
  ],
};

function trimesterTableLabel(startDays: number, endDays: number | null) {
  const start = weeksAndDaysFromTotal(startDays);
  if (endDays === null) {
    return `${start.weeks}w${start.days}d onward`;
  }
  const end = weeksAndDaysFromTotal(endDays);
  return `${start.weeks}w${start.days}d to ${end.weeks}w${end.days}d`;
}

export default function PregnancyDueDateCalculatorPage() {
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
            { label: "Pregnancy Due Date Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
            <Baby className="size-4.5" aria-hidden="true" />
            Due date, weeks pregnant &amp; trimester dates
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pregnancy Due Date Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Use this LMP calculator to estimate an EDD from your last menstrual
            period, or switch to conception date, IVF embryo transfer, or
            ultrasound. See how many weeks pregnant the dating implies, trimester
            boundaries, and key dates — in your browser.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            LMP means the first day of your last menstrual period.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <PregnancyDueDateCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the Due Date Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Pick the dating method that matches what you know, then read the
                estimated due date and related dates.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose a mode: Last menstrual period (LMP), Conception date, IVF
                transfer, or Ultrasound.
              </li>
              <li>
                Enter the date for that mode. For LMP, set average cycle length.
                For IVF, choose Day 3, Day 5, or Day 6. For ultrasound, enter
                gestational weeks and days on the scan date.
              </li>

              <li>
                Results update live — no submit button. Review the estimated due
                date, weeks pregnant (when the pregnancy is ongoing), trimester,
                and key dates table.
              </li>
              <li>
                Use Reset to clear inputs. Dates never appear in the URL and are
                not stored.
              </li>
            </ol>
          </section>

          <section aria-labelledby="how-calculated-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-calculated-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Your Due Date Is Calculated
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Four common dating methods, each producing an estimated due date
                (EDD). Last menstrual period (LMP) is the default tab above.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                <strong className="font-semibold text-foreground">
                  Last menstrual period (LMP):
                </strong>{" "}
                EDD = first day of the last menstrual period + {GESTATION_DAYS}{" "}
                days + (cycle length − {CYCLE_LENGTH_DEFAULT}). Pregnancy weeks
                are counted from that LMP date, so conception is usually around
                week 2 on this calendar.
              </p>
              <p>
                <strong className="font-semibold text-foreground">
                  Conception date:
                </strong>{" "}
                Due date from conception = conception date +{" "}
                {CONCEPTION_TO_EDD_DAYS} days.
              </p>

              <p>
                <strong className="font-semibold text-foreground">
                  IVF transfer:
                </strong>{" "}
                EDD = transfer date + {CONCEPTION_TO_EDD_DAYS} days − embryo age
                in days (Day 3, Day 5, or Day 6).
              </p>
              <p>
                <strong className="font-semibold text-foreground">
                  Ultrasound:
                </strong>{" "}
                EDD = scan date + ({GESTATION_DAYS} − gestational age in days on
                that date).
              </p>
              <p>
                Worked example (illustrative calendar dates, no specific year):
                last period on March 15 with a {CYCLE_LENGTH_DEFAULT}-day cycle
                → estimated due date December 20. That is March 15 +{" "}
                {GESTATION_DAYS} days.
              </p>
            </div>
          </section>

          <section aria-labelledby="accuracy-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="accuracy-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How Accurate Is an Estimated Due Date?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                An honest look at what an EDD can and cannot tell you.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                An estimated due date is a midpoint used for planning and
                gestational dating. Only a small percentage of births happen on
                that exact calendar day. Term pregnancy is a range — most births
                occur between 37 and 42 weeks.
              </p>
              <p>
                Period dating assumes a typical cycle and ovulation timing. Early
                ultrasound can be more accurate than LMP dating alone, especially
                with irregular cycles. Healthcare providers may adjust the date
                when clinical information supports a change — this tool does not
                replace that judgment.
              </p>
            </div>
          </section>

          <section aria-labelledby="trimesters-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="trimesters-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Pregnancy Trimesters and Term Definitions
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Simple ranges used on this page for a trimester calculator view.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-[28rem] w-full border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Trimester ranges and term pregnancy definitions
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TRIMESTERS.map((trimester) => (
                    <tr
                      key={trimester.id}
                      className="border-b border-border/70"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {trimester.label}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {trimesterTableLabel(
                          trimester.startDays,
                          trimester.endDays,
                        )}
                      </td>
                    </tr>
                  ))}
                  {TERM_DEFINITIONS.map((term) => (
                    <tr
                      key={term.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {term.label}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {term.range}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-zinc-600">
              Exact trimester and term definitions vary slightly by source. Your
              healthcare provider’s definitions and charting take priority.
            </p>
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
                LMP dating, conception and IVF due dates, ultrasound changes,
                and how pregnancy weeks are counted.
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
              Methods for estimating the due date:{" "}
              <a
                href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                ACOG Committee Opinion — Methods for Estimating the Due Date
              </a>
              . General information on estimated due dates and the 37–42 week
              window:{" "}
              <a
                href="https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                NHS — Pregnancy due date calculator
              </a>
              .
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
              This calculator provides general information and is not medical
              advice. Your healthcare provider will confirm your due date and
              care plan.
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
                Shift a date forward or back, or count the days between two
                dates.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <Link
                href="/date-time/days-between-dates"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Days Between Two Dates
                </span>
                <span className="text-sm text-muted">
                  Exact calendar days between any two dates
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
