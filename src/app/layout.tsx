import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono, Newsreader } from "next/font/google";
import { Footer, GradientSync, Nav } from "@axiom-foundation/ui";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SNAP workflow checker — Axiom Foundation",
  description:
    "A case-processing checklist for SNAP application rules encoded in Axiom RuleSpec — New York (18 NYCRR Part 387) by default, with Colorado (10 CCR 2506-1).",
  openGraph: {
    type: "website",
    siteName: "Axiom Foundation",
    title: "SNAP workflow checker",
    description:
      "Check filing, interview, and processing deadlines against New York and Colorado SNAP RuleSpec concepts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SNAP workflow checker",
    description:
      "Check filing, interview, and processing deadlines against New York and Colorado SNAP RuleSpec concepts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2YHG89FY0N"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config","G-2YHG89FY0N");`}
        </Script>
        <GradientSync />
        <Nav
          baseUrl="https://axiom-foundation.org"
          logoSrc="/gallery/workflow/logos/axiom-foundation.svg"
        />
        <main className="relative z-10">{children}</main>
        <Footer
          renderLink={Link}
          baseUrl="https://axiom-foundation.org"
          logoSrc="/gallery/workflow/logos/axiom-foundation.svg"
        />
      </body>
    </html>
  );
}
