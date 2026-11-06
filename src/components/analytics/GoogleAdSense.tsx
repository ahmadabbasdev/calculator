"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isAdsAllowedPath } from "@/lib/analytics-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * AdSense loader. Loads only on substantial calculator tool pages —
 * not category hubs, trust pages, or sensitive NO_ANALYTICS paths.
 */
export function GoogleAdSense() {
  const pathname = usePathname();

  if (!ADSENSE_CLIENT) return null;
  if (!isAdsAllowedPath(pathname)) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
