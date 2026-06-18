<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Axiom Runtime Rule

- This repo is an Axiom demo/app. Anything presented as an Axiom calculation, workflow check, or legal-rule result must execute real Axiom software: the Axiom Rust/WASM rules engine, Axiom API, compiled RuleSpec artifact, or another actual Axiom runtime path.
- Do not add or preserve hand-written TypeScript/Python/etc. policy evaluators, mock rule engines, demo-only logic models, or hard-coded parallel calculations as substitutes for Axiom execution.
- If a desired workflow cannot currently run on real Axiom software, make that limitation explicit in the UI and implementation notes and do not label the result as Axiom-powered.
