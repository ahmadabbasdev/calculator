import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Fuel } from "lucide-react";
import { FuelCostCalculator } from "@/components/calculators/FuelCostCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  calculateFuelCost,
  convertEfficiency,
  efficiencyReferenceRow,
  efficiencyUnitLabel,
} from "@/lib/utils/fuel-cost";

const PAGE_PATH = "/everyday-life/fuel-cost-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Fuel Cost Calculator — Trip & Efficiency";
const PAGE_DESCRIPTION =
  "Free fuel cost calculator: estimate trip fuel and cost from distance and efficiency, measure km/L or MPG from a fill-up, and convert L/100 km, km/L and MPG.";

const SAMPLE_TRIP = calculateFuelCost({
  mode: "trip",
  distance: 300,
  distanceUnit: "km",
  efficiency: 12,
  efficiencyUnit: "km_l",
  fuelPrice: 280,
  fuelPriceUnit: "per_litre",
  roundTrip: false,
  tolls: null,
  otherCosts: null,
  people: null,
});

const SAMPLE_ROUND = calculateFuelCost({
  mode: "trip",
  distance: 300,
  distanceUnit: "km",
  efficiency: 12,
  efficiencyUnit: "km_l",
  fuelPrice: 280,
  fuelPriceUnit: "per_litre",
  roundTrip: true,
  tolls: 500,
  otherCosts: null,
  people: 4,
});

const SAMPLE_L100 = convertEfficiency(8, "l_100km");
const SAMPLE_MPG = convertEfficiency(30, "mpg_us");
const SAMPLE_MEASURE = calculateFuelCost({
  mode: "efficiency",
  distance: 450,
  distanceUnit: "km",
  fuelUsed: 36,
  fuelUsedUnit: "litre",
  fuelPrice: null,
  fuelPriceUnit: "per_litre",
});

const REF_VALUES = [
  { value: 8, unit: "l_100km" as const },
  { value: 12, unit: "km_l" as const },
  { value: 30, unit: "mpg_us" as const },
  { value: 35, unit: "mpg_uk" as const },
  { value: 10, unit: "l_100km" as const },
];
const REFERENCE_ROWS = REF_VALUES.map((row) =>
  efficiencyReferenceRow(row.value, row.unit),
);

