import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CONTACT_EMAIL, RESPONSE_TIME } from "@/lib/site-owner";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/contact";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Contact CalcDaily";
const PAGE_DESCRIPTION =
  "Email CalcDaily about calculator errors, data corrections, or tool requests. No form — messages go to email only.";

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
    { "@type": "ListItem", position: 2, name: "Contact", item: CANONICAL_URL },
  ],
};

export default function ContactPage() {
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
            { label: "Contact" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Contact
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Questions, corrections, or calculator requests — email only. There
            is no contact form and we do not store messages on this site.
          </p>
        </header>
        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
          <p>
            Write to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-zinc-950 underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            . Typical response time: {RESPONSE_TIME}.
          </p>
          <p>
            For a data or formula error, include the page URL and what you
            expected versus what you saw. For a new calculator idea, describe the
            inputs and the result you need.
          </p>
          <p>
            You can also read the{" "}
            <Link href="/about" className="font-medium text-zinc-950 underline">
              About
            </Link>{" "}
            page, the{" "}
            <Link href="/privacy" className="font-medium text-zinc-950 underline">
              Privacy Policy
            </Link>
            , or browse the{" "}
            <Link
              href="/calculators"
              className="font-medium text-zinc-950 underline"
            >
              calculator directory
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
