import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
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

const SITE = "Versus";
const DESCRIPTION =
  "The internet's biggest arena. Two contenders, one question, and a crowd that decides. Vote live on anything versus anything.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: { default: `${SITE} — anything vs. anything`, template: `%s · ${SITE}` },
  description: DESCRIPTION,
  openGraph: { title: SITE, description: DESCRIPTION, type: "website", siteName: SITE },
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