export const FAQ_ITEMS = [
  {
    question: "How do I estimate the fuel cost of a trip?",
    answer:
      SAMPLE_TRIP.ok && SAMPLE_TRIP.mode === "trip"
        ? `Enter distance, efficiency and the fuel price you pay. Fuel needed = distance ÷ efficiency (when efficiency is km/L). Example: 300 km at 12 km/L needs ${SAMPLE_TRIP.fuelLitres.toFixed(0)} L; at 280 per litre the fuel cost is ${SAMPLE_TRIP.fuelCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${SAMPLE_TRIP.costPerKm.toFixed(2)} per km).`
        : "Enter distance, efficiency and fuel price to estimate fuel needed and cost.",
  },
  {
    question: "What does the round-trip toggle do?",
    answer:
      SAMPLE_ROUND.ok && SAMPLE_ROUND.mode === "trip"
        ? `It doubles the distance before calculating fuel. The same 300 km one-way trip becomes 600 km round trip: ${SAMPLE_ROUND.fuelLitres.toFixed(0)} L and ${SAMPLE_ROUND.fuelCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in fuel. Tolls and other costs are added after fuel; with 500 in tolls and 4 people the total is ${SAMPLE_ROUND.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${SAMPLE_ROUND.costPerPerson.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each).`
        : "It doubles the distance before calculating fuel.",
  },
  {
    question: "How do L/100 km, km/L and MPG relate?",
    answer: `km/L = 100 ÷ (L/100 km). MPG (US) = 235.214583 ÷ (L/100 km). MPG (UK) = 282.480936 ÷ (L/100 km). So 8 L/100 km is ${SAMPLE_L100.kmPerLitre.toFixed(2)} km/L, ${SAMPLE_L100.mpgUs.toFixed(2)} MPG (US) and ${SAMPLE_L100.mpgUk.toFixed(2)} MPG (UK). US and UK gallons differ, so the MPG figures are not the same.`,
  },
  {
    question: "How do I measure my own fuel efficiency?",
    answer:
      SAMPLE_MEASURE.ok && SAMPLE_MEASURE.mode === "efficiency"
        ? `Fill the tank, reset the trip meter, drive normally, refill and note litres (or gallons) and distance. Divide distance by fuel used. Example: 450 km on 36 L is ${SAMPLE_MEASURE.efficiency.kmPerLitre.toFixed(2)} km/L (${SAMPLE_MEASURE.efficiency.litresPer100km.toFixed(2)} L/100 km).`
        : "Fill the tank, reset the trip meter, refill and divide distance by fuel used.",
  },
  {
    question: "Can I use miles and MPG instead of kilometres?",
    answer: `Yes. Choose miles for distance and MPG (US) or MPG (UK) for efficiency. Price can be per litre or per US/UK gallon. Example conversion: 30 MPG (US) is about ${SAMPLE_MPG.litresPer100km.toFixed(2)} L/100 km or ${SAMPLE_MPG.kmPerLitre.toFixed(2)} km/L.`,
  },
  {
    question: "Does this calculator look up current petrol or diesel prices?",
    answer:
      "No. Enter the price you pay. The page does not fetch or display fuel-station prices and does not compare vehicles or brands.",
  },
  {
    question: "Why might the estimate differ from what I actually use?",
    answer:
      "Real consumption changes with driving style, load, weather, traffic, tyre pressure and hills. Map distances can also differ from the road you drive. Treat results as estimates from the numbers entered.",
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
  name: "Fuel Cost Calculator",
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
      name: "Fuel Cost Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function FuelCostCalculatorPage() {
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
            { label: "Fuel Cost Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Fuel className="size-4.5" aria-hidden="true" />
            Trip fuel cost and efficiency
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Fuel Cost Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate how much fuel a trip needs and what it costs from distance,
            efficiency and the price you enter. Measure your own km/L or MPG
            from a fill-up, or convert between L/100 km, km/L and MPG (US/UK).
            For general unit conversion outside fuel efficiency, use the{" "}
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

        <FuelCostCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How efficiency units relate
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Fuel economy is the same idea in different units. Litres per 100
              kilometres (L/100 km) is how many litres you use to travel 100 km —
              lower is more economical. Kilometres per litre (km/L) is the
              inverse: km/L = 100 ÷ (L/100 km). Miles per gallon depends on which
              gallon you mean: MPG (US) = 235.214583 ÷ (L/100 km) and MPG (UK) =
              282.480936 ÷ (L/100 km), because 1 US gallon is 3.785411784 L and 1
              UK gallon is 4.54609 L. One mile is 1.609344 km.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked conversion: 8 L/100 km equals{" "}
              {SAMPLE_L100.kmPerLitre.toFixed(2)} km/L,{" "}
              {SAMPLE_L100.mpgUs.toFixed(2)} MPG (US) and{" "}
              {SAMPLE_L100.mpgUk.toFixed(2)} MPG (UK). Starting from MPG
              instead, 30 MPG (US) is about{" "}
              {SAMPLE_MPG.litresPer100km.toFixed(2)} L/100 km or{" "}
              {SAMPLE_MPG.kmPerLitre.toFixed(2)} km/L. The Convert efficiency
              tab shows all four from any one figure.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              On Trip cost, fuel needed follows from distance and efficiency.
              At 12 km/L, 300 km needs 25 L; if you enter 280 per litre the fuel
              cost is 7,000.00 and about 23.33 per km. Turn on Round trip to
              double the distance. Tolls and other costs add to the total; split
              by the number of people when you want a share each.
            </p>
          </section>

          <section aria-labelledby="measure-heading" className="max-w-3xl">
            <h2
              id="measure-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How to measure your own efficiency
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Fill the tank, reset the trip meter (or note the odometer), drive
              as you usually do, then refill and write down how much fuel went
              in and how far you drove. Divide distance by fuel used for km/L
              (or MPG if you used miles and gallons). Example: 450 km on 36 L is{" "}
              {SAMPLE_MEASURE.ok && SAMPLE_MEASURE.mode === "efficiency"
                ? SAMPLE_MEASURE.efficiency.kmPerLitre.toFixed(2)
                : "12.50"}{" "}
              km/L, which is{" "}
              {SAMPLE_MEASURE.ok && SAMPLE_MEASURE.mode === "efficiency"
                ? SAMPLE_MEASURE.efficiency.litresPer100km.toFixed(2)
                : "8.00"}{" "}
              L/100 km. Optional price on that tab also gives cost per km.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Limits of this method: a single tank is a short sample; highway
              and city mixes differ; cold starts, roof boxes and short trips
              raise use. Map apps may show a different distance from the road
              you actually drive. The calculator does not give fuel-saving tips
              and does not name vehicles or brands. For percent shares of a
              total trip cost, use the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
              </Link>
              . Running pace is a separate topic on the{" "}
              <Link
                href="/health/pace-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Pace Calculator
              </Link>
              ; for a monthly spending plan see the{" "}
              <Link
                href="/finance/budget-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Budget Calculator
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
                Efficiency conversion reference
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Generated from the same conversion functions as the calculator,
                not typed by hand.
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
                      km/L
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      L/100 km
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      MPG (US)
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      MPG (UK)
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
                        {efficiencyUnitLabel(row.inputUnit)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.kmPerLitre.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.litresPer100km.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.mpgUs.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.mpgUk.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
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
              Results are estimates from the numbers you enter. Real fuel use
              changes with driving, load, weather and traffic, and map distances
              can differ from the road you drive. This page does not look up
              fuel prices and does not compare vehicles. Your inputs stay in the
              browser and are not stored by CalcDaily.
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
                Unit conversion, percent math, running pace, and monthly budgets.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                href="/health/pace-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Pace Calculator
                </span>
                <span className="text-sm text-muted">
                  Convert min/km, min/mile, km/h, and mph
                </span>
              </a>
              <a
                href="/finance/budget-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-everyday/45 hover:bg-cat-everyday-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Budget Calculator
                </span>
                <span className="text-sm text-muted">
                  Monthly 50/30/20, custom percentages, or your own list
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
