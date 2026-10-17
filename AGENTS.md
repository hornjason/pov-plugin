---
doc-type: reference
status: active
owner: jason
updated: 2026-10-16
---

# pov-plugin

## Project Identity

A Claude Code plugin that generates unsolicited customer POVs — a one-page visual document plus the outreach email that carries it — from account intelligence held in a locally running dashboard.
**Tech:** Bun, TypeScript, ESM
- **Repo:** https://github.com/hornjason/pov-plugin

## Specs

| Spec | What it governs |
|------|-----------------|
| `specs/POV-SPEC.md` | The methodology — 40 design rules and 40 success criteria. Everything the skill generates is graded against it. |

## Rules

- Verify before asserting — try it first, report what actually happened
- Never fake results or hide failures — if it fails, report it honestly
- Fix all test failures before reporting done — a green suite is the minimum bar
- Run full test suite (`bun test`) and show real output — no summaries, no skipped files
- Fix the source, not the output — fix generator, not generated files
- Commit all changes before reporting done — uncommitted work is lost work
- Read PROJECT-STATE.md first on session start — it's the session bridge

## Commands

| Action | Command |
|--------|---------|
| Test | `bun test` |
| Type check | `bun run typecheck` |
| Conformity | `bun test test/scaffold-conformity.test.ts` |
| Create spec | `bunx rungate create-spec "title"` |
| Create SC | `bunx rungate create-sc --pattern <name> --params '<json>'` |
| Re-scaffold | `bunx rungate scaffold .` |

## Install / Consume

Published to npm as `rungate`.

```bash
bun add -d rungate
bunx rungate scaffold .
bunx rungate --help
```

Pin the version: re-scaffolding on a newer rungate rewrites generated files.


## Workflow
- **Repo:** https://github.com/hornjason/pov-plugin
- **Test:** `bun test`
