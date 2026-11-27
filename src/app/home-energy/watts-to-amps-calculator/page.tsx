import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChevronDown } from "lucide-react";
import { WattsToAmpsCalculator } from "@/components/calculators/WattsToAmpsCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  SQRT3,
  calculateElectrical,
  wattsAmpsReferenceRow,
  wattsToAmps,
} from "@/lib/utils/electrical";

const PAGE_PATH = "/home-energy/watts-to-amps-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Watts to Amps Calculator — AC & DC";
const PAGE_DESCRIPTION =
  "Free watts to amps calculator: convert watts and amps for DC, single-phase and three-phase, plus kVA ↔ kW and Ohm’s law for resistive circuits.";

const SAMPLE_1000 = calculateElectrical({
  tab: "watts-amps",
  direction: "watts-to-amps",
  circuit: "single",
  voltage: 230,
  watts: 1000,
  amps: null,
  powerFactor: 1,
});

const SAMPLE_DC = calculateElectrical({
  tab: "watts-amps",
  direction: "watts-to-amps",
  circuit: "dc",
  voltage: 12,
  watts: 60,
  amps: null,
  powerFactor: null,
});

const SAMPLE_THREE = calculateElectrical({
  tab: "watts-amps",
  direction: "watts-to-amps",
  circuit: "three",
  voltage: 400,
  watts: 10_000,
  amps: null,
  powerFactor: 0.8,
});

const REF_WATTS = [100, 500, 1000, 2000, 5000] as const;
const REF_VOLTAGES = [120, 230, 240] as const;
const REFERENCE_ROWS = REF_WATTS.flatMap((watts) =>
  REF_VOLTAGES.map((voltage) =>
    wattsAmpsReferenceRow({ watts, voltage, circuit: "single", powerFactor: 1 }),
  ),
);

