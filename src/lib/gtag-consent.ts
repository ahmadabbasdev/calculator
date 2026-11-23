/**
 * Google Consent Mode v2 helpers for GA4.
 * Defaults keep storage denied; Accept only grants analytics_storage.
 */

export type GtagConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const DENIED_DEFAULT = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

/** Push Consent Mode update when gtag is available (queued via dataLayer stub if needed). */
export function updateGtagAnalyticsConsent(status: GtagConsentState): void {
  if (typeof window === "undefined") return;

  const analytics_storage = status === "granted" ? "granted" : "denied";

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage });
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    "consent",
    "update",
    { analytics_storage },
  ]);
}

/** Inline bootstrap: stub gtag, default denied, restore prior Accept from localStorage. */
export function buildGtagConsentBootstrap(gaId: string, consentStorageKey: string): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', ${JSON.stringify({
    ...DENIED_DEFAULT,
    wait_for_update: 500,
  })});
try {
  if (navigator.globalPrivacyControl === true) {
    gtag('consent', 'update', { analytics_storage: 'denied' });
  } else {
    var raw = localStorage.getItem(${JSON.stringify(consentStorageKey)});
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.status === 'granted') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
      }
    }
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)}, {
  send_page_view: false,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
`.trim();
}
