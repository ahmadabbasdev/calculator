import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Zap } from "lucide-react";
import { ElectricityCostCalculator } from "@/components/calculators/ElectricityCostCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  calculateElectricity,
  monthlyKwhReferenceRow,
  runningKwh,
} from "@/lib/utils/electricity";

const PAGE_PATH = "/home-energy/electricity-cost-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Electricity Cost Calculator — kWh & Bill";
const PAGE_DESCRIPTION =
  "Free electricity cost calculator: convert watts to kWh (units), estimate appliance running cost, and model a simple flat or tiered bill from your own rates.";

const SAMPLE = calculateElectricity({
  mode: "appliance",
  powerMode: "watts",
  watts: 100,
  amps: null,
  volts: null,
  hoursPerDay: 5,
  daysPerMonth: 30,
  quantity: 1,
  dutyPercent: 100,
  standbyWatts: null,
  standbyHoursPerDay: null,
  pricePerKwh: 0.2,
});

const SAMPLE_1000W_HOUR = calculateElectricity({
  mode: "appliance",
  powerMode: "watts",
  watts: 1000,
  amps: null,
  volts: null,
  hoursPerDay: 1,
  daysPerMonth: 1,
  quantity: 1,
  dutyPercent: 100,
  standbyWatts: null,
  standbyHoursPerDay: null,
  pricePerKwh: 0.2,
});

const REF_WATTS = [40, 75, 100, 150, 500, 1000, 1500] as const;
const REF_HOURS = [1, 4, 8, 12, 24] as const;
const REFERENCE_ROWS = REF_WATTS.flatMap((watts) =>
  REF_HOURS.map((hoursPerDay) =>
    monthlyKwhReferenceRow({ watts, hoursPerDay, daysPerMonth: 30 }),
  ),
);

