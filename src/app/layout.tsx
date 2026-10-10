import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

/**
 * Inter — variable font, excellent readability at all sizes.
 * Used for both headings (display weight) and body copy.
 * Single font family keeps the design restrained and editorial.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "NPL Hub Nepal",
  appleWebApp: {
    title: "NPL Hub Nepal",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/images/logo.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  title: {
    default: "NPL Hub Nepal — Nepal Premier League Cricket",
    template: "%s | NPL Hub Nepal",
  },
  description:
    "Independent information platform for the Nepal Premier League. Live scores, schedules, points table standings, team profiles, player rosters, statistics, and NPL news.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NPL Hub Nepal — Nepal Premier League Cricket",
    description:
      "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
    url: siteUrl,
    siteName: "NPL Hub Nepal",
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 512,
        height: 512,
        alt: "NPL Hub Nepal Logo",
      },
    ],
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Hub Nepal — Nepal Premier League Cricket",
    description:
      "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
    images: [`${siteUrl}/images/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://nplhubnepal.vercel.app/#website",
      url: "https://nplhubnepal.vercel.app/",
      name: "NPL Hub Nepal",
      alternateName: ["NPL Hub", "Nepal Premier League Hub"],
    },
    {
      "@type": "Organization",
      "@id": "https://nplhubnepal.vercel.app/#organization",
      name: "NPL Hub Nepal",
      url: "https://nplhubnepal.vercel.app/",
      logo: "https://nplhubnepal.vercel.app/images/logo.png",
    },
  ],
};

const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-VBLLG090FH";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId={gaId} />
    </html>
  );
}
