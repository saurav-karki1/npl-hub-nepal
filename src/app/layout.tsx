import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "NPL Hub Nepal — Nepal Premier League Cricket",
    template: "%s | NPL Hub Nepal",
  },
  description:
    "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
  metadataBase: new URL("https://nplhub.com.np"),
  openGraph: {
    siteName: "NPL Hub Nepal",
    type: "website",
    locale: "en_NP",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
