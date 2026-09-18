import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { SiteFooter } from "@/components/site-footer";
import { SiteStructuredData } from "@/components/structured-data";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

/**
 * Fraunces carries the personality. Loading SOFT and WONK as real axes is the
 * point: SOFT rounds the terminals and WONK swaps in the playful alternates,
 * so headings get their character from the typeface itself rather than from
 * decoration piled on around them.
 */
const display = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-jakarta",
  display: "swap",
});

import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const SITE = SITE_NAME;
const DESCRIPTION = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: { default: `${SITE} — ${SITE_TAGLINE.toLowerCase()}`, template: `%s · ${SITE}` },
  description: DESCRIPTION,
  openGraph: {
    title: SITE,
    description: DESCRIPTION,
    type: "website",
    siteName: SITE,
    url: SITE_URL,
    locale: "en_GB",
  },
  robots: { index: true, follow: true },
  twitter: { card: "summary_large_image", title: SITE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#fdf8ef",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <SiteStructuredData />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        {/* Cookieless and aggregate-only: no identifier is stored on the
            device and nothing follows anyone between sites. Speed Insights
            samples real Core Web Vitals from actual visits rather than a
            synthetic lab run. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
