import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LIVE_CALCULATOR_COUNT, freeCalculatorsLabel } from "@/lib/calculators";
import {
  CONTACT_EMAIL,
  hasOwnerPhoto,
  OWNER_LOCATION,
  OWNER_NAME,
  OWNER_PHOTO,
  WHY_I_BUILT_THIS,
} from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/about";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "About CalcDaily — Free Browser Calculators";
const PAGE_DESCRIPTION =
  "Who builds CalcDaily, how the calculators are checked, where data comes from, and how to report an error.";

/** Hand-counted from Vitest it() cases under src/lib in the repository. */
const UNIT_TEST_COUNT = 301;

export const metadata: Metadata = {
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
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "About", item: CANONICAL_URL },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            About {SITE_NAME}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            {SITE_NAME} is a free collection of browser-based calculators —
            currently {freeCalculatorsLabel(LIVE_CALCULATOR_COUNT)}. Tools run
            on your device; inputs are not sent to our servers for calculation.
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-700">
          <section aria-labelledby="who-heading">
            <h2
              id="who-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              Who maintains this site
            </h2>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
              {hasOwnerPhoto() ? (
                <Image
                  src={OWNER_PHOTO}
                  alt=""
                  width={96}
                  height={96}
                  className="size-24 rounded-xl object-cover"
                />
              ) : null}
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-zinc-950">{OWNER_NAME}</span>
                  {OWNER_LOCATION ? (
                    <>
                      {" "}
                      · {OWNER_LOCATION}
                    </>
                  ) : null}
                </p>
                <p>{WHY_I_BUILT_THIS}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="what-heading">
            <h2
              id="what-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              What you get on each calculator page
            </h2>
            <p className="mt-3">
              Every live tool is more than an input form. The page explains what
              the calculation is for, how the formula or schedule works, at least
              one worked example with real numbers, limits where the estimate
              breaks down, and an FAQ written for that tool — not a reused
              template paragraph with the name swapped. Related tools are linked
              so you can move between date, finance, health, home energy, and math helpers
              without hunting through a directory of near-identical clones.
            </p>
          </section>

          <section aria-labelledby="built-heading">
            <h2
              id="built-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              How the calculators are built and checked
            </h2>
            <p className="mt-3">
              Each calculator is implemented as a small TypeScript module with
              automated unit tests. Those tests include hand-checked example
              values (for example fixed loan payments, date spans, ovulation
              calendar dates, and tax bracket totals). The repository currently
              contains {UNIT_TEST_COUNT} such test cases. Results are computed in
              the browser; we do not claim CPA, medical, or legal credentials,
              and we do not sell personalized advice.
            </p>
            <p className="mt-3">
              Pages that show a “last reviewed” date were checked against the
              sources listed on that page. When a schedule changes — for example
              a new state tax year — the data file and the review date are
              updated together, or the page stays unpublished until verification
              is done.
            </p>
          </section>

          <section aria-labelledby="publish-heading">
            <h2
              id="publish-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              What we publish — and what we wait on
            </h2>
            <p className="mt-3">
              A tool goes live only when the math module, tests, and page copy
              are ready. Draft surfaces (for example game helpers still under
              verification, or US states whose tax model does not fit our
              calculator yet) stay out of the homepage, sitemap, and directory
              until they meet that bar. We prefer fewer accurate tools over a
              large set of thin or unverified pages.
            </p>
          </section>

          <section aria-labelledby="data-heading">
            <h2
              id="data-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              Where the data comes from
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-zinc-950">Business days:</strong>{" "}
                public-holiday lists from the community{" "}
                <a
                  href="https://github.com/commenthol/date-holidays"
                  className="font-medium text-zinc-950 underline underline-offset-2"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  date-holidays
                </a>{" "}
                project (loaded as static files in the browser when you pick a
                country).
              </li>
              <li>
                <strong className="font-semibold text-zinc-950">US state income tax:</strong>{" "}
                brackets, deductions, and exemptions copied from state revenue
                sources linked on each state page (for example Illinois
                Department of Revenue, Virginia Department of Taxation, and North
                Carolina Department of Revenue for the schedules currently
                published).
              </li>
              <li>
                <strong className="font-semibold text-zinc-950">Health tools:</strong>{" "}
                BMI categories follow common WHO adult cut-offs described on the
                BMI page; calorie estimates use the Mifflin–St Jeor equation
                described on the calorie page; ovulation dates use the calendar
                method described on the ovulation page. These are screening or
                planning helpers, not diagnoses or contraception guidance.
              </li>
              <li>
                <strong className="font-semibold text-zinc-950">Zakat:</strong>{" "}
                metal prices and asset amounts are numbers you enter; the tool
                does not fetch live market prices.
              </li>
            </ul>
          </section>

          <section aria-labelledby="privacy-heading">
            <h2
              id="privacy-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              Privacy and advertising
            </h2>
            <p className="mt-3">
              Calculator inputs stay in your browser. Analytics runs only with
              consent. Sensitive tools (pregnancy due date, ovulation, and zakat)
              never load analytics or ads. Ads on other calculator pages, when
              shown, are kept off thin directory and trust pages so advertising
              sits next to real tool content. Details are in the{" "}
              <Link href="/privacy" className="font-medium text-zinc-950 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="corrections-heading">
            <h2
              id="corrections-heading"
              className="text-lg font-semibold text-zinc-950"
            >
              Corrections
            </h2>
            <p className="mt-3">
              If you find an error in a formula, a data table, or a worked
              example, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("CalcDaily correction")}`}
                className="font-medium text-zinc-950 underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              with the page URL and what looks wrong. We will review and correct
              the page when the report checks out.
            </p>
          </section>

          <p>
            Browse the{" "}
            <Link href="/calculators" className="font-medium text-zinc-950 underline">
              full calculator directory
            </Link>
            , read the{" "}
            <Link href="/privacy" className="font-medium text-zinc-950 underline">
              Privacy Policy
            </Link>
            , or{" "}
            <Link href="/contact" className="font-medium text-zinc-950 underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
