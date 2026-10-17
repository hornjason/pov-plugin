---
doc-type: reference
status: active
owner: jason
updated: 2026-10-15
---

# Worked Example — Northwind Logistics

**Northwind Logistics is fictional.** Every name, number, initiative, and signal in this
directory is invented to demonstrate the format. Nothing here describes a real account.

This is what the skill produces. Read it alongside `specs/POV-SPEC.md` to see how each
rule shows up in a finished artifact.

## The scenario

Northwind Logistics, a mid-market freight brokerage, is running three initiatives that
its own teams treat as separate:

1. **Project Lantern** — consolidating two regional data centers after an acquisition
2. A **driver-app rewrite** stalled on environment parity
3. A board mandate to **put an ML model into dispatch routing** by Q3

The convergence thesis: these are one platform decision, not three projects. The
acquisition gave them two incompatible environments, the app rewrite is blocked by that
same incompatibility, and the ML workload needs the capacity that consolidation frees.

## Files

| File | What it shows |
|---|---|
| `one-pager.html` | Rules 16-34 — narrative arc, convergence callout, two-column diagram, one honest trade-off |
| `emails.md` | Rules 1-15 — short and long versions for two personas, different peer reference each |

## What to notice

- The honest trade-off is stated, not buried. One concession, not five (rule 29).
- Each persona gets a different case study (rule 9).
- No date anywhere, so it still forwards in six weeks (rule 25).
- Every claim has a number or a named company (rule 28).
- Swap the product for a competitor and the convergence argument stops working — that is
  the competitor-swap test passing (rule 37).
