# SNAP Workflow Checker

A browser-based workflow checker for SNAP application processing rules, encoded
as Axiom RuleSpec and executed with the Axiom Rust/WASM rules engine. New York
is the default state; Colorado remains available from the in-app state switcher.

## Encoded rule surfaces

**New York (default) — OTDA SNAP Source Book §4 (Application Processing)**

One corpus-backed module, `us-ny:manuals/otda/snap-source-book/section-4`:

- §4(B) — right to apply and minimum filing content
- §4(D) — date of application, day one of the count, and the 30-day
  eligibility-and-issuance clock
- §4(E) — interviews (initial certification + every 12 months), the LDSS-4753
  missed-interview notice with no denial before the 30th day, the 60-day
  re-registration window, and the 5-day expedited standard

**Colorado — 10 CCR 2506-1**

- `4.202` — application content and validity
- `4.204` — interview timing and missed interviews
- `4.205` — normal and expedited processing clocks

## Corpus provenance

Both states' proof excerpts are backed by `axiom-corpus`:

- New York: `us-ny/manual/otda/snap-source-book/section-4` — the official OTDA
  SNAP Source Book (Sept 2025 edition, ingested 2026-05-27). Every `excerpt:`
  in the NY module is copied verbatim from the corpus provision body.
- Colorado: `us-co/regulation/10-ccr-2506-1/...` — the CCR SNAP rules ingest.

## New York encoding notes

- **Expedited is 5 days.** SNAPSB §4(E)(4) sets "eligibility and benefit
  issuance within 5 days for expedited processing" for NTA applicants (citing
  387.5). Note two conflicting figures elsewhere: §4(E)(1) says 7 days for
  NTA/SNAP and TA/SNAP interview scheduling, and 18 NYCRR 387.8(a) says the
  seventh calendar day. The module encodes the operative 5-day OTDA standard.
- **Day one is explicit.** §4(D)'s worked example ("the first day of the count
  is April 2nd" for an April 1st filing) supports the offset-of-1 parameter
  directly — no interpretation needed.
- **The 60-day check is a re-registration window** (§4(E)(5): the original
  application can be re-registered within 60 days), not Colorado's
  validity-window framing.
- The corpus currently holds 18 NYCRR 387.9/.10/.12/.14 but not 387.5/.7/.8;
  if those sections are ingested later, the module's citations can be extended
  to the regulation as well.

## Structure

- `public/rulespec/us-ny/…`, `public/rulespec/us-co/…` — RuleSpec YAML modules
- `src/lib/axiomRuntime.ts` — state-agnostic compile/execute plumbing for the
  Axiom WASM engine
- `src/lib/states/` — per-state definitions: module targets, dataset input
  mapping, parameter extraction, and result rows
- `src/components/WorkflowChecker.tsx` — the shared workflow surface

It uses the shared Axiom UI shell and design tokens from `@axiom-foundation/ui`.

## Development

```bash
npm install
npm run dev
```
