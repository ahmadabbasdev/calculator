"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_REOPEN_EVENT,
  getConsent,
  hasGlobalPrivacyControl,
  setConsent,
  subscribe,
  type ConsentStatus,
} from "@/lib/consent";
import { updateGtagAnalyticsConsent } from "@/lib/gtag-consent";

/**
 * Fixed bottom consent bar. Renders only after hydration.
 * Accept/Reject update Consent Mode v2 (analytics_storage) via gtag;
 * Analytics.tsx always loads gtag with default denied storage.
 */
export function ConsentBanner() {
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsentState] = useState<ConsentStatus>("unset");
  const [forcedOpen, setForcedOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setConsentState(getConsent());
    const unsub = subscribe(setConsentState);
    const onReopen = () => setForcedOpen(true);
    window.addEventListener(CONSENT_REOPEN_EVENT, onReopen);
    return () => {
      unsub();
      window.removeEventListener(CONSENT_REOPEN_EVENT, onReopen);
    };
  }, []);

  if (!hydrated) return null;
  if (hasGlobalPrivacyControl()) return null;

  const visible = forcedOpen || consent === "unset";
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Analytics cookie consent"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-zinc-300 bg-white p-4 text-zinc-900 shadow-lg sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm leading-relaxed text-zinc-800">
          We&apos;d like to use analytics cookies to understand how the site is
          used. Your calculator inputs are never included.{" "}
          <Link
            href="/privacy"
            className="font-medium text-zinc-950 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="min-h-10 flex-1 rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:flex-none sm:min-w-[9.5rem]"
            onClick={() => {
              setConsent("denied");
              updateGtagAnalyticsConsent("denied");
              setForcedOpen(false);
            }}
          >
            Reject
          </button>
          <button
            type="button"
            className="min-h-10 flex-1 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:flex-none sm:min-w-[9.5rem]"
            onClick={() => {
              // Persist first so Analytics subscribers update Consent Mode + page_view.
              setConsent("granted");
              updateGtagAnalyticsConsent("granted");
              setForcedOpen(false);
            }}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
