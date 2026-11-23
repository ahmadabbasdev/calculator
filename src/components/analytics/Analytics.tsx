"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getConsent, subscribe } from "@/lib/consent";
import {
  isCanonicalHostname,
  isNoAnalyticsPath,
} from "@/lib/analytics-config";
import { updateGtagAnalyticsConsent } from "@/lib/gtag-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function setGaDisabled(disabled: boolean) {
  if (!GA_ID || typeof window === "undefined") return;
  window[`ga-disable-${GA_ID}`] = disabled;
}

/**
 * Send a page_view under Consent Mode. Fires cookieless pings when storage
 * is denied (gcs=G100) and full hits when analytics_storage is granted (G110).
 */
function sendPageView(pathname: string) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  if (isNoAnalyticsPath(pathname)) return;
  if (!isCanonicalHostname()) return;
  if (window[`ga-disable-${GA_ID}`]) return;

  const pageLocation = `${window.location.origin}${pathname}`;

  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: pageLocation,
    page_title: document.title,
  });
}

/**
 * Client GA4 wiring on top of GtagBootstrap (Consent Mode v2).
 * Syncs Accept/Reject to gtag consent updates and sends SPA page_views.
 */
export function Analytics() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const pathBlocked = isNoAnalyticsPath(pathname);

  useEffect(() => {
    if (!GA_ID) return;

    const sync = () => {
      const status = getConsent();
      if (status === "granted") updateGtagAnalyticsConsent("granted");
      else if (status === "denied") updateGtagAnalyticsConsent("denied");
    };

    sync();
    return subscribe((next) => {
      if (next === "granted") {
        updateGtagAnalyticsConsent("granted");
        // Re-send page_view so the hit upgrades from cookieless (G100) to granted (G110).
        if (
          !isNoAnalyticsPath(pathnameRef.current) &&
          isCanonicalHostname()
        ) {
          setGaDisabled(false);
          sendPageView(pathnameRef.current);
        }
      } else if (next === "denied") {
        updateGtagAnalyticsConsent("denied");
      }
    });
  }, []);

  useEffect(() => {
    if (!GA_ID) return;

    if (pathBlocked || !isCanonicalHostname()) {
      setGaDisabled(true);
      return;
    }

    setGaDisabled(false);
    sendPageView(pathname);
  }, [pathname, pathBlocked]);

  // Initial hit once gtag.js finishes (bootstrap loads it in layout).
  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;

    const onReady = () => {
      const status = getConsent();
      if (status === "granted") updateGtagAnalyticsConsent("granted");
      else if (status === "denied") updateGtagAnalyticsConsent("denied");
      if (!isNoAnalyticsPath(pathnameRef.current) && isCanonicalHostname()) {
        setGaDisabled(false);
        sendPageView(pathnameRef.current);
      }
    };

    if (typeof window.gtag === "function") {
      onReady();
      return;
    }

    const timer = window.setInterval(() => {
      if (typeof window.gtag === "function") {
        window.clearInterval(timer);
        onReady();
      }
    }, 50);

    const stop = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, []);

  return null;
}
