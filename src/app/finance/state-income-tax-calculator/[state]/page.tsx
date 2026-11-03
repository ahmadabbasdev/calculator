import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Landmark } from "lucide-react";
import { StateIncomeTaxCalculator } from "@/components/calculators/StateIncomeTaxCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  buildStateFaqs,
  buildStatePageSections,
  formatExampleSummary,
} from "@/lib/state-tax/content";
import {
  assertUniqueStateMetaDescriptions,
  buildStateMetaDescription,
  buildStatePageTitle,
  formatRatePercent,
  getVerifiedTaxableStates,
  getVerifiedStateBySlug,
  hubHref,
  stateCodeToSlug,
  stateHref,
} from "@/lib/state-tax/load";
import { FILING_STATUSES } from "@/lib/state-tax/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type PageProps = {
  params: Promise<{ state: string }>;
};

export function generateStaticParams() {
  assertUniqueStateMetaDescriptions();
  return getVerifiedTaxableStates().map((state) => ({
    state: stateCodeToSlug(state.code),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getVerifiedStateBySlug(slug);
  if (!state) {
    return { title: "Not found" };
  }
  const title = buildStatePageTitle(state);
  const description = buildStateMetaDescription(state);
  const canonical = `${SITE_URL}${stateHref(state.code)}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StateIncomeTaxStatePage({ params }: PageProps) {
  const { state: slug } = await params;
  const state = getVerifiedStateBySlug(slug);
  if (!state) {
    notFound();
  }

  const sections = buildStatePageSections(state);
  if (sections.length < 5) {
    throw new Error(
      `${state.code} page would render fewer than 5 data-driven sections.`,
    );
  }

  const faqs = buildStateFaqs(state);
  const examples = formatExampleSummary(state);
  const peers = getVerifiedTaxableStates()
    .filter((item) => item.code !== state.code)
    .slice(0, 3);
  const canonical = `${SITE_URL}${stateHref(state.code)}`;

  const webApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${state.name} State Income Tax Calculator`,
    url: canonical,
    description: buildStateMetaDescription(state),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const faqPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
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
        name: "Finance",
        item: `${SITE_URL}/finance`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "State Income Tax Calculator",
        item: `${SITE_URL}${hubHref()}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: state.name,
        item: canonical,
      },
    ],
  };

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
          theme="finance"
          items={[
            { label: "Home", href: "/" },
            { label: "Finance", href: "/finance" },
            { label: "State Income Tax", href: hubHref() },
            { label: state.name },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-finance">
            <Landmark className="size-4.5" aria-hidden="true" />
            Tax year {state.taxYear} · last verified {state.lastVerified}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {state.name} State Income Tax Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate {state.name} ({state.code}) state income tax using verified{" "}
            {state.structure} rates for tax year {state.taxYear}. State tax only
            — federal tax, FICA, local taxes, credits and withholding are not
            included.
          </p>
        </header>

        {sections.includes("calculator") ? (
          <section aria-labelledby="calc-heading" data-section="calculator">
            <h2 id="calc-heading" className="sr-only">
              Calculator
            </h2>
            <StateIncomeTaxCalculator
              states={[state]}
              lockedStateCode={state.code}
            />
          </section>
        ) : null}

        <article className="mt-20 space-y-16">
          {sections.includes("brackets") ? (
            <section
              aria-labelledby="brackets-heading"
              data-section="brackets"
            >
              <h2
                id="brackets-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                {state.name} tax brackets ({state.taxYear})
              </h2>
              <div className="mt-4 space-y-8">
                {FILING_STATUSES.map((status) => (
                  <div key={status.id}>
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {status.label}
                    </h3>
                    <div className="mt-2 overflow-x-auto rounded-xl border border-border/80">
                      <table className="min-w-[24rem] w-full border-collapse text-left text-[14px]">
                        <caption className="sr-only">
                          {state.name} {status.label} brackets
                        </caption>
                        <thead>
                          <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                            <th scope="col" className="px-4 py-3">
                              From
                            </th>
                            <th scope="col" className="px-4 py-3">
                              To
                            </th>
                            <th scope="col" className="px-4 py-3">
                              Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.brackets[status.id].map((bracket) => (
                            <tr
                              key={`${status.id}-${bracket.from}-${bracket.rate}`}
                              className="border-b border-border/70 last:border-0"
                            >
                              <td className="px-4 py-3 tabular-nums text-zinc-800">
                                {bracket.from.toLocaleString("en-US")}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-zinc-800">
                                {bracket.to === null
                                  ? "and above"
                                  : bracket.to.toLocaleString("en-US")}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-zinc-800">
                                {formatRatePercent(bracket.rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {sections.includes("deductions") ? (
            <section
              aria-labelledby="deductions-heading"
              data-section="deductions"
            >
              <h2
                id="deductions-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Standard deduction and exemption
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FILING_STATUSES.map((status) => (
                  <div
                    key={status.id}
                    className="rounded-lg border border-border/70 bg-panel px-4 py-3"
                  >
                    <dt className="text-[12px] font-semibold text-muted">
                      {status.label}
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {state.standardDeduction[status.id].toLocaleString(
                        "en-US",
                      )}
                    </dd>
                  </div>
                ))}
                {state.personalExemption != null ? (
                  <div className="rounded-lg border border-border/70 bg-panel px-4 py-3">
                    <dt className="text-[12px] font-semibold text-muted">
                      Personal exemption
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                      {state.personalExemption.toLocaleString("en-US")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {sections.includes("examples") ? (
            <section
              aria-labelledby="examples-heading"
              data-section="examples"
            >
              <h2
                id="examples-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Worked examples (single filer)
              </h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">
                Computed from this page&apos;s verified {state.taxYear} data with
                no pre-tax deductions.
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border/80">
                <table className="min-w-[24rem] w-full border-collapse text-left text-[14px]">
                  <caption className="sr-only">
                    Single-filer examples at 40,000, 80,000 and 150,000
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                      <th scope="col" className="px-4 py-3">
                        Gross income
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Estimated state tax
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Effective rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {examples.map((row) => (
                      <tr
                        key={row.gross}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {row.gross.toLocaleString("en-US")}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {row.tax}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-800">
                          {row.effective}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {sections.includes("notes") ? (
            <section aria-labelledby="notes-heading" data-section="notes">
              <h2
                id="notes-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Notes
              </h2>
              <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
                {state.notes.map((note) => (
                  <li key={note.text}>
                    {note.text}{" "}
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      Source
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sections.includes("local-tax") && state.localTaxNote ? (
            <section
              aria-labelledby="local-heading"
              data-section="local-tax"
              className="max-w-3xl"
            >
              <h2
                id="local-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Local tax note
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {state.localTaxNote}
              </p>
            </section>
          ) : null}

          {sections.includes("sources") ? (
            <section aria-labelledby="sources-heading" data-section="sources">
              <h2
                id="sources-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Official sources
              </h2>
              <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
                {state.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sections.includes("verified") ? (
            <section
              aria-labelledby="verified-heading"
              data-section="verified"
              className="max-w-3xl"
            >
              <h2
                id="verified-heading"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Verification
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Tax year {state.taxYear}, last verified {state.lastVerified}.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
                Estimates for general information only. Not tax advice. Check
                official figures with your state&apos;s revenue department or a
                tax professional.
              </p>
            </section>
          ) : null}

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently Asked Questions
            </h2>
            <div className="mt-4 max-w-3xl divide-y divide-border/80">
              {faqs.map((item) => (
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
            <h2
              id="related-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Related Calculators
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href={hubHref()}
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  State Income Tax hub
                </span>
                <span className="text-sm text-muted">
                  All verified states and comparison table
                </span>
              </Link>
              {peers.map((peer) => (
                <Link
                  key={peer.code}
                  href={stateHref(peer.code)}
                  className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-finance/45 hover:bg-cat-finance-soft"
                >
                  <span className="text-[15px] font-semibold text-foreground">
                    {peer.name} income tax
                  </span>
                  <span className="text-sm text-muted">
                    Tax year {peer.taxYear}, {peer.structure} schedule
                  </span>
                </Link>
              ))}
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
