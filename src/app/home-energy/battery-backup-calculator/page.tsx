import type { Metadata } from "next";
import Link from "next/link";
import { Battery, ChevronDown } from "lucide-react";
import { BatteryBackupCalculator } from "@/components/calculators/BatteryBackupCalculator";
import { CalculatorEeAtSections } from "@/components/seo/CalculatorEeAtSections";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LastReviewed } from "@/components/layout/LastReviewed";
import { getCalculatorEeAt } from "@/lib/calculator-eeat";
import { findCalculatorByHref } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  DEFAULT_EFFICIENCY_PERCENT,
  DEFAULT_USABLE_PERCENT,
  calculateBatteryBackup,
  formatRuntimeLabel,
  runtimeReferenceRow,
} from "@/lib/utils/battery-backup";

const PAGE_PATH = "/home-energy/battery-backup-calculator";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const EEAT = getCalculatorEeAt(PAGE_PATH);

const PAGE_TITLE = "Battery Backup Time Calculator — UPS & Ah";
const PAGE_DESCRIPTION =
  "Free battery backup time calculator: estimate UPS or inverter runtime from volts, amp-hours and load, or size how many batteries you need for a target time.";

const SAMPLE = calculateBatteryBackup({
  mode: "runtime",
  batteryVoltage: 12,
  batteryAh: 150,
  series: 1,
  strings: 1,
  usablePercent: 50,
  healthPercent: 100,
  efficiencyPercent: 85,
  loadWatts: 300,
  appliances: null,
  loadMode: "watts",
  inverterRatingWatts: null,
});

const SAMPLE_NEEDED = calculateBatteryBackup({
  mode: "needed",
  loadWatts: 500,
  appliances: null,
  loadMode: "watts",
  backupHours: 4,
  systemVoltage: 24,
  batteryVoltage: 12,
  batteryAh: 150,
  usablePercent: 50,
  healthPercent: 100,
  efficiencyPercent: 85,
  inverterRatingWatts: null,
});

const REF_BATTERIES = [
  { voltage: 12, ah: 100 },
  { voltage: 12, ah: 150 },
  { voltage: 12, ah: 200 },
  { voltage: 24, ah: 100 },
] as const;
const REF_LOADS_W = [100, 300, 500, 800] as const;
const REFERENCE_ROWS = REF_BATTERIES.flatMap((battery) =>
  REF_LOADS_W.map((loadWatts) =>
    runtimeReferenceRow({
      batteryVoltage: battery.voltage,
      batteryAh: battery.ah,
      loadWatts,
      usablePercent: DEFAULT_USABLE_PERCENT,
      efficiencyPercent: DEFAULT_EFFICIENCY_PERCENT,
    }),
  ),
);

const APPLIANCE_EXAMPLE = [
  { label: "LED lights", watts: 40, quantity: 4 },
  { label: "Wi‑Fi router", watts: 15, quantity: 1 },
  { label: "Laptop", watts: 65, quantity: 1 },
  { label: "Ceiling fan", watts: 75, quantity: 2 },
] as const;
const APPLIANCE_LOAD_W = APPLIANCE_EXAMPLE.reduce(
  (sum, row) => sum + row.watts * row.quantity, 0,
);

