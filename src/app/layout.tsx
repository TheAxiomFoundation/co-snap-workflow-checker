import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Colorado SNAP workflow checker — Axiom Foundation",
  description:
    "A case-processing checklist for Colorado SNAP application rules encoded in Axiom RuleSpec.",
  openGraph: {
    type: "website",
    siteName: "Axiom Foundation",
    title: "Colorado SNAP workflow checker",
    description:
      "Check filing, interview, and processing deadlines against Colorado SNAP RuleSpec concepts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Colorado SNAP workflow checker",
    description:
      "Check filing, interview, and processing deadlines against Colorado SNAP RuleSpec concepts.",
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
