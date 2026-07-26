import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const LOGO_SRC = "/gallery/workflow/logos/axiom-foundation.svg";

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
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-rule)] px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="https://axiom-foundation.org"
            className="flex items-center gap-2 no-underline"
          >
            <img src={LOGO_SRC} alt="" className="h-6 w-auto shrink-0" />
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Axiom Foundation
            </span>
          </a>
          <a
            href="https://axiom-foundation.org/demos"
            className="text-sm text-[var(--color-ink-secondary)] no-underline hover:text-[var(--color-ink)]"
          >
            All demos
          </a>
        </header>
        <main className="relative z-10">{children}</main>
        <footer className="border-t border-[var(--color-rule)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)] sm:px-6 lg:px-8">
          <a
            href="https://axiom-foundation.org"
            className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          >
            axiom-foundation.org
          </a>
        </footer>
      </body>
    </html>
  );
}