export const FAQ_ITEMS = [
  {
    question: "How do I convert watts to kWh?",
    answer: `Kilowatt-hours equal watts × hours ÷ 1000 (for one device at full power). For a month, multiply by days and by quantity, and by the fraction of time the device draws full power. Example: 100 W × 5 h/day × 30 days ÷ 1000 = ${SAMPLE.ok && SAMPLE.mode === "appliance" ? SAMPLE.kwhPerMonth.toFixed(0) : "15"} kWh (units) per month.`,
  },
  {
    question: "How much does it cost to run a 1,000 watt appliance for an hour?",
    answer: `Cost equals kWh × your price per kWh. One hour at 1,000 W is 1 kWh (unit). At a sample price of 0.20 per kWh that is ${SAMPLE_1000W_HOUR.ok && SAMPLE_1000W_HOUR.mode === "appliance" && SAMPLE_1000W_HOUR.costPerHour !== null ? SAMPLE_1000W_HOUR.costPerHour.toFixed(2) : "0.20"} for that hour. Enter your own rate from your bill.`,
  },
  {
    question: "Where do I find my electricity rate?",
    answer:
      "On your bill. The rate may change by slab (tier), month or season. Enter what your bill shows for the period you are estimating — this page does not store country or utility rates.",
  },
  {
    question: "What is the difference between kW and kWh?",
    answer:
      "Kilowatts (kW) describe power — how hard a device draws at a moment. Kilowatt-hours (kWh), often called units on bills, describe energy over time. Cost is usually charged per kWh (unit), not per kW.",
  },
  {
    question: "What does % of time drawing full power mean?",
    answer:
      "Some devices cycle: a fridge compressor or an air conditioner may run only part of each hour. Entering 40% means you plan for the device to draw its listed watts for 40% of the hours you entered. Labels often show maximum power, not average draw.",
  },
  {
    question: "How do incremental and whole-bill tiers differ?",
    answer:
      "Incremental (slab) billing charges each band of kWh (units) at that band’s price. Whole-bill billing finds the tier your total falls in and applies that single price to every unit. A boundary labelled “up to 100” includes 100.",
  },
  {
    question: "Does this match my utility bill exactly?",
    answer:
      "Not necessarily. Real bills may include other charges, taxes, demand fees or seasonal rules beyond a simple flat or tiered energy rate. The calculator estimates only the figures you enter.",
  },
  {
    question: "Can I use amps and volts instead of watts?",
    answer:
      "Yes. Watts equal amps × volts for a simple resistive estimate on the “One appliance” tab. For motors and electronics the true draw can differ; a plug-in meter is more accurate when you need measured watts.",
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
  name: "Electricity Cost Calculator",
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
      name: "Electricity Cost Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function ElectricityCostCalculatorPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const exampleMonthKwh = runningKwh({
    watts: 100,
    quantity: 1,
    hoursPerDay: 5,
    days: 30,
    dutyPercent: 100,
  });

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
            { label: "Electricity Cost Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Zap className="size-4.5" aria-hidden="true" />
            Appliance kWh (units) and bill estimate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Electricity Cost Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Convert watts to kWh (units), estimate what it costs to run an
            appliance from the price on your bill, or add several devices and
            optional tiered charges. For solar array sizing see the{" "}
            <Link
              href="/home-energy/solar-panel-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Solar Panel Calculator
            </Link>
            ; for backup runtime see the{" "}
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

        <ElectricityCostCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How appliance electricity cost is estimated
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Energy use in kilowatt-hours equals watts × quantity × hours per
              day × days × (percent of time drawing full power ÷ 100) ÷ 1,000.
              Optional standby adds standby watts × standby hours per day × days
              ÷ 1,000. Cost equals kilowatt-hours × the price per kWh you enter.
              Worked example: a 100 W device for 5 hours a day over 30 days at
              full power uses{" "}
              <span className="tabular-nums">{exampleMonthKwh}</span> kWh
              (units). At a sample price of 0.20 per kWh that is 3.00 for the
              month and 36.00 for the year (180 kWh). Cost per hour for that
              device at the same price is 0.02. Enter your own rate; this page
              does not store utility prices by country or region.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Kilowatts (kW) describe power — how hard a device draws at a
              moment. Kilowatt-hours (kWh), often printed as “units” on bills,
              describe energy over time. A 1,000 W (1 kW) heater running for one
              hour uses 1 kWh (unit). The same heater for half an hour uses 0.5
              kWh. Bills usually charge for kWh (units), not for the peak watts
              printed on a label. Thinking in units makes monthly and yearly
              totals easier to compare with the usage line on a statement.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              To find a device&apos;s wattage, read the nameplate or specification
              label. If the label shows amps and volts, watts equal amps × volts
              for a simple estimate on the “One appliance” tab — for example 2.5
              A at 230 V is 575 W, and four hours a day over 30 days is 69.0 kWh
              (units) for the month. A plug-in power meter measures real draw
              while the device runs and can be more accurate for motors and
              electronics. Labels often show maximum power; many devices draw
              less much of the time.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Duty cycle matters for fridges and air conditioners. If a
              compressor runs about 40% of the time, enter 40 under “% of time
              drawing full power” so the estimate does not treat every clock hour
              as full load. Three 75 W fans for 8 hours a day over 30 days use 54
              kWh (units) at 100% duty. A 150 W load for 24 hours at 40% duty
              over 30 days uses 43.2 kWh. Standby of 5 W for 20 hours a day over
              30 days adds 3.0 kWh on its own when the main load is off.
            </p>
          </section>

          <section aria-labelledby="tiers-heading" className="max-w-3xl">
            <h2
              id="tiers-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How tiered billing works
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Some bills price kWh (units) in slabs or tiers. Incremental
              billing charges each band at that band&apos;s price only. Whole-bill
              billing finds the tier your total falls in and applies that one
              price to every unit. A limit labelled “up to 100” includes 100.
              Open the “My bill is not a flat rate” section to enter ascending
              tier limits, choose a method, add a fixed monthly charge, and apply
              a tax or surcharge percent to energy plus fixed. Tier limits must
              rise from one row to the next. Bills differ between countries and
              utilities — enter what your bill says.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked incremental example in a generic currency: tiers up to 100
              units at 10, up to 200 at 15, and above 200 at 20. For 250 units the
              charge is 100 × 10 + 100 × 15 + 50 × 20 = 3,500. Add a fixed monthly
              charge of 100 and a 10% tax on energy plus fixed: (3,500 + 100) ×
              1.10 = 3,960.00.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked whole-bill example with the same tiers: 250 units fall in the
              open top tier, so 250 × 20 = 5,000. One hundred fifty units fall in
              the middle tier, so 150 × 15 = 2,250. Exactly 100 units sit on the
              first boundary and cost 100 × 10 = 1,000. Zero usage still shows any
              fixed charge and tax you enter, with no energy charge.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              This calculator does not cover demand charges, time-of-use periods,
              seasonal adjustments, connection fees beyond a single fixed monthly
              amount, or comparing rates by place. It does not recommend products
              or claim savings. For solar production and payback see the{" "}
              <Link
                href="/home-energy/solar-panel-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Solar Panel Calculator
              </Link>
              ; for room capacity the{" "}
              <Link
                href="/home-energy/btu-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                BTU Calculator
              </Link>
              ; for backup runtime the{" "}
              <Link
                href="/home-energy/battery-backup-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Battery Backup Time Calculator
              </Link>
              ; for percent math the{" "}
              <Link
                href="/math/percentage-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Percentage Calculator
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

          <section aria-labelledby="table-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Watts and hours to kWh per month
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Single device, 30 days, 100% duty — generated from the same
                function as the calculator, not typed by hand.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] uppercase tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Watts
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Hours/day
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      kWh / month
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.watts}-${row.hoursPerDay}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.watts}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.hoursPerDay}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.kwhPerMonth.toLocaleString("en-US", {
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
              This calculator estimates only the figures you enter. Real bills
              may include other charges, taxes, demand or seasonal rules. Device
              labels often show maximum power; draw varies. No country or utility
              rates are stored here. This page does not recommend products or
              promise savings. Your inputs stay in the browser and are not stored
              by CalcDaily.
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
                Solar, capacity, backup, percent math, and unit conversion.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/home-energy/solar-panel-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
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
                href="/math/percentage-calculator"
                className="inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition hover:border-cat-home/45 hover:bg-cat-home-soft"
              >
                <span className="text-[15px] font-semibold text-foreground">
                  Percentage Calculator
                </span>
                <span className="text-sm text-muted">
                  Percent of, change, and increase or decrease
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
