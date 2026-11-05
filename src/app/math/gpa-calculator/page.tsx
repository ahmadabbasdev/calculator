import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, GraduationCap } from "lucide-react";
import { GpaCalculator } from "@/components/calculators/GpaCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SCALE_OVERVIEW_ROWS } from "@/lib/utils/gpa";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/gpa-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "GPA & CGPA Calculator - College, University, School";
const PAGE_DESCRIPTION =
  "Free GPA and CGPA calculator for college, university, and high school. SGPA by semester, weighted GPA, 4.0 / 5.0 / 10-point scales, and a target GPA planner.";

export const FAQ_ITEMS = [
  {
    question: "How do I calculate my GPA?",
    answer:
      "Enter each course grade and credit hours. The calculator multiplies grade points by credits for every graded course, adds those quality points, and divides by total credits counted. Pass/fail and withdrawn marks on US-style scales are left out. The result updates as you type, with a one-line worked step under the CGPA.",
  },
  {
    question: "What is the difference between GPA, SGPA and CGPA?",
    answer:
      "GPA is the general grade-point average. SGPA is the GPA for a single semester (or term). CGPA is the cumulative average across all semesters and credits counted so far. This page shows SGPA for each semester block and an overall CGPA.",
  },
  {
    question: "How do I calculate CGPA from multiple semesters?",
    answer:
      "Add a semester block for each term, enter courses and credits, then read the overall CGPA in the result panel. CGPA weights every graded credit across semesters: total quality points ÷ total credits. You can also turn on “Include previous cumulative GPA / CGPA” if you only know an earlier CGPA and credit total.",
  },
  {
    question: "What is the difference between weighted and unweighted GPA?",
    answer:
      "Unweighted GPA uses the plain letter-to-points scale. Weighted GPA adds extra points for harder courses — here, Honors adds 0.5 and AP/IB adds 1.0 on passing grades (failing grades stay 0). Weighting is offered on US-style 4.0 / 4.3 scales. Schools set their own rules, so treat this as a helpful estimate.",
  },
  {
    question: "How do I convert CGPA to percentage?",
    answer:
      "There is no universal formula. Many Indian universities using a 10-point scale publish a conversion such as percentage ≈ CGPA × 9.5, but others use different factors or tables. When the 10-point scale is selected, this calculator shows an editable conversion factor (default 9.5) and labels the percentage as an estimate. Always follow your institution’s official method for applications and transcripts.",
  },
  {
    question: "What GPA do I need to reach my target CGPA?",
    answer:
      "Open the Target CGPA planner and enter your current CGPA, credits completed, credits still to take, and target. The tool solves for the GPA needed on remaining credits: (target × (done + left) − current × done) ÷ left. If that value is above your scale’s maximum, the target is not reachable with the credits left.",
  },
  {
    question: "Which grading scale does my university use?",
    answer:
      "Only your institution’s published grade-point table is authoritative. Common patterns include US 4.0 with plus/minus, 4.0 with thirds, 5.0 letter scales, and 10-point CGPA systems. Pick the closest preset here or build a Custom scale, then confirm against your handbook or registrar.",
  },
  {
    question: "Does an A+ count as 4.0 or 4.3?",
    answer:
      "It depends on the school. Some cap A+ at 4.0; others use 4.3. Use the grade-scale selector on this page to match your institution’s published scale.",
  },
  {
    question: "How are pass/fail and withdrawn courses handled?",
    answer:
      "On US-style scales, P, NP, and W are excluded from both quality points and credits. On custom scales you can mark grades as excluded. Uncheck Include on a row to omit an older attempt after a retake when your policy allows it.",
  },
  {
    question: "What is a good GPA?",
    answer:
      "On a 4.0 scale, many colleges treat about 3.0 as solid (B average), 3.5+ as strong, and 3.7–4.0 as excellent — but “good” depends on your program, scholarships, and goals. On 5.0 or 10-point scales, compare against your university’s class average and published cutoffs instead of US letter bands.",
  },
  {
    question: "Will my school's official GPA match this result?",
    answer:
      "Not always. Registrars may use different point values, rounding, repeated-course rules, or weighting. Use this tool to plan and estimate, then confirm against your transcript or school GPA policy.",
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
  name: "GPA & CGPA Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
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
      name: "GPA Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function GpaCalculatorPage() {
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
            { label: "GPA Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <GraduationCap className="size-4.5" aria-hidden="true" />
            College, university &amp; high school calculator
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            GPA &amp; CGPA Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Calculate semester SGPA and overall university CGPA — or a high
            school GPA — with common 4.0, 5.0, and 10-point grading scales,
            optional weighting, and a clear worked step.
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />


        <GpaCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-8 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use the GPA &amp; CGPA Calculator
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Pick a scale, add semester blocks, and read live SGPA and CGPA.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  1
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Choose scale &amp; entry
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Select a common university or high school scale, or build a
                  custom table. Switch to grade points when your school
                  publishes points per course.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  2
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Enter semesters
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Add courses with grades and credits. Use Add semester for
                  multi-term CGPA; each block shows its own SGPA.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  3
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Optional previous CGPA
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Include your current CGPA and credits completed if you are
                  adding only new coursework.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-panel/60 p-4">
                <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-cat-math text-[12px] font-bold text-white">
                  4
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Plan a target
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Open the target CGPA planner to see what GPA you need on
                  remaining credits — or when a goal is out of reach.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-gpa-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-gpa-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Calculate GPA and CGPA
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                For each graded course, multiply the grade’s point value by the
                course credits to get quality points. SGPA for one semester is
                that semester’s total quality points divided by its credits.
                CGPA across semesters (or a whole degree) uses the same idea on
                all counted credits: total quality points ÷ total credits.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Example: Semester 1 has a 3-credit A (4.0) and a 3-credit B
                (3.0) → (4.0×3) + (3.0×3) = 21 quality points over 6 credits →
                SGPA = 21 ÷ 6 = 3.50. Semester 2 adds 6 credits at SGPA 3.00 (18
                quality points). Combined CGPA = (21 + 18) ÷ (6 + 6) = 39 ÷ 12 =
                3.25.
              </p>
            </div>
          </section>

          <section aria-labelledby="gpa-vs-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="gpa-vs-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                GPA vs. CGPA vs. SGPA
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
                <li>
                  <span className="font-semibold text-foreground">GPA</span> —
                  grade point average; the umbrella term students and schools
                  use for credit-weighted averages.
                </li>
                <li>
                  <span className="font-semibold text-foreground">SGPA</span> —
                  semester (or term) GPA for one block of courses.
                </li>
                <li>
                  <span className="font-semibold text-foreground">CGPA</span> —
                  cumulative GPA across all semesters and credits counted so
                  far; what many universities report on transcripts.
                </li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="scales-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="scales-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Grading Scales Used by Universities
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Schools publish their own letter-to-points tables. The presets
                below are common patterns — including US 4.0 scales, a 5.0
                scale, and a 10-point CGPA scale — not a guarantee that your
                college matches them exactly. When in doubt, use Custom scale or
                enter grade points directly.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full min-w-[28rem] border-collapse text-left text-[14px]">
                <caption className="sr-only">
                  Common university and school grading scales
                </caption>
                <thead>
                  <tr className="border-b border-border bg-panel">
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-foreground"
                    >
                      Scale
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-foreground"
                    >
                      Maximum
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-foreground"
                    >
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SCALE_OVERVIEW_ROWS.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-border/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-medium text-foreground"
                      >
                        {row.name}
                      </th>
                      <td className="px-4 py-2.5 tabular-nums text-muted">
                        {row.max}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="weighted-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="weighted-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Weighted vs. Unweighted GPA
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Unweighted GPA treats every course the same on the letter scale.
                Weighted GPA gives extra points for advanced classes so an A in
                AP can outrank an A in a regular course. This calculator’s
                default weighting (on US-style scales) adds 0.5 for Honors and
                1.0 for AP/IB on passing grades only; failing grades remain 0.
                Many high schools and colleges publish their own tables — always
                prefer your school’s policy for official transcripts.
              </p>
            </div>
          </section>

          <section id="cgpa-to-percentage" aria-labelledby="cgpa-to-percentage-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="cgpa-to-percentage-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Convert CGPA to Percentage
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Conversion methods vary by institution. Some universities on a
                10-point scale use a factor such as percentage ≈ CGPA × 9.5;
                others publish a different multiplier or a lookup table. No
                single formula is universal for 4.0 or 5.0 scales either. When
                you select the 10-point scale above, the result panel offers an
                editable conversion factor (default 9.5) and clearly labels the
                percentage as an estimate — use your registrar’s official rule
                for applications and certificates.
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
                GPA, SGPA, CGPA, grading scales, and target planning.
              </p>
            </div>
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold text-foreground select-none [&::-webkit-details-marker]:hidden">
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
                href="/math/average-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Average Calculator
                </span>
                <span className="text-sm text-muted">
                  Mean, median, mode, range, and standard deviation
                </span>
              </Link>
              <Link
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, weight, volume, and temperature conversions
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