export const FAQ_ITEMS = [
  {
    question: "How do I calculate inverter battery backup time?",
    answer: `Pack voltage equals battery volts × batteries in series, and pack amp-hours equal battery Ah × parallel strings. Nominal watt-hours are pack volts × pack Ah. Usable watt-hours multiply that by usable share and remaining health. Runtime hours equal usable watt-hours × inverter or UPS efficiency ÷ load watts. With a 12 V 150 Ah battery at 50% usable, 100% health, 85% efficiency and a 300 W load, usable energy is ${SAMPLE.ok && SAMPLE.mode === "runtime" ? SAMPLE.usableWh.toFixed(0) : "900"} Wh and runtime is about ${SAMPLE.ok && SAMPLE.mode === "runtime" ? SAMPLE.runtimeHours.toFixed(2) : "2.55"} h (${SAMPLE.ok && SAMPLE.mode === "runtime" ? formatRuntimeLabel(SAMPLE.runtimeHours) : "2 h 33 min"}).`,
  },
  {
    question: "How many batteries do I need?",
    answer: `Required watt-hours equal load × wanted hours ÷ (efficiency × usable share × health). Required pack Ah equals that energy ÷ system voltage. Series count is system voltage ÷ battery voltage (it must divide evenly). Parallel strings equal ceil(required pack Ah ÷ battery Ah). Total batteries equal series × strings. For 500 W over 4 hours at 85% efficiency and 50% usable on a 24 V system with 12 V 150 Ah batteries, that plan uses ${SAMPLE_NEEDED.ok && SAMPLE_NEEDED.mode === "needed" ? SAMPLE_NEEDED.totalBatteries : 4} batteries and gives about ${SAMPLE_NEEDED.ok && SAMPLE_NEEDED.mode === "needed" ? SAMPLE_NEEDED.actualRuntimeHours.toFixed(2) : "6.12"} h.`,
  },
  {
    question: "What is usable share of the battery?",
    answer:
      "Usable share is the fraction of nominal amp-hours you plan to discharge. Many lead-acid setups plan around half the rated capacity; many lithium packs allow a larger share. Both figures on this page are editable planning assumptions — check the battery datasheet and the inverter or UPS cut-off settings.",
  },
  {
    question: "How do VA and watts relate on a UPS?",
    answer:
      "Watts equal VA × power factor. The helper lets you convert either way with an editable power factor; 0.7 is only an example, not a claim about your unit. Use the watts result as the load for runtime or sizing.",
  },
  {
    question: "Do series and parallel batteries work the same way?",
    answer:
      "No. Batteries in series add voltage while amp-hours stay the same. Strings in parallel add amp-hours while voltage stays the same. Energy in watt-hours is voltage × amp-hours for the finished pack.",
  },
  {
    question: "Why is my real runtime shorter than the estimate?",
    answer:
      "Discharge rate, temperature, age, chemistry, inverter self-consumption and cut-off voltage all change delivered energy. High loads can reduce effective capacity. Manufacturers’ discharge tables are the reference for a given battery.",
  },
  {
    question: "Is this safe to use for wiring or installation?",
    answer:
      "No. This page does not give wiring, charging or installation instructions. Batteries can be dangerous. A qualified electrician should install and check systems; batteries need ventilation and proper protection, and you should follow the manufacturer’s limits.",
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
  name: "Battery Backup Time Calculator",
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
      name: "Battery Backup Time Calculator",
      item: CANONICAL_URL,
    },
  ],
};

