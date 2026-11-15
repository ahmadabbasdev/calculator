import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, LandPlot } from "lucide-react";
import { LandAreaCalculator } from "@/components/calculators/LandAreaCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  areaConversionReferenceRow,
  calculateLandArea,
  polygonAreaShoelace,
} from "@/lib/utils/land-area";

const PAGE_PATH = "/everyday-life/land-area-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Land Area Calculator — Plot, Marla & Kanal";
const PAGE_DESCRIPTION =
  "Free land area calculator: estimate plot area from rectangle, triangle, trapezoid or polygon sides, and convert square feet, marla, kanal, acres and hectares.";

const SAMPLE_RECT = calculateLandArea({
  mode: "plot",
  shape: "rectangle",
  length: 50,
  width: 90,
  lengthUnit: "ft",
  sqftPerMarla: null,
});

const SAMPLE_TRI = calculateLandArea({
  mode: "plot",
  shape: "triangle",
  sideA: 30,
  sideB: 40,
  sideC: 50,
  lengthUnit: "ft",
  sqftPerMarla: null,
});

const SHOELACE_EXAMPLE = polygonAreaShoelace([
  { x: 0, y: 0 },
  { x: 60, y: 0 },
  { x: 60, y: 20 },
  { x: 30, y: 20 },
  { x: 30, y: 50 },
  { x: 0, y: 50 },
]);

const REF_VALUES = [
  { value: 1, unit: "marla" as const },
  { value: 1, unit: "kanal" as const },
  { value: 1, unit: "acre" as const },
  { value: 1, unit: "hectare" as const },
  { value: 272.25, unit: "sqft" as const },
  { value: 1000, unit: "sqft" as const },
  { value: 100, unit: "sqm" as const },
];
const REFERENCE_ROWS = REF_VALUES.map((row) =>
  areaConversionReferenceRow(row.value, row.unit),
);

export const FAQ_ITEMS = [
  {
    question: "How do I calculate the area of a rectangular plot?",
    answer: `Multiply length by width in the same unit, then convert if needed. A 50 ft by 90 ft rectangle is ${SAMPLE_RECT.ok && SAMPLE_RECT.mode === "plot" ? SAMPLE_RECT.areaSqFt.toLocaleString("en-US") : "4,500"} ft², about ${SAMPLE_RECT.ok && SAMPLE_RECT.mode === "plot" ? SAMPLE_RECT.areas.marla.toFixed(2) : "16.53"} marla and ${SAMPLE_RECT.ok && SAMPLE_RECT.mode === "plot" ? SAMPLE_RECT.areas.kanal.toFixed(2) : "0.83"} kanal when one marla is 272.25 ft².`,
  },
  {
    question: "How do I convert square feet to marla?",
    answer:
      "Divide square feet by the marla size you use. The default here is 272.25 ft² per marla (9 × 30.25 sarsai). The size of a marla can differ by region and authority — check your local records and use More options to set a custom value.",
  },
  {
    question: "What is Heron's formula for a triangular plot?",
    answer: `For sides a, b and c, the semi-perimeter s = (a + b + c) ÷ 2, and area = √[s(s − a)(s − b)(s − c)]. A 30–40–50 ft triangle has area ${SAMPLE_TRI.ok && SAMPLE_TRI.mode === "plot" ? SAMPLE_TRI.areaSqFt : 600} ft². If one side is longer than or equal to the sum of the other two, the lengths cannot form a triangle.`,
  },
  {
    question: "How do I measure a four-sided irregular plot?",
    answer:
      "Measure all four boundary sides and one diagonal between opposite corners. The calculator treats the plot as two triangles that share that diagonal. Measure the diagonal carefully so each triangle uses the two sides that meet at each end of the diagonal.",
  },
  {
    question: "What is the shoelace method?",
    answer: `List the corner coordinates in order around the boundary (without crossing). Sum xᵢyᵢ₊₁, subtract sum yᵢxᵢ₊₁, take the absolute value and divide by two. The worked six-point example on this page has area ${SHOELACE_EXAMPLE.toLocaleString("en-US")} ft². Self-crossing shapes are rejected instead of returning a misleading number.`,
  },
  {
    question: "How many marla are in one kanal or one acre?",
    answer:
      "With the default marla of 272.25 ft², one kanal is 20 marla (5,445 ft²). One acre is 43,560 ft², which is 160 marla or 8 kanal. Change the marla size under More options if your local definition differs.",
  },
  {
    question: "Is this a substitute for a survey?",
    answer:
      "No. Results are estimates from the numbers you enter. Hand measurements, tape stretch, sloping ground and local unit definitions all affect real area. This page does not advise on valuation, purchase, boundaries or disputes.",
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
  name: "Land Area Calculator",
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
      name: "Everyday Life",
      item: `${SITE_URL}/everyday-life`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Land Area Calculator",
      item: CANONICAL_URL,
    },
  ],
};

function unitLabel(unit: string): string {
  switch (unit) {
    case "sqft":
      return "ft²";
    case "sqyd":
      return "yd²";
    case "sqm":
      return "m²";
    case "sarsai":
      return "sarsai";
    case "marla":
      return "marla";
    case "kanal":
      return "kanal";
    case "acre":
      return "acre";
    case "hectare":
      return "hectare";
    default:
      return unit;
  }
}

