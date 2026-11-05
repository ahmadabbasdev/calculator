import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CONTACT_EMAIL } from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/terms";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Terms of Use — CalcDaily";
const PAGE_DESCRIPTION =
  "Terms for using CalcDaily calculators: general information only, no professional advice, and limits of liability.";

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
    { "@type": "ListItem", position: 2, name: "Terms", item: CANONICAL_URL },
  ],
};

export default function TermsPage() {
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
            { label: "Terms" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            By using {SITE_NAME}, you agree to these terms.
          </p>
        </header>
        <div className="space-y-8 text-[15px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              1. What the site provides
            </h2>
            <p className="mt-2">
              {SITE_NAME} offers free calculators that run in your browser.
              Results are for general information and planning. They are not
              tax, legal, financial, medical, religious, or payroll advice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              2. No professional relationship
            </h2>
            <p className="mt-2">
              Using a calculator does not create an advisor–client or
              practitioner–patient relationship. Confirm important decisions
              with a qualified professional and with official sources.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              3. Accuracy and availability
            </h2>
            <p className="mt-2">
              We work to keep formulas and sourced tables correct, and we publish
              automated tests for many tools. We still may have errors, and data
              (such as tax schedules or holiday lists) can change. The site may
              be unavailable at times for maintenance or outages.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              4. Your responsibilities
            </h2>
            <p className="mt-2">
              You are responsible for how you use the results. Do not use the
              site in a way that breaks applicable law or that attempts to disrupt
              the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              5. Limitation of liability
            </h2>
            <p className="mt-2">
              To the fullest extent permitted by law, {SITE_NAME} and its
              operator are not liable for damages arising from use of (or
              inability to use) the calculators or the site, including decisions
              you make based on estimates shown here.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">6. Related pages</h2>
            <p className="mt-2">
              See also the{" "}
              <Link href="/disclaimer" className="font-medium text-zinc-950 underline">
                Disclaimer
              </Link>
              ,{" "}
              <Link href="/privacy" className="font-medium text-zinc-950 underline">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/contact" className="font-medium text-zinc-950 underline">
                Contact
              </Link>{" "}
              page (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-zinc-950 underline"
              >
                {CONTACT_EMAIL}
              </a>
              ).
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
