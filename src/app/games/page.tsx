import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CalculatorCard } from "@/components/home/CalculatorCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  CALCULATOR_CATEGORIES,
  getCategoryTheme,
  isCalculatorLive,
} from "@/lib/calculators";
import {
  allowsDraftPages,
  canAccessPalworldPage,
  GAMES_CATEGORY_PATH,
  isPalworldVerified,
  PALWORLD_PAGE_PATH,
} from "@/lib/palworld/load";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const category = CALCULATOR_CATEGORIES.find((item) => item.id === "games")!;
const theme = getCategoryTheme("games");

const PAGE_TITLE = "Games Calculators — CalcDaily";
const PAGE_DESCRIPTION =
  "Unofficial game calculators on CalcDaily. Fan tools only — not affiliated with game publishers.";

export async function generateMetadata(): Promise<Metadata> {
  if (!isPalworldVerified() && !allowsDraftPages()) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${SITE_URL}${GAMES_CATEGORY_PATH}` },
    robots: isPalworldVerified()
      ? undefined
      : { index: false, follow: false },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      type: "website",
      url: `${SITE_URL}${GAMES_CATEGORY_PATH}`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
    },
  };
}

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
  ],
};

export default function GamesCategoryPage() {
  // Category hub is public only when the first games tool is live;
  // draft/preview may still open it for QA.
  if (!isPalworldVerified() && !allowsDraftPages()) {
    notFound();
  }

  const Icon = category.icon;
  const liveTools = category.calculators.filter(isCalculatorLive);
  const showDraftLink = !isPalworldVerified() && canAccessPalworldPage();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          theme={theme}
          items={[
            { label: "Home", href: "/" },
            { label: "Games" },
          ]}
        />

        <header className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Games Calculators
            </h1>
          </div>
          <p className="text-base text-muted sm:text-lg">{category.description}</p>
        </header>

        <section aria-labelledby="games-tools-heading">
          <h2 id="games-tools-heading" className="sr-only">
            Available games calculators
          </h2>
          {liveTools.length > 0 ? (
            <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liveTools.map((calculator) => (
                <CalculatorCard
                  key={calculator.id}
                  calculator={calculator}
                  theme={theme}
                />
              ))}
            </div>
          ) : showDraftLink ? (
            <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-700">
              Draft preview only — not listed on the homepage or in production.{" "}
              <Link
                href={PALWORLD_PAGE_PATH}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Open Palworld Breeding Calculator
              </Link>
            </p>
          ) : (
            <p className="text-[15px] text-zinc-700">
              No live games calculators yet.
            </p>
          )}
        </section>

        <div className="mt-12 border-t border-border/80 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-900 shadow-card transition hover:border-zinc-400 hover:bg-stone-50"
          >
            <ArrowLeft className="size-4 text-muted" aria-hidden="true" />
            Back to all calculators
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
