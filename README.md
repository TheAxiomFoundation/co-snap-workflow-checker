# Colorado SNAP Workflow Checker

A browser-based workflow checker for Colorado SNAP application processing rules.

The first version maps a caseworker-facing form to Axiom RuleSpec concepts in:

- `10 CCR 2506-1 section 4.202`
- `10 CCR 2506-1 section 4.204`
- `10 CCR 2506-1 section 4.205`

It uses the shared Axiom UI shell and design tokens from `@axiom-foundation/ui`.

## Development

```bash
npm install
npm run dev
```

## Notes

This demo keeps the rule logic in `src/lib/coSnapWorkflow.ts` so the UI can later swap to compiled RuleSpec/WASM execution without changing the workflow surface.
