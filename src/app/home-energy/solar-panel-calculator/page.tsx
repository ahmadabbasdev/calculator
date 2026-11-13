import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Sun } from "lucide-react";
import { SolarPanelCalculator } from "@/components/calculators/SolarPanelCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  DEFAULT_LOSSES_PERCENT,
  DEFAULT_SUN_HOURS,
  calculateSolar,
  productionReferenceRow,
  yieldPerKw,
} from "@/lib/utils/solar";

const PAGE_PATH = "/home-energy/solar-panel-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Solar Panel Calculator — Size & Savings";
const PAGE_DESCRIPTION =
  "Free solar panel calculator: estimate system size in kW, panel count, yearly production, cost and simple payback from your kWh use and sun hours — free.";

const SAMPLE = calculateSolar({
  mode: "size",
  useKwh: 7300,
  usePeriod: "year",
  sunHours: 5,
  lossesPercent: 20,
  sharePercent: 100,
  panelWatts: 500,
  panelAreaM2: 2.2,
  pricePerKwh: 0.2,
  costPerWatt: 0.8,
  excessValuePercent: 0,
  degradationPercent: 0,
  priceIncreasePercent: 0,
  lifetimeYears: 25,
});

const REF_SIZES_KW = [3, 5, 8, 10];
const REF_SUN_HOURS = [3.5, 4.5, 5.5];
const REFERENCE_ROWS = REF_SIZES_KW.flatMap((kw) =>
  REF_SUN_HOURS.map((sun) => productionReferenceRow(kw, sun, 20)),
);

