import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { CONTACT_EMAIL } from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/privacy";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const GA_CONTAINER = GA_ID.startsWith("G-") ? GA_ID.slice(2) : GA_ID;

/** Owner contact values come from site config — never hardcoded here. */
const LAST_UPDATED = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const PAGE_TITLE = "Privacy Policy — CalcDaily";
const PAGE_DESCRIPTION =
  "How CalcDaily handles calculator inputs, optional Google Analytics with consent, and advertising. Your calculator inputs stay in your browser.";

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
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Privacy",
      item: CANONICAL_URL,
    },
  ],
};

const PARTNER_SITES_URL =
  "https://policies.google.com/technologies/partner-sites";
const AD_SETTINGS_URL = "https://adssettings.google.com";

export default function PrivacyPage() {
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
            { label: "Privacy" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Last updated: {LAST_UPDATED}.
          </p>
        </header>
        <div className="space-y-8 text-[15px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              1. What this site is
            </h2>
            <p className="mt-2">
              CalcDaily is a free website of browser-based calculators for dates,
              finance, health, and math. Tools run in your browser so you can get
              results without creating an account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              2. What stays in your browser
            </h2>
            <p className="mt-2">
              Your inputs stay in your browser. They are never sent to our
              servers or stored. Calculator results are also computed on your
              device. On business-day tools, choosing a country loads a static
              holiday list for that country in the browser; your dates are not
              put into the URL or uploaded to us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">3. Analytics</h2>
            <p className="mt-2">
              We use Google Analytics only if you accept analytics cookies. It
              helps us understand which pages are viewed, approximate location,
              device and browser type, and how people arrive at the site.
              Calculator inputs are not included. Analytics is not loaded on the{" "}
              <Link
                href="/health/pregnancy-due-date-calculator"
                className="font-medium text-zinc-950 underline"
              >
                pregnancy due-date calculator
              </Link>
              .
            </p>
            <p className="mt-3">
              When you accept, Google Analytics may set cookies such as:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-2 pr-3 font-semibold text-zinc-950">
                      Cookie
                    </th>
                    <th className="py-2 pr-3 font-semibold text-zinc-950">
                      Purpose
                    </th>
                    <th className="py-2 font-semibold text-zinc-950">
                      Typical duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 pr-3 font-mono text-[13px]">_ga</td>
                    <td className="py-2 pr-3">
                      Distinguishes visitors for aggregate statistics
                    </td>
                    <td className="py-2">About 2 years</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-mono text-[13px]">
                      {GA_CONTAINER ? `_ga_${GA_CONTAINER}` : "_ga_<container ID>"}
                    </td>
                    <td className="py-2 pr-3">
                      Persists the Analytics session / measurement state
                    </td>
                    <td className="py-2">About 2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              4. Advertising
            </h2>
            <p className="mt-2">
              We may show ads served by third parties (for example Google AdSense)
              in the future. If ads are active, those partners may use cookies or
              similar technologies to show and measure ads. Where required by law,
              we will ask for your consent before enabling non-essential ad
              cookies. Calculator inputs are not sent to ad networks. Learn how
              Google uses data from sites that use its services at{" "}
              <a
                href={PARTNER_SITES_URL}
                className="font-medium text-zinc-950 underline break-all"
                rel="noopener noreferrer"
                target="_blank"
              >
                {PARTNER_SITES_URL}
              </a>
              . You can manage Google ad settings at{" "}
              <a
                href={AD_SETTINGS_URL}
                className="font-medium text-zinc-950 underline break-all"
                rel="noopener noreferrer"
                target="_blank"
              >
                {AD_SETTINGS_URL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              5. Your choices
            </h2>
            <p className="mt-2">
              Use{" "}
              <span className="inline-flex align-baseline">
                <CookieSettingsButton />
              </span>{" "}
              in the footer (or the consent bar) to accept or reject analytics at
              any time. You can also block or delete cookies in your browser. If
              your browser sends a Global Privacy Control (GPC) signal, we treat
              analytics as rejected and do not show the consent bar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">6. Your rights</h2>
            <p className="mt-2">
              To request access to or deletion of personal data we may hold about
              you in connection with this site, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-zinc-950 underline"
              >
                {CONTACT_EMAIL}
              </a>
              . We will respond as required by applicable law. Note that
              calculator inputs are not sent to our servers, so we typically have
              no calculation data to retrieve.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">7. Children</h2>
            <p className="mt-2">
              This site is not directed at children. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              8. Changes to this policy
            </h2>
            <p className="mt-2">
              We may update this policy from time to time. The “Last updated”
              date at the top of this page reflects when the published version
              was built. Continued use of the site after changes means you should
              review this page for the current terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
