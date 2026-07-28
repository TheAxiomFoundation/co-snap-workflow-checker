# SNAP Workflow Checker

A browser-based workflow checker for SNAP application processing rules, encoded
as Axiom RuleSpec and executed with the Axiom Rust/WASM rules engine. New York
is the default state; Colorado remains available from the in-app state switcher.

## Encoded rule surfaces

**New York (default) — 18 NYCRR Part 387**

- `387.5` — filing, minimum application content, and the 30-day processing clock
- `387.7` — interview timing and missed-interview notices
- `387.8` — expedited service benefit availability

**Colorado — 10 CCR 2506-1**

- `4.202` — application content and validity
- `4.204` — interview timing and missed interviews
- `4.205` — normal and expedited processing clocks

## New York encoding notes

- The NYCRR text sets the expedited benefit deadline at the **seventh calendar
  day** after filing (387.8(a)). OTDA policy directives describe a five-day
  expedited practice, but that figure is not in the regulation, so the modules
  encode 7.
- New York's regulations do not contain Colorado's 60-day application validity
  window or the 30th-day missed-interview denial rule (those live in federal
  rules and OTDA policy), so the New York checklist omits those two checks.
- The processing "day one" offset of 1 calendar day after receipt is an
  interpretation of "within 30 days of filing an application" (387.5(f))
  combined with the filing-date rule in 387.5(c); the regulation does not state
  the offset explicitly.

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
