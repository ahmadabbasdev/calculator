import Script from "next/script";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";
import { buildGtagConsentBootstrap } from "@/lib/gtag-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Server-only Consent Mode v2 bootstrap for the root layout.
 * `beforeInteractive` must live in app/layout.tsx (not a Client Component).
 */
export function GtagBootstrap() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        id="ga4-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: buildGtagConsentBootstrap(GA_ID, CONSENT_STORAGE_KEY),
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
