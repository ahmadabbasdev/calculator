import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/disclaimer";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Disclaimer — CalcDaily";
const PAGE_DESCRIPTION =
  "CalcDaily calculators provide estimates for general information only. Not tax, legal, medical, or financial advice.";

export const metadata: Metadata = {
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
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Disclaimer",
      item: CANONICAL_URL,
    },
  ],
};

export default function DisclaimerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Disclaimer" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Disclaimer
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Short statement of what {SITE_NAME} is — and is not.
          </p>
        </header>
        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
          <p>
            Calculators on {SITE_NAME} produce estimates for general information
            only. They are not a substitute for advice from a licensed tax
            professional, attorney, financial advisor, clinician, or other
            qualified expert.
          </p>
          <p>
            Tax, health, and finance pages may show figures copied from public
            sources for a stated year. Those sources can change. Always confirm
            with the official publisher before filing, paying, or making a
            health or money decision.
          </p>
          <p>
            Game-related tools (when published) are unofficial fan utilities and
            are not affiliated with or endorsed by the game publishers.
          </p>
          <p>
            Full terms are on the{" "}
            <Link href="/terms" className="font-medium text-zinc-950 underline">
              Terms of Use
            </Link>{" "}
            page. Privacy details are on the{" "}
            <Link href="/privacy" className="font-medium text-zinc-950 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
