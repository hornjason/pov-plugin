---
doc-type: reference
status: active
owner: jason
updated: 2026-10-16
---

## No customer data, ever

Real company names, personal or corporate email addresses, LinkedIn profile
URLs, Google Drive file and folder IDs, Google Docs document IDs, and internal
issue references do not belong in this repo. Examples use fictional companies
only — `examples/northwind-logistics/` is the pattern to copy.

## Why this is a rule and not a preference

This repo is public and installed by other people as a Claude Code plugin. The
POV methodology it carries was developed against real accounts, so every file
in it started life next to data that must not ship. "Be careful" is not a
control; the gate is.

`test/pov-plugin.test.ts` enforces it. `piiViolations()` is the single exported
binding — one function, so there is one thing to mutate — and
`test/pii-scan-mutation.test.ts` proves it can fail by feeding it
shape-correct synthetic strings of each kind and asserting each one is caught.

**Do not weaken the gate to make a commit pass.** If the gate fires, the
finding is the problem, not the pattern. The one exception is already encoded:
`SELF_REFERENTIAL` lists the two test files that must contain the patterns in
order to test for them, and `ALLOWLIST-1` pins that set to exactly two entries
so it cannot grow quietly.

The fixtures in `test/pii-scan-mutation.test.ts` are synthetic **by design**.
An earlier draft used a real Google Drive ID as a test fixture and this gate
caught it before the commit — which is the whole argument for having it.

## When you need to describe a real engagement

Say what happened without saying who. "A logistics customer consolidating three
WMS instances" carries the methodology; the company name carries nothing the
reader needs and everything the repo must not hold.
