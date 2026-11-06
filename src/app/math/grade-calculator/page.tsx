import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ClipboardList } from "lucide-react";
import { GradeCalculator } from "@/components/calculators/GradeCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/math/grade-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Grade Calculator - Weighted & Final Exam";
const PAGE_DESCRIPTION =
  "Free grade calculator for weighted averages, what you need on a final exam, and test scores to letter grades. Clear steps — your school’s policy still counts.";

export const FAQ_ITEMS = [
  {
    question: "How does a weighted grade calculator work?",
    answer:
      "Each assignment has a score percent and a weight percent. The weighted average is the sum of (score × weight) divided by the sum of the weights. Example: Homework 90 with weight 20, Midterm 80 with weight 30, and Final 70 with weight 50 gives (90×20 + 80×30 + 70×50) ÷ 100 = 77%.",
  },
  {
    question: "What if my category weights do not add up to 100%?",
    answer:
      "This calculator does not silently rescale weights to 100%. It divides by the total of the weights you entered and labels that clearly. If you only enter two categories that sum to 50%, the result is the average on those entered weights alone — match your syllabus before treating it as a course grade.",
  },
  {
    question: "How do I calculate what I need on my final exam?",
    answer:
      "Enter your current grade on coursework so far, the final’s weight as a percent of the course, and the overall grade you want. Needed final score = (desired − current × (1 − w)) ÷ w, where w is the final weight as a fraction. Example: current 85%, final worth 40%, target 80% → you need 72.5% on the final.",
  },
  {
    question: "What does “current grade” mean for the final-exam mode?",
    answer:
      "Current grade is the average of everything before the final — homework, quizzes, midterms, projects — already combined the way your syllabus weights them (or as shown in your gradebook). Do not include the final itself in that number.",
  },
  {
    question: "How do I convert a test score to a percentage and letter grade?",
    answer:
      "Use Test score mode: points earned ÷ points possible × 100. Example: 42 out of 50 is 84%, which is a B on the US standard scale (A 90, B 80, C 70, D 60). Switch to plus/minus or custom cutoffs if your school publishes different bands.",
  },
  {
    question: "Can a score above 100% be entered?",
    answer:
      "Yes — some courses allow extra credit that pushes a category above 100%. The calculator accepts those scores and notes that extra credit is present. Whether that raises your official course grade depends on your instructor’s rules.",
  },
  {
    question: "Will this match my school’s official grade?",
    answer:
      "Not always. Schools differ on letter cutoffs, rounding, dropped lowest scores, curves, pass/fail floors, and how incomplete work is treated. Use this page to plan and check arithmetic; your syllabus and registrar policy are what count for transcripts.",
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
  name: "Grade Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
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
      name: "Math & Education",
      item: `${SITE_URL}/math`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Grade Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function GradeCalculatorPage() {
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
            { label: "Grade Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-math">
            <ClipboardList className="size-4.5" aria-hidden="true" />
            Weighted grades · finals · test scores
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Grade Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Calculate a weighted course grade, find what you need on a final
            exam, or turn points into a percentage and letter grade. Your
            school&apos;s grading policy is what counts on the transcript.
          </p>
          <LastReviewed
            reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt}
          />
        </header>

        <GradeCalculator />

        <article className="mt-20 space-y-16">
          <section aria-labelledby="how-weighted-heading" className="max-w-3xl">
            <h2
              id="how-weighted-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How weighted grades work
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Many courses mix homework, quizzes, midterms, and a final — each
              with its own weight. A weighted grade calculator multiplies each
              score by its weight, adds those products, and divides by the total
              of the weights. Concrete example: Homework 90% with weight 20,
              Midterm 80% with weight 30, and Final 70% with weight 50.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted tabular-nums">
              (90×20) + (80×30) + (70×50) = 1,800 + 2,400 + 3,500 = 7,700. Divide
              by 100:{" "}
              <strong className="font-semibold text-foreground">77.00%</strong>
              , a C on the common US standard scale (A 90, B 80, C 70, D 60).
              Letter bands are selectable; schools often publish plus/minus
              cutoffs or custom tables instead.
            </p>
          </section>

          <section aria-labelledby="final-example-heading" className="max-w-3xl">
            <h2
              id="final-example-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Worked example: what do I need on my final?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Suppose your current grade on coursework so far is 85%, the final
              exam is worth 40% of the course, and you want an 80% overall. Let{" "}
              <em>w</em> = 0.40. Needed final score = (desired − current × (1 −
              w)) ÷ w = (80 − 85 × 0.60) ÷ 0.40 = (80 − 51) ÷ 0.40 ={" "}
              <strong className="font-semibold text-foreground">72.50%</strong>.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              With the same current 85% and a lighter 30% final, a 70% target
              needs only 35.00% on the exam. Pushing for 90% overall with that
              30% final would require about 101.67% — above 100%, so not
              reachable without extra credit or a different policy. If you are
              already well above the target (for example current 95%, final
              weight 20%, target 70%), the needed score is negative: the desired
              grade is already secured, and a zero on the final still leaves a
              high overall.
            </p>
          </section>

          <section aria-labelledby="weights-100-heading" className="max-w-3xl">
            <h2
              id="weights-100-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Why weights not summing to 100 matters
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              If you enter only Homework 90 (weight 20) and Midterm 80 (weight
              30), the weights total 50, not 100. Dividing by 50 gives{" "}
              <strong className="font-semibold text-foreground">84.00%</strong>{" "}
              on the entered weights. Silently stretching those weights to 100%
              would invent a category you never typed. This tool labels when the
              total is not 100 and always divides by the sum you provided.
            </p>
          </section>

          <section aria-labelledby="mistakes-heading" className="max-w-3xl">
            <h2
              id="mistakes-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Common mistakes
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Mixing percent scores with raw points in the same weighted row —
                convert points to a percent first (Test score mode), or keep
                everything on one scale.
              </li>
              <li>
                Forgetting extra credit that already lifted a category above
                100%, or assuming the LMS will treat it the same way this page
                does.
              </li>
              <li>
                Using the wrong “current grade” for a final-exam estimate —
                include only work before the final, with the syllabus weights
                already applied.
              </li>
              <li>
                Treating a letter cutoff from a different school as universal;
                confirm A/B/C/D bands on your syllabus.
              </li>
            </ul>
          </section>

          <section aria-labelledby="limits-heading" className="max-w-3xl">
            <h2
              id="limits-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              When this is not enough
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Pass/fail floors, dropped lowest quizzes, curves, incomplete
              grades, and retake policies are not modeled here. For semester GPA
              or CGPA across courses, use the{" "}
              <a
                href="/math/gpa-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                GPA Calculator
              </a>
              . For plain percent-of and percent-change math without letter
              grades, use the{" "}
              <a
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </a>
              .
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Disclaimer: estimates on this page are for planning only. Your
              school&apos;s own grading policy is what counts for official
              grades and transcripts.
            </p>
          </section>

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently asked questions
            </h2>
            <div className="mt-4 max-w-3xl divide-y divide-border/80">
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

          <section aria-labelledby="related-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="related-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Related Calculators
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                GPA and percentage tools on CalcDaily — not substitutes for this
                grade calculator.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="/math/gpa-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  GPA Calculator
                </span>
                <span className="text-sm text-muted">
                  Semester SGPA and cumulative CGPA across courses
                </span>
              </a>
              <a
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-math/45 hover:bg-cat-math-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number, percent change, and increase or decrease
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
