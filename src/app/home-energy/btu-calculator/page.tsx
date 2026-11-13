import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Thermometer } from "lucide-react";
import { BtuCalculator } from "@/components/calculators/BtuCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  BTU_H_PER_TON,
  DEFAULT_CEILING_FT,
  DEFAULT_COOLING_BTU_PER_SQFT,
  SQFT_PER_SQM,
  WATTS_PER_BTU_H,
  btuHToTons,
  coolingReferenceRow,
} from "@/lib/utils/btu";

const PAGE_PATH = "/home-energy/btu-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "BTU Calculator — AC & Heater Room Size";
const PAGE_DESCRIPTION =
  "Free BTU calculator for air conditioner and heater sizing. Estimate BTU/h from room area, see tons and kW thermal, convert BTU/h — free in your browser.";

const REFERENCE_AREAS_SQFT = [150, 200, 250, 300, 400, 500, 600, 800, 1000];
const REFERENCE_ROWS = REFERENCE_AREAS_SQFT.map((area) =>
  coolingReferenceRow(area),
);
const SAMPLE_300 = coolingReferenceRow(300);
const SAMPLE_18000_TONS = btuHToTons(18_000);

export const FAQ_ITEMS = [
  {
    question: "How many BTU do I need for a 300 square foot room?",
    answer: `With the default cooling rule of thumb (${DEFAULT_COOLING_BTU_PER_SQFT} BTU/h per ft²), an 8 ft ceiling, normal sun, two people and no kitchen add-on, a 300 ft² room estimates about ${SAMPLE_300.btuPerHour.toLocaleString("en-US")} BTU/h (${SAMPLE_300.tons.toFixed(2)} ton, ${SAMPLE_300.kw.toFixed(2)} kW thermal). Sun, people, kitchens and ceiling height change that figure.`,
  },
  {
    question: "How many tons is 18,000 BTU?",
    answer: `One ton of cooling equals ${BTU_H_PER_TON.toLocaleString("en-US")} BTU/h, so 18,000 BTU/h is ${SAMPLE_18000_TONS.toFixed(2)} tons. The converter on this page uses the same factor.`,
  },
  {
    question: "What does BTU/h mean for an air conditioner?",
    answer:
      "BTU per hour measures thermal capacity — how much heat the unit can remove (cooling) or add (heating) each hour. It is not the same as electrical power drawn from the wall.",
  },
  {
    question: "How is the cooling estimate calculated?",
    answer: `Base BTU/h = area in ft² × BTU/h per ft² × (ceiling height in ft ÷ 8). Sun exposure adjusts the base by a percentage, each person beyond two can add a fixed amount, and a kitchen toggle can add another fixed amount. The displayed capacity rounds to the nearest 100 BTU/h.`,
  },
  {
    question: "Is this the same as a professional heat-load calculation?",
    answer:
      "No. This is a rough sizing estimate. Proper sizing considers insulation, windows, orientation, climate and local rules. Ask a qualified HVAC professional.",
  },
  {
    question: "How do I convert square metres to square feet?",
    answer: `This tool multiplies square metres by ${SQFT_PER_SQM} (exact). For other unit conversions, use the Unit Converter.`,
  },
  {
    question: "Does the heater result include electricity use?",
    answer:
      "No. Heating results are thermal output in BTU/h and kW. Fuel-burning heaters need proper ventilation; follow the manufacturer’s instructions. Electrical input depends on the equipment efficiency, which this page does not estimate.",
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
  name: "BTU Calculator",
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
      name: "BTU Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function BtuCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);

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
            { label: "BTU Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Thermometer className="size-4.5" aria-hidden="true" />
            Cooling and heating capacity estimate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            BTU Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate air-conditioner or heater BTU/h from room area and ceiling
            height, then see cooling tons and thermal kilowatts. For general
            length or area unit conversion outside HVAC sizing, use the{" "}
            <Link
              href="/math/unit-converter"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Unit Converter
            </Link>
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <BtuCalculator />

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
                Switch between Cooling and Heating, enter the room, and read the
                estimate as you type.
              </p>
            </div>
            <ol className="max-w-3xl list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
              <li>
                Choose Cooling for air conditioning or Heating for thermal
                output.
              </li>
              <li>
                Enter area (ft² or m²) and ceiling height (default{" "}
                {DEFAULT_CEILING_FT} ft). Add sun, people and kitchen options
                on the cooling tab when they apply.
              </li>
              <li>
                Read required BTU/h (nearest 100), kW thermal, tons for cooling,
                and the next common size from the editable list.
              </li>
            </ol>
          </section>

          <section aria-labelledby="btu-meaning-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="btu-meaning-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What BTU and a Ton of Cooling Mean
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Capacity language used on equipment labels, stated plainly.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                A British thermal unit (BTU) is a measure of heat. Air
                conditioners and heaters are often rated in BTU per hour
                (BTU/h): how much heat they can remove or add each hour. One
                “ton” of cooling equals {BTU_H_PER_TON.toLocaleString("en-US")}{" "}
                BTU/h. Thermal kilowatts use 1 BTU/h = {WATTS_PER_BTU_H} W, so
                dividing by 1,000 gives kW. That thermal kW is not the same as
                the watts drawn from an electrical outlet.
              </p>
              <p>
                Product labels may also list SEER, HSPF, or efficiency figures.
                This calculator does not estimate electricity use, running cost,
                or brand-specific performance.
              </p>
            </div>
          </section>

          <section aria-labelledby="rule-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="rule-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                How the Rule of Thumb Works
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Area times a per-square-foot rate, scaled by ceiling height.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Cooling starts from area in square feet ×{" "}
                {DEFAULT_COOLING_BTU_PER_SQFT} BTU/h per ft² (editable under More
                options) × (ceiling height in feet ÷ {DEFAULT_CEILING_FT}).
                Square metres convert with the exact factor {SQFT_PER_SQM} ft²
                per m². Metres of height convert with 1 ft = 0.3048 m. Work stays
                in unrounded BTU/h; the headline figure rounds to the nearest
                100.
              </p>
              <p>
                Example: a 300 ft² room at {DEFAULT_CEILING_FT} ft with normal
                sun, two people and no kitchen is 300 ×{" "}
                {DEFAULT_COOLING_BTU_PER_SQFT} × 1 ={" "}
                {SAMPLE_300.btuPerHour.toLocaleString("en-US")} BTU/h, which is{" "}
                {SAMPLE_300.tons.toFixed(2)} ton and {SAMPLE_300.kw.toFixed(2)}{" "}
                kW thermal. Raising the ceiling to 10 ft multiplies the base by
                10÷8. Very sunny adds 10% of the base; heavily shaded subtracts
                10%. Each person beyond two can add 600 BTU/h; a kitchen toggle
                can add 4,000 BTU/h. One person neither adds nor subtracts versus
                the two-person baseline.
              </p>
              <p>
                Heating uses the same area × rate × height pattern with Mild
                (30), Moderate (40) or Cold (50) BTU/h per ft² presets — all
                labelled as rough rules of thumb — or a custom rate. Insulation,
                windows and climate change the real load; the result is thermal
                output, not electrical input.
              </p>
            </div>
          </section>

          <section aria-labelledby="reference-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="reference-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Reference: Room Size, BTU/h and Tons
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same cooling function (normal sun,{" "}
                {DEFAULT_CEILING_FT} ft ceiling, two people, no kitchen).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[28rem] border-collapse text-left text-[14px]">
                <caption className="mb-2 text-left text-[13px] text-muted">
                  Cooling reference rows from coolingReferenceRow()
                </caption>
                <thead>
                  <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3">
                      Room (ft²)
                    </th>
                    <th scope="col" className="py-2 pr-3 tabular-nums">
                      BTU/h
                    </th>
                    <th scope="col" className="py-2 pr-3 tabular-nums">
                      Tons
                    </th>
                    <th scope="col" className="py-2 tabular-nums">
                      kW
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={row.areaSqFt}
                      className="border-b border-border/60 text-foreground tabular-nums"
                    >
                      <th scope="row" className="py-2 pr-3 text-left font-medium">
                        {row.areaSqFt.toLocaleString("en-US")}
                      </th>
                      <td className="py-2 pr-3">
                        {row.btuPerHour.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 pr-3">{row.tons.toFixed(2)}</td>
                      <td className="py-2">{row.kw.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="changes-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="changes-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                What Changes the Number
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Sun, people, kitchens, ceilings and fabric of the building.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Stronger sun on glass raises cooling load; heavy shade lowers
                it relative to a “normal” room. More occupants and cooking
                appliances add heat that cooling must remove. Taller ceilings
                increase volume, so the height factor scales the base. Walls,
                roof insulation, window quality, air leakage, and outdoor climate
                are not modelled here — they often dominate a real Manual J or
                similar load calculation.
              </p>
              <p>
                The assumptions table in the tool lists each line item so you can
                see what was added or subtracted. Under More options you can edit
                the base BTU per square foot, the sun percentage, the per-person
                add-on, the kitchen add-on, and the list of typical equipment
                sizes used for “next common size up.” That list is typical only —
                check what is sold locally before you shop.
              </p>
            </div>
          </section>

          <section aria-labelledby="size-issues-heading">
            <div className="mb-6 max-w-3xl">
              <h2
                id="size-issues-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                When Capacity Is Too Small or Too Large
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Stated neutrally — this page does not recommend a brand or
                purchase.
              </p>
            </div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                Equipment that is too small may run for long periods without
                reaching the setpoint on hot or cold days. Equipment that is too
                large may reach the setpoint quickly and cycle on and off more
                often, which can affect humidity control on cooling systems and
                comfort. Neither case is evaluated quantitatively here; a
                qualified professional matches capacity to the building and local
                climate.
              </p>
              <p>
                Building codes, permit rules, and refrigerant regulations also
                sit outside this page. The calculator does not interpret local
                law or manufacturer installation manuals. Treat the number as a
                starting conversation with someone who can inspect the space.
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
                Arithmetic and unit conversion only.
              </p>
            </div>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>No Manual J / full heat-load design</li>
              <li>No product, brand or retailer recommendations</li>
              <li>No energy-savings or comfort claims</li>
              <li>No electrical input, SEER or running-cost estimates</li>
              <li>
                No general unit conversion outside HVAC sizing — use the{" "}
                <a
                  href="/math/unit-converter"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Unit Converter
                </a>
              </li>
            </ul>
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
              A rough sizing estimate, not a heat-load calculation. Proper sizing
              considers insulation, windows, orientation, climate and local rules.
              Ask a qualified HVAC professional. Fuel-burning heaters need proper
              ventilation; follow the manufacturer’s instructions. Your inputs
              stay in the browser and are not stored by CalcDaily.
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
                Unit conversion, solar sizing, electricity cost, and battery
                backup.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, mass, volume, and temperature
                </span>
              </a>
              <a
                href="/home-energy/solar-panel-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Solar Panel Calculator
                </span>
                <span className="text-sm text-muted">
                  System size, panel count, production and payback
                </span>
              </a>
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
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
