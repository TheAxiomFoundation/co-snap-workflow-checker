import type { Metadata } from "next";
import Link from "next/link";
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
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="https://axiom-foundation.org"
              aria-label="Axiom Foundation"
              className="inline-flex w-[100px] shrink-0 no-underline"
            >
              <img
                src={LOGO_SRC}
                alt="Axiom Foundation"
                width={100}
                className="block h-auto w-full"
              />
            </a>
            <Link
              href="/"
              className="min-w-0 border-l border-[var(--color-rule)] pl-3 no-underline"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                Interactive
              </div>
              <div className="font-serif text-[16px] font-normal leading-tight text-[var(--color-ink)]">
                Workflow checker
              </div>
            </Link>
          </div>
          <a
            href="https://axiom.org/demos"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)] no-underline hover:text-[var(--color-accent)] hover:underline"
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
