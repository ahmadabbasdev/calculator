import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Analytics } from "@/components/analytics/Analytics";
import { GoogleAdSense } from "@/components/analytics/GoogleAdSense";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Calculator pages use absolute titles; do not append the brand.
    template: "%s",
  },
  description: "Free online calculators for dates, math, and everyday planning.",
  openGraph: {
    siteName: SITE_NAME,
  },
  verification: {
    google: "jWFdGpjD6MmNLIWGQHGi-YRvgl7qcJoVIpjDAvvGouQ",
  },
  ...(adsenseClientId
    ? { other: { "google-adsense-account": adsenseClientId } }
    : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-zinc-900 selection:text-white">
        <ScrollToTop />
        <aside
          aria-label="Announcement"
          className="border-b border-zinc-800 bg-[#121316] px-4 py-2 text-center text-xs text-zinc-300"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 font-medium">
            <span>
              Calculations run in your browser. Optional holiday lists are
              static files loaded in the browser.
            </span>
          </div>
        </aside>
        {children}
        <GoogleAdSense />
        <Analytics />
        <ConsentBanner />
        <VercelAnalytics />
      </body>
    </html>
  );
}