export const FAQ_ITEMS = [
  {
    question: "How many solar panels do I need?",
    answer: `Panel count follows from the kW you need and the wattage of each panel: ceil(needed kW × 1000 ÷ panel watts). With the worked example of ${SAMPLE.ok ? SAMPLE.neededKw?.toFixed(2) : "5.00"} kW needed and 500 W panels, that is ${SAMPLE.ok ? SAMPLE.panelCount : 10} panels. Your own use, sun hours, losses and share change the answer.`,
  },
  {
    question: "How is solar payback calculated?",
    answer:
      "Simple payback divides estimated installed cost by year-1 savings (cost ÷ year-1 savings). The lifetime view accumulates yearly savings that can include optional degradation and electricity-price increase, and reports the year when cumulative savings reach cost, with linear interpolation inside that year. Neither figure is a financial recommendation.",
  },
  {
    question: "What are peak sun hours?",
    answer:
      "Peak sun hours are equivalent full-sun hours per day for your location and season — not clock hours of daylight. Enter a figure for your area; the default on this page is only an editable example.",
  },
  {
    question: "How do I find monthly kWh on my bill?",
    answer:
      "Most electricity bills list kilowatt-hours used for the billing period. Use that figure with the per-month toggle, or multiply by 12 for an annual estimate if your months vary.",
  },
  {
    question: "What do kW and kWh mean here?",
    answer:
      "Kilowatts (kW) describe system size — how large the array is. Kilowatt-hours (kWh) describe energy use or production over time. Yield per kW is annual kWh produced for each installed kilowatt after losses.",
  },
  {
    question: "Does this include batteries, incentives or net metering?",
    answer:
      "No. You can set a value for excess generation as a percent of your electricity price if you want to model a credit, but the tool does not apply any programme, subsidy, tax credit or utility tariff. Rules change by place and over time.",
  },
  {
    question: "Is this a substitute for an installer quote?",
    answer:
      "No. Results are estimates from the numbers you enter. Roof direction and tilt, shading, equipment, installation quality, weather and local electricity rules all change real systems. A qualified installer must size and install a system — electrical safety matters.",
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
  name: "Solar Panel Calculator",
  url: CANONICAL_URL,
  description: PAGE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
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
      name: "Home & Energy",
      item: `${SITE_URL}/home-energy`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Solar Panel Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function SolarPanelCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const sampleYield = yieldPerKw(DEFAULT_SUN_HOURS, DEFAULT_LOSSES_PERCENT / 100);

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
          theme="home"
          items={[
            { label: "Home", href: "/" },
            { label: "Home & Energy", href: "/home-energy" },
            { label: "Solar Panel Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Sun className="size-4.5" aria-hidden="true" />
            System size, production and payback estimate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Solar Panel Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate how many panels and kilowatts cover a share of your
            electricity use, then optionally add a price and cost per watt for
            savings and simple payback. For room heating and cooling capacity,
            see the{" "}
            <Link
              href="/home-energy/btu-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              BTU Calculator
            </Link>
            ; for loan payment schedules, the{" "}
            <Link
              href="/finance/loan-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Loan Calculator
            </Link>
            ; for percent-of and percent-change math, the{" "}
            <Link
              href="/math/percentage-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Percentage Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <SolarPanelCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="how-to-use-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="how-to-use-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How to Use This Tool
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Two tabs cover sizing from use and production from a known
                system.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Open Size my system and enter monthly or yearly kWh, peak sun
                hours, losses and the share of use you want to cover.
              </li>
              <li>
                Optionally add electricity price, installed cost per watt,
                excess-value percent, degradation and price increase for savings,
                cost and lifetime views.
              </li>
              <li>
                Or open What will my system produce and enter kW (or panel count
                and wattage) with the same sun and loss inputs.
              </li>
            </ol>
          </section>

          <section aria-labelledby="sizing-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="sizing-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How System Size Is Worked Out
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                From annual use, sun hours, losses and panel wattage.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Yield per kilowatt equals peak sun hours per day × 365 × (1 −
                losses). Needed kilowatts equal annual use × share ÷ that yield.
                Panel count is the ceiling of needed kW × 1,000 ÷ panel watts.
                Installed kW is panels × watts ÷ 1,000, so production can be a
                little higher than the exact need when the count rounds up.
              </p>
              <p>
                Worked example (inputs you can re-enter): annual use 7,300 kWh,
                {` ${DEFAULT_SUN_HOURS} `}
                sun hours, {DEFAULT_LOSSES_PERCENT}% losses, 100% share, 500 W
                panels. Yield is {sampleYield.toLocaleString("en-US")} kWh per
                kW. Needed size is{" "}
                {SAMPLE.ok && SAMPLE.neededKw !== null
                  ? SAMPLE.neededKw.toFixed(2)
                  : "5.00"}{" "}
                kW → {SAMPLE.ok ? SAMPLE.panelCount : 10} panels (
                {SAMPLE.ok ? SAMPLE.installedKw.toFixed(2) : "5.00"} kW
                installed) and about{" "}
                {SAMPLE.ok
                  ? Math.round(SAMPLE.annualProductionKwh).toLocaleString("en-US")
                  : "7,300"}{" "}
                kWh per year. With price 0.20 and cost 0.80 per watt in the same
                currency, year-1 savings and cost produce a simple payback near{" "}
                {SAMPLE.ok && SAMPLE.simplePaybackYears !== null
                  ? SAMPLE.simplePaybackYears.toFixed(2)
                  : "2.74"}{" "}
                years. Those money figures are not typical rates — they are only
                the numbers typed into the example.
              </p>
            </div>
          </section>

          <section aria-labelledby="units-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="units-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                kW, kWh and Peak Sun Hours
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Capacity versus energy, and equivalent full-sun hours.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Kilowatts measure how large the array is. Kilowatt-hours measure
                energy used or produced over time — the unit on most electricity
                bills. Peak sun hours are equivalent hours of full sun for a
                location and season, not the number of daylight hours on a
                clock. Enter a value for your area; the default is an editable
                example only.
              </p>
              <p>
                To read monthly kWh from a bill, find the kilowatt-hour total for
                the billing period. Use the per-month toggle with that figure, or
                convert to a yearly total if you average several months.
              </p>
            </div>
          </section>

          <section aria-labelledby="reference-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="reference-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Example System Sizes and Annual Production
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same yield function ({DEFAULT_LOSSES_PERCENT}
                % losses). Sun-hour columns are examples, not location advice.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[32rem] border-collapse text-left text-[14px]">
                <caption className="mb-2 text-left text-[13px] text-muted">
                  Annual kWh = installed kW × sun hours × 365 × (1 − losses)
                </caption>
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3">
                      System (kW)
                    </th>
                    <th scope="col" className="py-2 pr-3 tabular-nums">
                      Sun h/day
                    </th>
                    <th scope="col" className="py-2 tabular-nums">
                      Annual kWh
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.installedKw}-${row.sunHours}`}
                      className="border-b border-border/60 text-foreground tabular-nums"
                    >
                      <th scope="row" className="py-2 pr-3 text-left font-medium">
                        {row.installedKw}
                      </th>
                      <td className="py-2 pr-3">{row.sunHours}</td>
                      <td className="py-2">
                        {Math.round(row.annualProductionKwh).toLocaleString(
                          "en-US",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="payback-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="payback-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Simple Payback Versus Lifetime View
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Cost divided by year-1 savings, then optional year-by-year
                accumulation.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Year-1 savings use on-site production valued at your electricity
                price, plus any excess valued at price × the excess-value
                percent you enter (default zero). Simple payback is cost ÷
                year-1 savings when both are present. The lifetime chart and
                table apply optional yearly degradation and electricity-price
                increase to each year’s savings, sum them, and interpolate the
                payback year when cumulative savings cross cost. That is
                arithmetic on your inputs — not a forecast of bills, incentives
                or financing.
              </p>
              <p>
                Panel count follows wattage: larger panels mean fewer modules
                for the same kilowatts. Optional panel area estimates roof
                footprint as panels × area per panel; real layouts need walkways
                and setbacks that this page does not draw.
              </p>
              <p>
                When production exceeds annual use, the excess line appears and
                can be valued at zero or at a fraction of your electricity
                price. That fraction is not a claim about any utility programme —
                it is only a knob so you can explore “no credit” versus “partial
                credit” arithmetic with numbers you choose.
              </p>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Model
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Estimates only — no installer, brand or incentive advice.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Shading, roof tilt, orientation and seasonal weather detail</li>
              <li>Batteries, inverter sizing and wiring losses beyond the loss %</li>
              <li>Taxes, financing, loan interest — see the Loan Calculator for payments</li>
              <li>Degradation beyond the yearly percent you enter</li>
              <li>Changing utility rules, subsidies or net-metering programmes</li>
              <li>No companies, brands, affiliates or “get a quote” forms</li>
            </ul>
            <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                The chart plots cumulative savings as a solid line and installed
                cost as a dashed horizontal line when cost per watt is entered.
                Labels and a text alternative describe the same values so the
                comparison does not rely on colour alone. The yearly table lists
                each year’s savings and running total for the lifetime horizon
                you set (default 25 years).
              </p>
              <p>
                Share of use above 200% or losses above 60% trigger calm notes in
                the results panel. Empty or missing sun hours keep the outcome
                blank rather than inventing a location. Negatives are blocked.
                Internal math stays unrounded; displayed money and year figures
                use ordinary rounding for readability.
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
            </div>
            <div className="max-w-3xl divide-y divide-border border-y border-border">
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

          <section aria-labelledby="disclaimer-heading" className="max-w-3xl">
            <h2
              id="disclaimer-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Disclaimer
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              Results are estimates from the numbers you enter. Real systems
              depend on roof direction and tilt, shading, equipment, installation
              quality, weather, local electricity rules and prices. A qualified
              installer must size and install a system — electrical safety
              matters. This page does not recommend installers, brands,
              subsidies or incentives. Your inputs stay in the browser and are
              not stored by CalcDaily.
            </p>
            <p className="mt-2 text-[12px] text-zinc-500">
              Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
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
                Battery backup runtime, heating capacity, and unit conversion.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/home-energy/battery-backup-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Battery Backup Time Calculator
                </span>
                <span className="text-sm text-muted">
                  UPS and inverter runtime from volts, Ah and load
                </span>
              </a>
              <a
                href="/home-energy/btu-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BTU Calculator
                </span>
                <span className="text-sm text-muted">
                  Room AC and heater BTU/h, tons, and thermal kW
                </span>
              </a>
              <a
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, mass, volume, temperature and more
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