export default function LandAreaCalculatorPage() {
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
          theme="everyday"
          items={[
            { label: "Home", href: "/" },
            { label: "Everyday Life", href: "/everyday-life" },
            { label: "Land Area Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <LandPlot className="size-4.5" aria-hidden="true" />
            Plot area and land unit conversion
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Land Area Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate the area of a rectangular, triangular, trapezoid,
            four-sided or irregular plot, then see the result in square feet,
            marla, kanal, acres and more. For general length or area conversion
            outside land units, use the{" "}
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

        <LandAreaCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How to measure and calculate a plot
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Start with a clear sketch of the boundary. Measure each side with
              a tape or survey wheel in one length unit — feet, metres or yards —
              and keep that unit for every side. For a rectangle, multiply length
              by width. A 50 ft by 90 ft plot is 4,500 ft². With the default
              marla of 272.25 ft² that is about 16.53 marla or 0.83 kanal, 500
              square yards, about 418.06 m², and about 0.1033 acre.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Triangular plots use Heron&apos;s formula: from three sides, form
              the semi-perimeter and take the square root of the product of the
              semi-perimeter with each (semi-perimeter minus side). A 30–40–50
              ft right triangle has area 600 ft². If the sides cannot close —
              one side as long as or longer than the other two combined — the
              calculator returns an error instead of a false area.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              A trapezoid with parallel sides 40 and 60 and height 30 has area
              ((40 + 60) ÷ 2) × 30 = 1,500 (in the same length unit squared). For
              a four-sided plot that is not a neat rectangle, measure all four
              sides and one diagonal, then treat the figure as two triangles that
              share that diagonal. Sides 40, 30, 40 and 30 with a 50-unit
              diagonal give two 600-unit triangles and a total of 1,200.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Irregular plots can be split into triangles by drawing diagonals
              from one corner, or entered as ordered corner coordinates for the
              shoelace method. Walk the boundary in one direction without
              crossing your path; list each corner&apos;s x and y. The shoelace
              sum for the six-point example (0,0), (60,0), (60,20), (30,20),
              (30,50), (0,50) is{" "}
              <span className="tabular-nums">
                {SHOELACE_EXAMPLE.toLocaleString("en-US")}
              </span>{" "}
              square units. A bow-tie shape that crosses itself is flagged as
              self-intersecting and is not calculated — fix the order or split
              the shape.
            </p>
          </section>

          <section aria-labelledby="units-heading" className="max-w-3xl">
            <h2
              id="units-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Land units and why they differ
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Square feet, square yards and square metres are SI-related area
              units with fixed ratios on this page: 1 m² = 10.763910417 ft² and 1
              yd² = 9 ft². One acre is 43,560 ft². One hectare is 10,000 m². Local
              South Asian units here use 1 sarsai = 30.25 ft², one marla = 9
              sarsai = 272.25 ft² by default, and one kanal = 20 marla. That makes
              one kanal 5,445 ft² (605 yd², about 505.86 m²), one marla about
              25.29 m², one acre = 8 kanal = 160 marla, and one hectare about
              19.77 kanal.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              The size of a marla can differ by region and authority. This page
              does not state which places use which size. Under More options you
              can set a custom square-feet-per-marla value so kanal and marla
              conversions follow the figure on your local records.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Common mistakes include mixing feet and metres in one sketch,
              forgetting that area scales with the square of a length conversion,
              using a marla size that does not match the deed, and ordering
              polygon points so edges cross. Hand measurement also has limits:
              tape sag, sloping ground and rounded corners all shift the true
              plan area. For percent shares of a total area, use the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </Link>
              . Room heating capacity and solar sizing are separate topics on the{" "}
              <Link
                href="/home-energy/btu-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                BTU Calculator
              </Link>{" "}
              and{" "}
              <Link
                href="/home-energy/solar-panel-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Solar Panel Calculator
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="table-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Area conversion reference
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same conversion functions as the calculator
                (default marla = 272.25 ft²), not typed by hand.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Input
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      ft²
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      m²
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Marla
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Kanal
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Acre
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.inputValue}-${row.inputUnit}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.inputValue.toLocaleString("en-US")}{" "}
                        {unitLabel(row.inputUnit)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.sqft.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.sqm.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.marla.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.kanal.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.acre.toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="faq-heading" className="max-w-3xl">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently asked questions
            </h2>
            <div className="mt-4 divide-y divide-border/80 rounded-xl border border-border/80 bg-panel shadow-card">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-semibold text-foreground">
                    {item.question}
                    <ChevronDown
                      className="mt-0.5 size-4 shrink-0 text-muted transition group-open:rotate-180"
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
              This calculator is a calculation aid, not a survey or legal record.
              Measurements and local unit definitions decide the result. It does
              not advise on valuation, purchase, boundaries or disputes. Your
              inputs stay in the browser and are not stored by CalcDaily.
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
                Unit conversion, percent math, solar sizing, and room capacity.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/math/unit-converter"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Unit Converter
                </span>
                <span className="text-sm text-muted">
                  Length, mass, volume, temperature and more
                </span>
              </a>
              <a
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of, change, and increase or decrease
                </span>
              </a>
              <a
                href="/home-energy/solar-panel-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Solar Panel Calculator
                </span>
                <span className="text-sm text-muted">
                  System size, production and simple payback
                </span>
              </a>
              <a
                href="/home-energy/btu-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  BTU Calculator
                </span>
                <span className="text-sm text-muted">
                  Room AC and heater BTU/h, tons, and thermal kW
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