export default function BatteryBackupCalculatorPage() {
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
            { label: "Battery Backup Time Calculator" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
            <Battery className="size-4.5" aria-hidden="true" />
            UPS and inverter battery runtime estimate
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Battery Backup Time Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate how long a battery pack lasts on a given load, or how many
            batteries you need for a target backup time. For appliance kWh and
            bill math see the{" "}
            <Link
              href="/home-energy/electricity-cost-calculator"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Electricity Cost Calculator
            </Link>
            ; for array sizing the{" "}
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
            .
          </p>
        </header>

        <LastReviewed reviewedAt={findCalculatorByHref(PAGE_PATH)?.reviewedAt} />

        <BatteryBackupCalculator />

        <article className="mt-16 space-y-12 border-t border-border/80 pt-12">
          <section aria-labelledby="guide-heading" className="max-w-3xl">
            <h2
              id="guide-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How battery backup time is estimated
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Backup time is how many watt-hours the pack can deliver after
              usable share, remaining health and inverter or UPS losses, divided
              by the load in watts. Volts describe pack potential. Amp-hours (Ah)
              are the rated charge under the manufacturer&apos;s test conditions.
              Watt-hours (Wh) are volts × amp-hours. A 12 V, 150 Ah battery is
              1,800 Wh on paper before usable share, health and efficiency.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Runtime uses: usable Wh = pack volts × pack Ah × usable share ×
              health; runtime hours = usable Wh × efficiency ÷ load watts. Pack
              volts = battery volts × batteries in series; pack Ah = battery Ah ×
              parallel strings. Usable share (labelled “usable share of the
              battery”) is a planning fraction of nameplate capacity — lead-acid
              setups commonly plan around 50%, many lithium packs around 80%.
              Both presets are editable; check the datasheet and cut-off
              settings. Health reduces energy when a pack is below rated
              capacity. Efficiency covers DC-to-AC conversion; the default 85%
              is editable from your unit&apos;s documentation when you have it.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Worked example: one 12 V 150 Ah battery, 50% usable, 100% health,
              85% efficiency and a 300 W load gives 900 usable Wh and about{" "}
              {SAMPLE.ok && SAMPLE.mode === "runtime"
                ? SAMPLE.runtimeHours.toFixed(2)
                : "2.55"}{" "}
              h (
              {SAMPLE.ok && SAMPLE.mode === "runtime"
                ? formatRuntimeLabel(SAMPLE.runtimeHours)
                : "2 h 33 min"}
              ). At 100% usable and 100% efficiency the same pack lasts 6.00 h.
              At 80% health on the first case: 720 Wh and about 2.04 h (
              {formatRuntimeLabel(2.04)}).
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Series batteries raise voltage; parallel strings raise amp-hours.
              Two 12 V 100 Ah batteries in series make 24 V / 100 Ah; the same
              two in parallel make 12 V / 200 Ah. Both store 2,400 nominal Wh. At
              50% usable, full health, 85% efficiency and a 400 W load, either
              arrangement gives 1,200 usable Wh and about 2.55 h — same energy,
              different DC voltage for the inverter.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Appliance-load example: four 40 W LED lights, one 15 W router, one
              65 W laptop and two 75 W fans total{" "}
              <span className="tabular-nums">{APPLIANCE_LOAD_W}</span> W. On a
              12 V 150 Ah battery at 50% usable, full health and 85% efficiency,
              usable energy is 900 Wh and runtime is about{" "}
              {(() => {
                const row = runtimeReferenceRow({
                  batteryVoltage: 12,
                  batteryAh: 150,
                  loadWatts: APPLIANCE_LOAD_W,
                });
                return `${row.runtimeHours.toFixed(2)} h (${formatRuntimeLabel(row.runtimeHours)})`;
              })()}
              . Use running watts from the label or a meter. Motors and
              compressors can need much more power at startup; that surge is not
              modelled. An optional inverter or UPS watt rating shows a calm
              warning if the steady load exceeds it.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              VA versus watts: watts = VA × power factor (and the reverse). The
              helper converts either way with an editable power factor; 0.7 is an
              example only. Use watts as the load for runtime or sizing. To size
              a pack: required Wh = load × hours ÷ (efficiency × usable ×
              health); required pack Ah = required Wh ÷ system voltage; series =
              system voltage ÷ battery voltage (must divide evenly); strings =
              ceil(required pack Ah ÷ battery Ah). For 500 W over 4 h at 85%
              efficiency and 50% usable on a 24 V system with 12 V 150 Ah
              batteries: about 4,706 Wh, 2 in series and 2 strings (4 total),
              giving about 6.12 h of actual runtime.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Not modelled: discharge-rate effects, temperature, ageing beyond
              the health % you enter, charging, solar input or wiring. No claims
              about lifespan, cycle counts or savings. For array sizing see the{" "}
              <Link
                href="/home-energy/solar-panel-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Solar Panel Calculator
              </Link>
              ; for kWh cost the{" "}
              <Link
                href="/home-energy/electricity-cost-calculator"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Electricity Cost Calculator
              </Link>
              ; for unit conversion the{" "}
              <Link
                href="/math/unit-converter"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Unit Converter
              </Link>
              . Results are planning estimates; manufacturers&apos; discharge
              tables are the reference. Batteries can be dangerous — a qualified
              electrician should install and check systems; batteries need
              ventilation and proper protection; follow manufacturer limits. This
              page gives no wiring, charging or installation instructions.
            </p>
          </section>

          <section aria-labelledby="table-heading">
            <div className="mb-4 max-w-3xl">
              <h2
                id="table-heading"
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                Example runtimes by battery and load
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Single-battery packs at {DEFAULT_USABLE_PERCENT}% usable share,
                100% health and {DEFAULT_EFFICIENCY_PERCENT}% efficiency —
                generated from the same function as the calculator, not typed by
                hand.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-card">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border bg-stone-50 text-[12px] tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Battery
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Load (W)
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Usable Wh
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Runtime
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_ROWS.map((row) => (
                    <tr
                      key={`${row.batteryVoltage}-${row.batteryAh}-${row.loadWatts}`}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-foreground">
                        {row.batteryVoltage} V · {row.batteryAh} Ah
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.loadWatts}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {row.usableWh.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">
                        {formatRuntimeLabel(row.runtimeHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {EEAT ? <CalculatorEeAtSections content={EEAT} /> : null}

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
              Results are planning estimates. Real runtime depends on battery
              age, temperature, discharge rate, chemistry, cut-off settings and
              the unit&apos;s own power draw. Manufacturers&apos; discharge
              tables are the reference. Batteries can be dangerous: this page
              does not give wiring, charging or installation instructions. A
              qualified electrician should install and check systems; batteries
              need ventilation and proper protection; follow the
              manufacturer&apos;s limits. This page does not claim lifespan,
              cycle counts or savings, and it does not recommend brands or
              retailers. Your inputs stay in the browser and are not stored by
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
                Electricity cost, solar sizing, and unit conversion.
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
