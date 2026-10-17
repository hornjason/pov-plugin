---
doc-type: project-state
status: in-progress
owner: jason
updated: 2026-10-17
stop-point: Published and installable. Claims 1 and 5 true and measured. Remaining: one end-to-end run against a live dashboard (claim 2), two renders compared by eye (claim 3), and the HTTPS clone path for a colleague with no SSH key.
---

# pov-plugin — Project State

## Current State (2026-10-17)

A Claude Code plugin packaging the POV methodology for distribution. Extracted clean
from a local working directory, which stays private and was not modified.

### Done

- [x] Repo scaffolded, git initialized on `main`
- [x] Marketplace + plugin manifests, single-repo pattern (`"source": "./"`)
- [x] `skills/pov/SKILL.md` reading the spec via `${CLAUDE_PLUGIN_ROOT}`
- [x] `specs/POV-SPEC.md` retyped clean — 40 rules, 40 SCs, no customer data
- [x] `skills/pov/references/dashboard-api.md` — the 15 endpoints the skill consumes
- [x] `skills/pov/references/humanization.md` — AI-tell checklist
- [x] Fictional worked example (Northwind Logistics): one-pager HTML + two personas
- [x] Portable gate: PII scan, manifest validation, skill loadability, no-exec-surface
- [x] **Claim 5 (tree)** — the gate no longer publishes the list it protects
- [x] **Claim 4, second row** — several dashboards is a question, not a guess
- [x] **Claim 3 mechanism** — `templates/one-pager.html.tmpl` ships, with an override
- [x] The dashboard port corrected from `3000` to `7777`/`7776`
- [x] `bun test` → 58 pass, 0 fail, 4 files; `bun run typecheck` → 0 errors

### Not done

- [ ] **One end-to-end run against a live dashboard** (claim 2). Deliberately not
      done unattended — the last step publishes to a real customer's Drive folder.
      It also settles whether anything renders the PDF the spec describes.
- [ ] **Two renders compared by eye** (claim 3). The template ships and the override
      works; the evidence that two POVs look alike does not exist and is not
      automatable.
- [ ] **Drive the two refusals against a live dashboard** (claim 4). Both are written
      and tested as prose. Neither has fired in anger — and both dashboards are up
      right now, so the several-dashboards case is reproducible on demand.
- [ ] **The HTTPS clone path.** The cold install succeeded but cloned over SSH,
      because this machine is configured for it. A colleague with no GitHub SSH key
      takes a different path.

## Before the first push: the history is not clean

The working tree carries no customer data and the gate proves it. **The clone does
not.** Three commits predate the gate rewrite and carry the old pattern list, which
enumerated five real account names and a corporate domain. `git log -p` is what a
reader actually gets, and a tree-scanning gate cannot see it — a green suite says
nothing about this.

The repo has never been pushed, so the fix is free: squash to a single initial commit
before creating the remote. It has to happen **before**, not after. A public commit is
public the moment it lands, and GitHub serves and caches it within minutes.

## Upstream: rungate 0.5.0

The blocker was never only the one bug recorded here previously. Measured 2026-10-17:

- Published `0.4.1` **cannot scaffold an external consumer at all**. `bunx rungate
  scaffold .` dies with `ENOENT` on `node_modules/rungate/config/matcher-registry.json`
  — `lib/conformity.ts` reads its matcher registry by building a path from its own
  module directory rather than importing it, so the package-closure check, which knew
  only about imports, could not see that `files[]` omitted `config/`.
- `--profile=minimal`, which this repo's `.claude/rules/key-files.md` says it scaffolds
  with, **is not in published 0.4.1**. This repo was built against a local checkout and
  has never been built against anything a stranger could install.

Both are fixed in rungate `0.5.0`, cut 2026-10-17. It is a minor and not the planned
patch because `--profile=minimal` adds a CLI flag and a published module, and two other
changes turn a pass into a refusal.

## Decisions

| Decision | Why |
|---|---|
| Clean repo, not a sanitized copy of the private working directory | Copying is how IDs survive. The spec was retyped, not sed'd. |
| Plugin, not a bare skill | A bare skill has no install or update mechanism at all. |
| Dashboard HTTP API as the only integration | One documented dependency instead of a pile of MCP servers and OAuth. |
| No degraded mode when the dashboard is down | A POV from public research alone is the generic outreach the spec exists to prevent. |
| Sapling dev-only | Paid account; its findings became a static checklist instead. |
| No hooks, no MCP, no `bin/` | Keeps the plugin reviewable before install. Asserted by test. |
| PII identities in an untracked file, absence is a refusal | A gate that lists five customers to keep them out publishes those five customers. |
| The PII scan reads `git ls-files`, not a filesystem walk | The tracked set is exactly what a clone receives; a walk would also open the untracked identity list. |
| Files selected by a binary-content check, not an extension allowlist | The allowlist silently skipped four tracked files, one of which really did carry a leak. |
| One shipped template rather than per-run composition | Two documents can honour every rule and share no visual DNA. |

## Open questions, carried rather than resolved

- **The PDF.** The spec says the one-pager is a *"PDF rendered from HTML"* and nothing
  in the plugin names a tool that renders PDFs, while the dashboard's publish path
  tracks a doc and an HTML and no PDF. Either the spec describes an artifact the
  pipeline does not produce, or the rendering lives somewhere not yet found. The first
  end-to-end run settles it.
- **Peer references are real companies.** `examples/northwind-logistics/one-pager.html`
  names two in its Numbers table. The customer is fictional, as the rule requires, but a
  peer reference has to be real to be credible — that is what a peer reference IS. The
  PII gate passes because neither is on the identity list. Flagging rather than deciding:
  if published case studies are acceptable to name, the rule should say so; if not, the
  example needs fictional references and loses some of its point.
