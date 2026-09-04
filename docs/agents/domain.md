# Domain docs

This repo uses a **single-context** layout: one domain overview plus ADRs at the repo root.

## Layout

- `CONTEXT.md` (repo root) — the product/domain overview: what this app is, who it's for, and how its main pieces fit together.
- `docs/adr/` — architecture decision records, one file per significant decision, named `NNNN-title.md`.

## Consumer rules

- **Before** planning or implementing any domain-touching change, read `CONTEXT.md`. If it contradicts what you find in the code, surface the discrepancy instead of silently picking one.
- **During** work that makes a significant, hard-to-reverse architectural decision (data model shape, external service choice, auth/flow structure), write an ADR in `docs/adr/` capturing the decision and its rationale.
- **After** work that changes a domain fact described in `CONTEXT.md`, update `CONTEXT.md` in the same change so it stays trustworthy.
- Don't duplicate code-level detail into `CONTEXT.md`; it records the domain and the "why", not the "how".
