"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { isAdsAllowedPath } from "@/lib/analytics-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/** First interaction events that unlock the AdSense script. */
const INTERACTION_EVENTS = [
  "scroll",
  "mousemove",
  "touchstart",
  "keydown",
] as const;

/** Fallback delay (ms) if the user never interacts. */
const FALLBACK_MS = 4_000;

/**
 * AdSense loader. Loads only on substantial calculator tool pages —
 * not category hubs, trust pages, or sensitive NO_ANALYTICS paths.
 *
 * Script injection is deferred until the first user interaction
 * (scroll / mousemove / touchstart / keydown) or a 4-second fallback,
 * so initial paint and crawler quality checks see tool content first.
 * The google-adsense-account meta tag in root layout stays untouched.
 */
export function GoogleAdSense() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  const allowed =
    Boolean(ADSENSE_CLIENT) && isAdsAllowedPath(pathname ?? "");

  useEffect(() => {
    if (!allowed || shouldLoad) return;

    let done = false;

    function unlock() {
      if (done) return;
      done = true;
      setShouldLoad(true);
      window.clearTimeout(fallbackId);
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, unlock, { capture: true });
      }
    }

    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, unlock, {
        once: true,
        passive: true,
        capture: true,
      });
    }

    const fallbackId = window.setTimeout(unlock, FALLBACK_MS);

    return () => {
      done = true;
      window.clearTimeout(fallbackId);
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, unlock, { capture: true });
      }
    };
  }, [allowed, shouldLoad]);

  if (!allowed || !shouldLoad || !ADSENSE_CLIENT) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