export const FAQ_ITEMS = [
  {
    question: "How many amps is 1,000 watts?",
    answer: `It depends on voltage, circuit type and power factor. On single-phase AC at 230 V with power factor 1.00, 1,000 W is about ${SAMPLE_1000.ok && SAMPLE_1000.tab === "watts-amps" ? SAMPLE_1000.amps.toFixed(2) : "4.35"} A (I = P ÷ (V × PF)). At a lower power factor the current is higher for the same watts.`,
  },
  {
    question: "How do I convert amps to watts?",
    answer:
      "For DC, watts = volts × amps. For single-phase AC, watts = volts × amps × power factor. For three-phase AC (line-to-line voltage), watts = √3 × volts × amps × power factor, with √3 = 1.7320508 on this page. Enter amps and voltage on the Watts and amps tab with direction set to amps → watts.",
  },
  {
    question: "What is the difference between kVA and kW?",
    answer:
      "Kilowatts (kW) are real power that does useful work. Kilovolt-amperes (kVA) are apparent power — volts × amps (with √3 for three-phase). Power factor links them: kW = kVA × PF, and kVA = kW ÷ PF. A lower power factor means more apparent current for the same real power.",
  },
  {
    question: "What power factor should I enter?",
    answer:
      "Use the figure on the equipment label when you have one. The default 1.00 suits resistive loads such as heaters. Motors and many electronics often sit below 1. Power factor must be above 0 and at most 1.",
  },
  {
    question: "Is three-phase voltage line-to-line or line-to-neutral?",
    answer: `This calculator’s three-phase formulas use line-to-line voltage with √3 = ${SQRT3}. Do not mix line-to-neutral figures into the three-phase path without converting first.`,
  },
  {
    question: "Does Ohm’s law work for every circuit?",
    answer:
      "The Ohm’s law tab is for resistive circuits only (V = I × R and the related power forms). Reactive loads, motors and electronics with power factor below 1 need the watts/amps or kVA paths instead.",
  },
  {
    question: "Can I use this to choose wire or breaker size?",
    answer:
      "No. This page does not recommend cable sizes, fuses or breakers. Startup current can be much higher than running current. Wiring and protection must be chosen by a qualified electrician under your local rules.",
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
  name: "Watts to Amps Calculator",
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
      name: "Watts to Amps Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function WattsToAmpsCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const sample1000Amps =
    SAMPLE_1000.ok && SAMPLE_1000.tab === "watts-amps"
      ? SAMPLE_1000.amps
      : wattsToAmps(1000, 230, "single", 1);

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
            { label: "Watts to Amps Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Activity className="size-4.5" aria-hidden="true" />
            Watts, amps, kVA and Ohm&apos;s law
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Watts to Amps Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Convert watts and amps for DC, single-phase and three-phase
            circuits, switch between kVA and kW, or solve Ohm&apos;s law for
            resistive loads. For running cost from watts and hours see the{" "}
            <Link
              href="/home-energy/electricity-cost-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Electricity Cost Calculator
            </Link>
            ; for UPS runtime the{" "}
            <Link
              href="/home-energy/battery-backup-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Battery Backup Time Calculator
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <WattsToAmpsCalculator />

        <article className="mt-20 space-y-20">
          <section aria-labelledby="meaning-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="meaning-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Volts, Amps, Watts and Power Factor
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Plain-language meanings for the numbers on this page.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Voltage (volts) is the electrical potential of the circuit.
                Current (amps) is how much charge flows. Power in watts is the
                rate of energy use. On DC and on perfectly resistive AC loads,
                watts equal volts × amps. Many AC loads are not purely
                resistive: power factor (PF) is the fraction of apparent power
                that becomes real power. PF is between just above 0 and 1; the
                default 1.00 on this tool is for resistive loads. Motors and
                many electronics sit below 1 — check the equipment label.
              </p>
              <p>
                Kilowatts (kW) measure real power. Kilovolt-amperes (kVA)
                measure apparent power. They meet through power factor: kW =
                kVA × PF. A lower PF means more amps for the same useful watts,
                which is why transformers and generators are often rated in
                kVA.
              </p>
            </div>
          </section>

          <section aria-labelledby="formulas-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="formulas-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                The Three Power Formulas
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                DC, single-phase AC and three-phase AC, each with a worked
                example.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                DC: P = V × I, so I = P ÷ V. Example: 60 W at 12 V draws{" "}
                {SAMPLE_DC.ok && SAMPLE_DC.tab === "watts-amps"
                  ? SAMPLE_DC.amps.toFixed(0)
                  : "5"}{" "}
                A. Single-phase AC: P = V × I × PF, so I = P ÷ (V × PF). Example:
                1,000 W at 230 V with PF 1.00 is about{" "}
                {sample1000Amps.toFixed(2)} A; at PF 0.8 the same watts need
                about {(1000 / (230 * 0.8)).toFixed(2)} A. Three-phase AC uses
                line-to-line voltage: P = √3 × V × I × PF with √3 = {SQRT3}.
                Example: 10,000 W at 400 V and PF 0.8 gives about{" "}
                {SAMPLE_THREE.ok && SAMPLE_THREE.tab === "watts-amps"
                  ? SAMPLE_THREE.amps.toFixed(2)
                  : "18.04"}{" "}
                A. The results panel fills the same formula with your numbers
                and shows apparent power in VA or kVA.
              </p>
              <p>
                Single-phase is the everyday AC supply in many homes (one live
                and neutral for the load). Three-phase delivers three
                alternating voltages offset in time and is common for larger
                motors and distribution; this page’s three-phase path expects
                line-to-line volts. Neither path sizes cable or protection.
              </p>
            </div>
          </section>

          <section aria-labelledby="table-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Example Watts Against Amps
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Single-phase, power factor 1.00, from the same conversion
                function. Wattages are examples, not typical values for any
                device.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[32rem] border-collapse text-left text-[14px]">
                <caption className="mb-2 text-left text-[13px] text-muted">
                  I = P ÷ (V × PF) with PF = 1
                </caption>
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3">
                      Watts
                    </th>
                    <th scope="col" className="py-2 pr-3 tabular-nums">
                      Voltage
                    </th>
                    <th scope="col" className="py-2 tabular-nums">
                      Amps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.watts}-${row.voltage}`}
                      className="border-b border-border/60 text-foreground tabular-nums"
                    >
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left font-medium"
                      >
                        {row.watts.toLocaleString("en-US")}
                      </th>
                      <td className="py-2 pr-3">{row.voltage} V</td>
                      <td className="py-2">
                        {row.amps.toLocaleString("en-US", {
                          maximumFractionDigits: 3,
                        })}{" "}
                        A
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="kva-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="kva-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                kVA, kW and Ohm&apos;s Law
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Apparent power conversions and resistive-circuit solving.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                On the kVA and kW tab, kW = kVA × PF and kVA = kW ÷ PF. For amps
                from kVA: single-phase kVA = V × I ÷ 1000; three-phase kVA = √3 ×
                V × I ÷ 1000. Example: 5 kVA at PF 0.8 is 4 kW; 4 kW at PF 0.8 is
                5 kVA. Three-phase 400 V at 20 A is about 13.856 kVA (13,856 VA)
                and about 11.085 kW when PF is 0.8.
              </p>
              <p>
                Ohm&apos;s law on this page is for resistive circuits only.
                Enter any two of voltage, current, resistance and power; the
                other two follow from V = I × R, P = V × I, P = I² × R and P =
                V² ÷ R. Example: 12 V across 6 Ω gives 2 A and 24 W. Example: 100
                W at 230 V gives about 0.435 A and 529 Ω.
              </p>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="limits-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What This Calculator Does Not Cover
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Educational conversion only — not product or wiring advice.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Startup or inrush current higher than running current</li>
              <li>Harmonics, unbalanced three-phase loads and non-sinusoidal waveforms</li>
              <li>Wire gauge, fuse or breaker selection</li>
              <li>No brands, product picks or installation instructions</li>
            </ul>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">
              For appliance energy cost see the{" "}
              <Link
                href="/home-energy/electricity-cost-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Electricity Cost Calculator
              </Link>
              ; for room heating and cooling capacity the{" "}
              <Link
                href="/home-energy/btu-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                BTU Calculator
              </Link>
              ; for UPS pack runtime the{" "}
              <Link
                href="/home-energy/battery-backup-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Battery Backup Time Calculator
              </Link>
              ; for unit conversion the{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Unit Converter
              </Link>
              .
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
              These results are calculated from the numbers you enter. Real
              appliances change what they draw over time, and startup current
              can be much higher than running current. Wiring, fuses and
              breakers must be chosen by a qualified electrician under your
              local rules. This page does not recommend products, brands or
              cable sizes. Your inputs stay in the browser and are not stored by
              CalcDaily.
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
                Electricity cost, room capacity, battery runtime, and unit
                conversion.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/home-energy/electricity-cost-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Electricity Cost Calculator
                </span>
                <span className="text-sm text-muted">
                  Watts to kWh and appliance or bill cost estimates
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
