import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Landmark } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import {
  assertStateTaxBuildGates,
  formatRatePercent,
  getNoWageTaxRosterEntries,
  getPoorFitListedStates,
  getPublishedTaxableStates,
  hubHref,
  isStateTaxSurfaceEnabled,
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
  if (!isStateTaxSurfaceEnabled()) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
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

export default function StateIncomeTaxHubPage() {
  if (!isStateTaxSurfaceEnabled()) {
    notFound();
  }

  assertStateTaxBuildGates();
  const taxable = getPublishedTaxableStates();
  const noWage = getNoWageTaxRosterEntries();
  const poorFit = getPoorFitListedStates();

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

  const itemListJsonLd =
    taxable.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Published state income tax calculators",
          numberOfItems: taxable.length,
          itemListElement: taxable.map((state, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${state.name} State Income Tax Calculator`,
            url: `${SITE_URL}${stateHref(state)}`,
          })),
        }
      : null;

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
      {itemListJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListJsonLd),
          }}
        />
      ) : null}

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
            Choose a state to continue
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            US State Income Tax Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Select a published state below to open its calculator. Figures come
            from official sources for the tax year shown on each state page.
          </p>
          <LastReviewed
            reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt}
          />
        </header>

        <section aria-labelledby="choose-state-heading" className="mb-16">
          <h2
            id="choose-state-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Choose a state
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">
            Each state opens its own calculator page with that schedule.
          </p>
          {taxable.length === 0 ? (
            <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-zinc-700">
              No state schedules are published yet. When a sourced schedule is
              verified, it will appear here.
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {taxable
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((state) => {
                  const topRate = formatRatePercent(topMarginalRate(state));
                  const structureLabel =
                    state.structure === "flat"
                      ? "Flat rate"
                      : state.structure === "progressive"
                        ? "Progressive"
                        : state.structure;
                  return (
                    <li key={state.code}>
                      <a
                        href={stateHref(state)}
                        className="card-transition group flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-card outline-none hover:border-zinc-400 hover:shadow-card-hover focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <span className="flex size-11 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-[13px] font-bold tracking-wide text-zinc-800">
                            {state.code}
                          </span>
                          <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-zinc-700">
                            {structureLabel}
                          </span>
                        </div>

                        <span className="block text-lg font-semibold leading-snug text-zinc-900">
                          {state.name}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-zinc-600">
                          State income tax calculator
                        </span>

                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              Tax year
                            </dt>
                            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-zinc-900">
                              {state.taxYear}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              Top rate
                            </dt>
                            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-zinc-900">
                              {topRate}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              Data last verified
                            </dt>
                            <dd className="mt-0.5 text-[14px] tabular-nums text-zinc-700">
                              {state.lastVerified}
                            </dd>
                          </div>
                        </dl>

                        <span className="mt-auto block pt-5" aria-hidden="true">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors group-hover:bg-zinc-800">
                            Open calculator
                            <ArrowRight className="size-3.5" />
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        <article className="space-y-16">
          <section aria-labelledby="comparison-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="comparison-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Published states
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Structure, top rate, single-filer standard deduction, tax year,
                data last verified, and a link to an official source.
              </p>
            </div>
            {taxable.length === 0 ? (
              <p className="max-w-3xl text-[15px] leading-relaxed text-zinc-700">
                No state schedules are published yet. When a sourced schedule is
                verified, it will appear in this table with a link to its
                calculator page.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="min-w-[48rem] w-full border-collapse text-left text-[14px]">
                  <caption className="sr-only">
                    Published US state income tax schedules
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
                        Data last verified
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Official source
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Page
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxable
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((state) => {
                        const source = state.sources[0];
                        return (
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
                              {formatRatePercent(topMarginalRate(state))}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-zinc-800">
                              {state.standardDeduction.single.toLocaleString(
                                "en-US",
                              )}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-zinc-800">
                              {state.taxYear}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-zinc-800">
                              {state.lastVerified}
                            </td>
                            <td className="px-4 py-3">
                              {source ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-foreground underline underline-offset-2"
                                >
                                  {source.label}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={stateHref(state)}
                                className="font-medium text-foreground underline underline-offset-2"
                              >
                                Open calculator
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {noWage.length > 0 ? (
            <section aria-labelledby="no-wage-heading">
              <h2
                id="no-wage-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                No state income tax on wages
              </h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">
                These jurisdictions are listed for reference only. They do not
                get a calculator page.
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border/80">
                <table className="min-w-[20rem] w-full border-collapse text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                      <th scope="col" className="px-4 py-3">
                        State
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {noWage.map((entry) => (
                      <tr
                        key={entry.code}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.name} ({entry.code})
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          No state income tax on wages
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {poorFit.length > 0 ? (
            <section aria-labelledby="not-covered-heading">
              <h2
                id="not-covered-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Not covered yet
              </h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">
                These states do not fit the calculator model well enough for a
                page. Plain text only — no calculator links.
              </p>
              <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
                {poorFit.map((state) => (
                  <li key={state.code}>
                    <span className="font-medium text-foreground">
                      {state.name}
                    </span>
                    {state.modelFitReason
                      ? ` — ${state.modelFitReason}`
                      : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="how-heading" className="max-w-3xl space-y-4">
            <h2
              id="how-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How state income tax works on this site
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">
              State income tax is separate from federal income tax. Taxable
              income here is estimated as annual gross income minus optional
              pre-tax deductions, minus the standard deduction for the filing
              status, minus a personal exemption when the state schedule includes
              one. Tax is the sum of income in each bracket multiplied by that
              bracket&apos;s rate, using integer cents so rows add up.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Flat schedules use one open-ended rate. Progressive schedules use
              contiguous brackets that start at zero. This hub covers{" "}
              <strong className="font-semibold text-foreground">
                state income tax only
              </strong>
              — not federal tax, FICA, local taxes, credits, or withholding.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Each published state page shows its tax year, last verified date,
              notes, facts, and official sources. Estimates are general
              information only — not tax advice. Confirm figures with the state
              revenue department or a tax professional.
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
