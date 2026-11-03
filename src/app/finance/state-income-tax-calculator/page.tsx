import type { Metadata } from "next";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { StateIncomeTaxCalculator } from "@/components/calculators/StateIncomeTaxCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  assertUniqueStateMetaDescriptions,
  formatRatePercent,
  getVerifiedNoneStates,
  getVerifiedTaxableStates,
  hubHref,
  stateHref,
  topMarginalRate,
} from "@/lib/state-tax/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = hubHref();
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "US State Income Tax Calculator - Verified States";
const PAGE_DESCRIPTION =
  "Estimate state income tax for verified US states using sourced brackets and deductions. State tax only — not federal, FICA or local tax advice.";

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
  name: "US State Income Tax Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Finance",
      item: `${SITE_URL}/finance`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "State Income Tax Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function StateIncomeTaxHubPage() {
  assertUniqueStateMetaDescriptions();
  const taxable = getVerifiedTaxableStates();
  const noneStates = getVerifiedNoneStates();
  const tableStates = [...taxable, ...noneStates].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          theme="finance"
          items={[
            { label: "Home", href: "/" },
            { label: "Finance", href: "/finance" },
            { label: "State Income Tax Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Landmark className="size-4.5" aria-hidden="true" />
            Verified state schedules only
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            US State Income Tax Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate state income tax using brackets and deductions copied from
            official sources and marked verified in our data files. Pages exist
            only for those states — nothing is invented at build time.
          </p>
        </header>

        <StateIncomeTaxCalculator states={taxable} />

        <article className="mt-20 space-y-16">
          <section aria-labelledby="comparison-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="comparison-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Verified states
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Comparison of structure, top rate and single-filer standard
                deduction from verified data files.
              </p>
            </div>
            {tableStates.length === 0 ? (
              <p className="max-w-3xl text-[15px] leading-relaxed text-zinc-700">
                No verified state files are published yet. Add a completed{" "}
                <code className="text-[13px]">data/state-tax/XX.json</code> with{" "}
                <code className="text-[13px]">verified: true</code> to list a
                state here. The fictional Testland fixture is for tests only and
                never appears on this page.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="min-w-[40rem] w-full border-collapse text-left text-[14px]">
                  <caption className="sr-only">
                    Verified US state income tax schedules
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                      <th scope="col" className="px-4 py-3">
                        State
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Structure
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Top rate
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Single standard deduction
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Tax year
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Page
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStates.map((state) => (
                      <tr
                        key={state.code}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {state.name} ({state.code})
                        </td>
                        <td className="px-4 py-3 text-zinc-800">
                          {state.structure}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {state.structure === "none"
                            ? "—"
                            : formatRatePercent(topMarginalRate(state))}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {state.structure === "none"
                            ? "—"
                            : state.standardDeduction.single.toLocaleString(
                                "en-US",
                              )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {state.taxYear}
                        </td>
                        <td className="px-4 py-3">
                          {state.structure === "none" ? (
                            <span className="text-zinc-600">Hub listing only</span>
                          ) : (
                            <Link
                              href={stateHref(state.code)}
                              className="font-medium text-foreground underline underline-offset-2"
                            >
                              Open calculator
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="how-heading" className="max-w-3xl space-y-4">
            <h2
              id="how-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How state income tax works on this site
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">
              State income tax is a separate layer from federal income tax. After
              you estimate taxable income for a filing status, many states apply
              either a single flat rate or a ladder of progressive brackets. On
              CalcDaily, taxable income is estimated as annual gross income minus
              optional pre-tax deductions you enter, minus the standard deduction
              for the selected filing status, minus a personal exemption when the
              verified state file includes one. Amounts below zero become zero.
              State tax is then the sum, across brackets, of the dollars that fall
              in each bracket multiplied by that bracket&apos;s rate. Money is
              handled in integer cents so bracket rows add up to the displayed
              total.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              A <strong className="font-semibold text-foreground">flat</strong>{" "}
              schedule uses exactly one open-ended bracket starting at zero: every
              dollar of taxable income is taxed at the same rate. A{" "}
              <strong className="font-semibold text-foreground">progressive</strong>{" "}
              schedule uses contiguous brackets that also start at zero; each
              slice of taxable income is taxed at its own rate, and the top
              bracket stays open-ended. The effective rate on this site is state
              tax divided by gross income; the marginal rate is the rate on the
              highest bracket that actually received taxable dollars. Take-home
              after state tax here means gross income minus estimated state tax
              only — it is not a paycheck simulation.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              States marked with structure{" "}
              <code className="text-[13px]">none</code> have no state income tax
              in the verified data. When such a file is verified, it appears as a
              row in the comparison table on this hub so readers can see the tax
              year and sources context, but it never receives a dedicated
              calculator page. That gate exists because near-identical empty
              templates at scale are not useful and can look like doorway
              content. A state page is published only when real, different,
              sourced schedule data is present and marked verified.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              This tool covers{" "}
              <strong className="font-semibold text-foreground">
                state income tax only
              </strong>
              . Federal income tax, FICA (Social Security and Medicare), local
              city or county taxes, credits, itemized deductions beyond the
              standard deduction in the file, alternative minimum tax, and
              employer withholding rules are not included. Local notes from a
              state file may mention locality rules for context, but this
              calculator does not compute local tax. Every state page repeats
              that scope limit prominently so estimates are not mistaken for a
              full tax return.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Data comes from JSON files under{" "}
              <code className="text-[13px]">data/state-tax</code>. Each value —
              brackets, rates, standard deductions, optional exemptions, notes,
              and official links — must be copied from the state revenue
              department (or equivalent) for the stated tax year. Verified files
              need at least one official source, two to five short factual notes
              with source URLs, and a{" "}
              <code className="text-[13px]">lastVerified</code> date within 450
              days. Zod validation at build time rejects unsorted or
              non-contiguous brackets, rates outside 0–1, a last bracket that is
              not open-ended, missing sources or notes on verified files, and
              stale verification dates. Files with{" "}
              <code className="text-[13px]">verified: false</code>, including the
              fictional Testland fixture used only in automated tests, never
              appear in this hub, in{" "}
              <code className="text-[13px]">generateStaticParams</code>, in the
              sitemap, or in <code className="text-[13px]">llms.txt</code>.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Titles, descriptions, FAQs, worked examples, and comparison rows
              are generated from each state&apos;s own numbers so pages differ in
              substance, not only in the state name. Meta descriptions must be
              unique across verified pages. Worked examples on each state page
              recompute single-filer estimates at 40,000, 80,000, and 150,000 of
              gross income from that file&apos;s brackets and deduction. Inputs
              stay in the browser: they are not placed in URLs, storage, cookies,
              or analytics events.
            </p>
            {taxable.length > 0 ? (
              <p className="text-[15px] leading-relaxed text-muted">
                Verified calculator pages currently published:{" "}
                {taxable.map((state, index) => (
                  <span key={state.code}>
                    {index > 0 ? ", " : null}
                    <Link
                      href={stateHref(state.code)}
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      {state.name}
                    </Link>
                  </span>
                ))}
                . Open a state page for brackets, deductions, examples, notes,
                and official sources for that tax year.
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-muted">
                No verified state calculator pages are published in this pilot
                build yet. When you add completed{" "}
                <code className="text-[13px]">XX.json</code> files with{" "}
                <code className="text-[13px]">verified: true</code>, each
                taxable state appears in the table above and as its own page
                under this hub. Links will be listed here automatically.
              </p>
            )}
            <p className="text-[13px] leading-relaxed text-zinc-600">
              Estimates for general information only. Not tax advice. Check
              official figures with your state&apos;s revenue department or a tax
              professional. This site does not claim figures are accurate,
              official, or up to date beyond showing each file&apos;s verified
              date. There is no ranking of states and no advice about where to
              live or work.
            </p>
          </section>

          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Related Calculators
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of a number and percent change
                </span>
              </Link>
              <Link
                href="/finance/salary-to-hourly-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Salary to Hourly Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert salary and hourly pay between periods
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
