import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Gamepad2 } from "lucide-react";
import { PalworldBreedingCalculator } from "@/components/calculators/PalworldBreedingCalculator";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  assertPalworldBuildGates,
  canAccessPalworldPage,
  GAMES_CATEGORY_PATH,
  isPalworldVerified,
  loadGoldenPairs,
  loadPalworldData,
  PALWORLD_PAGE_PATH,
} from "@/lib/palworld/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = PALWORLD_PAGE_PATH;
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;

const PAGE_TITLE = "Palworld Breeding Calculator - Child Predictor";
const PAGE_DESCRIPTION =
  "Estimate Palworld breeding results from two parents using rank averages, unique combinations, and same-species rules. Unofficial fan tool — verify in game.";

export const FAQ_ITEMS = [
  {
    question: "How does this calculator pick the child Pal?",
    answer:
      "Same species parents return that species. Otherwise a listed unique combination can override the formula when it matches (order-independent; gender-specific rows only when you set genders). If no unique match applies, the tool uses target rank floor((rankA + rankB + 1) / 2) and picks the closest breedable Pal that is not formula-excluded. Equal distances are ties — both candidates are shown for you to verify in game.",
  },
  {
    question: "What are unique or special combinations?",
    answer:
      "Some parent pairs always produce a specific child regardless of the rank formula. Those rows live in the unique list in the data file. This tool checks them before applying the average-rank rule.",
  },
  {
    question: "Why can two parents show more than one possible child?",
    answer:
      "When two formula-eligible Pals are equally close to the target rank, the calculator does not guess. It returns every tied candidate with a verify-in-game flag and lists any matching golden pair you recorded.",
  },
  {
    question: "Can I find which parents produce a target child?",
    answer:
      "Yes. Child → parents mode lists every unordered breedable pair whose forward result includes that child (same-species, unique combos, and formula matches, including ties). Long lists show 50 rows at a time with Show more.",
  },
  {
    question: "What does this tool not cover?",
    answer:
      "It does not model passive skills, IVs, cake requirements, mutations, gender-ratio RNG beyond optional unique-combo genders, incubation or hatching time, or multi-generation planning beyond one step.",
  },
  {
    question: "Why might results change after a game update?",
    answer:
      "Pocketpair can change ranks, breedability, or special combinations in patches. The page shows the dataset’s game version and extracted date. If that date is older than 60 days, a notice reminds you that updates can change breeding results — confirm important pairs in game.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  if (!canAccessPalworldPage()) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  const robots = isPalworldVerified()
    ? undefined
    : { index: false as const, follow: false as const };
  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    alternates: { canonical: CANONICAL_URL },
    robots,
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

export default function PalworldBreedingCalculatorPage() {
  if (!canAccessPalworldPage()) {
    notFound();
  }

  assertPalworldBuildGates();
  const data = loadPalworldData();
  const goldenPairs = loadGoldenPairs();
  const draft = !data.verified;

  const webApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Palworld Breeding Calculator",
    url: CANONICAL_URL,
    description: PAGE_DESCRIPTION,
    applicationCategory: "GameApplication",
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
        name: "Games",
        item: `${SITE_URL}${GAMES_CATEGORY_PATH}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Palworld Breeding Calculator",
        item: CANONICAL_URL,
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
          theme="games"
          items={[
            { label: "Home", href: "/" },
            { label: "Games", href: GAMES_CATEGORY_PATH },
            { label: "Palworld Breeding" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <p className="ui-label mb-2 inline-flex items-center gap-1.5 text-[13px] text-cat-games">
            <Gamepad2 className="size-4.5" aria-hidden="true" />
            {draft ? "Draft preview" : "Games"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Palworld Breeding Calculator
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
            Estimate which child two parents produce using your verified rank
            table and unique combinations — text only, no game assets.
          </p>
        </header>

        <PalworldBreedingCalculator data={data} goldenPairs={goldenPairs} />

        <article className="mt-20 space-y-16">
          <section aria-labelledby="how-heading" className="max-w-3xl space-y-4">
            <h2
              id="how-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              How Palworld breeding is estimated here
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">
              Breeding in Palworld pairs two parent Pals and yields an egg whose
              species follows a small set of documented rules. This calculator
              implements those rules against a JSON dataset you supply: each Pal
              has a power rank, a breedable flag, and an optional
              formula-excluded flag for species the average-rank rule never
              produces (for example many legendaries). You own the extraction —
              CalcDaily does not scrape other fan calculators or invent ranks.
              Calculations run in your browser; selections are not written to
              the URL, storage, cookies, or analytics events.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              When both parents are the same species, the child is that species.
              That same-species shortcut runs before unique rows and before the
              rank formula, matching how players expect a pure breed to behave.
              Otherwise the tool looks for a unique combination: an explicit
              parent pair mapped to a fixed child. Matching is
              order-independent, so A×B and B×A resolve the same unless a
              gender-specific row says otherwise. Rows that also list genders
              apply only when you choose genders for both parents, so one
              species pair can resolve to different children for male/female
              versus female/male when your data encodes that.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              If no unique row matches, the formula computes a target rank of
              floor((rankA + rankB + 1) / 2). The candidate pool is every
              breedable Pal with formulaExcluded set to false. The child is the
              pool member whose rank is closest to that target. When two or more
              Pals share the same distance, the calculator does not guess: it
              returns every tied candidate labeled “tie: verify in game” and
              lists any golden pair you recorded for those parents. Golden pairs
              are in-game checks you maintain in{" "}
              <code className="text-[13px]">golden-pairs.json</code>. When{" "}
              <code className="text-[13px]">pals.json</code> is marked{" "}
              <code className="text-[13px]">verified: true</code>, every golden
              pair must pass validation or the release fails.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Child-to-parents mode walks breedable pairs and keeps those whose
              forward result includes your target. That covers same-species
              self-pairs, unique combinations, exact formula hits, and ties that
              list the target among candidates. A few hundred Pals imply on the
              order of tens of thousands of unordered pairs, which is still fast
              enough to compute entirely in the browser. Long result lists show
              fifty rows at a time with a Show more control. Parent and child
              pickers use an accessible searchable combobox filtered by name.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              This tool does not cover passive skills, IV-style stats, cake or
              ranch requirements, mutations, incubation timers, hatching time,
              ranch assignment, or multi-generation breeding trees beyond a
              single step. It cannot tell you hatch gender odds beyond optional
              unique-combo gender gates, and it is not a substitute for the game
              client. Pocketpair patches can change ranks, breedability, and
              special combinations; the page always shows game version and
              extracted date from your file, and warns when that extraction is
              older than sixty days so you know to re-check important pairs.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Until you set verified to true after filling pals.json and golden
              pairs, this page stays draft: visible in development and preview
              only, omitted from the homepage, footer, sitemap, llms.txt, and
              header Games link, and returning 404 in production.
            </p>
            <p className="text-[13px] leading-relaxed text-zinc-600">
              Unofficial fan tool, not affiliated with or endorsed by Pocketpair.
              Palworld and related names belong to their owners. No affiliate
              links and no server-hosting promotion.
            </p>
          </section>

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Frequently Asked Questions
            </h2>
            <div className="mt-4 max-w-3xl divide-y divide-border/80">
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
        </article>
      </main>
      <Footer />
    </>
  );
}
