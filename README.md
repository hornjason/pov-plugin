---
doc-type: reference
status: active
owner: jason
updated: 2026-10-15
---

# POV Plugin

A Claude Code plugin that generates unsolicited customer POVs — a one-page visual
document plus the outreach email that carries it — from account intelligence held in a
locally running dashboard.

Built on 40 research-backed design rules drawn from RAIN Group, Corporate Visions,
Gartner, Forrester, Challenger, and 2025-2026 cold outreach benchmarking. The rules and
their success criteria live in [`specs/POV-SPEC.md`](specs/POV-SPEC.md).

## Install

```bash
claude plugin marketplace add hornjason/pov-plugin
claude plugin install pov@pov-marketplace
```

Or in a session: `/plugin install pov --marketplace hornjason/pov-plugin`

**Updates are not automatic.** Marketplaces outside Anthropic's own have auto-update off
by default. To pull a new version:

```bash
claude plugin update pov@pov-marketplace
```

To turn auto-update on instead: `/plugin` → Marketplaces → select `pov-marketplace` →
Enable auto-update.

## Use

```
run a POV for Northwind Logistics
```

The skill reads the spec, pulls intelligence from your dashboard, builds a convergence
thesis, generates the one-pager and per-persona emails, self-reviews against the quality
gates, and publishes back to the customer's folder.

## Requirements

A dashboard running locally that exposes the account intelligence API. The skill
looks for it on port `7777`, then on `7776` (the test instance), trying
`localhost`, `127.0.0.1` and `host.docker.internal` for each. Set
`POV_DASHBOARD_URL` to skip discovery entirely and point it somewhere else —
when that is set it is used as given, with no probing and no fallback. The
endpoints used are listed in
[`skills/pov/references/dashboard-api.md`](skills/pov/references/dashboard-api.md).

If no dashboard is reachable the skill stops and lists every URL it tried. There is
no degraded mode — a POV built from public research alone is exactly the generic
outreach the spec exists to prevent.

If **more than one** is reachable it asks which, and will not choose for you. Both
instances answer the health check identically and test data is indistinguishable from
real data in the response, while the last step publishes to the customer's real Drive
folder. Guessing there does not fail loudly; it produces a plausible document in the
right place built from fixtures.

**Your dashboard also has to be new enough.** The plugin drives three
endpoints — `POST /api/customer/:name/pov/context` for the grounded facts,
`POST /api/customer/:name/pov/score` for the conformance gate, and
`POST /api/customer/:name/pov/publish` to write the finished artifact. A
dashboard older than those is reachable but cannot do the job, and the skill
refuses with a message saying so rather than failing somewhere less obvious.

**No model credential is required of you.** The writing happens in your own
Claude Code session — the dashboard supplies the account intelligence and the
grounded research, and grades what you wrote. That split is the whole reason
this is installable by someone who has no cloud project of their own.

It decides that by asking the endpoint, not by comparing a version number. A
version is a label about the software; the endpoint is the software. Anyone
running a locally built dashboard has the API and no release to point at, so a
"version ≥ X" check would turn away the one person who definitely works —
and a future release could ship the route disabled, which the same check would
wave through.

## Changing how the one-pager looks

The one-pager is built from `templates/one-pager.html.tmpl`, which ships in
this repo. That is deliberate: it is what makes two POVs for two different
customers look like the same product rather than two documents that each
happen to follow the same rules.

To use your own, copy it, edit it, and point at the copy:

```bash
export POV_TEMPLATE_PATH=~/my-pov-template.html.tmpl
```

Keep the `{{PLACEHOLDER}}` names — the skill fills those in by name. Everything
else, including the whole stylesheet, is yours to change.

## What's in here

| Path | What |
|---|---|
| `specs/POV-SPEC.md` | The 41 design rules and 43 success criteria |
| `skills/pov/SKILL.md` | The skill |
| `skills/pov/references/dashboard-api.md` | Endpoints the skill consumes |
| `skills/pov/references/humanization.md` | AI-tell checklist, run before any draft ships |
| `examples/northwind-logistics/` | A complete worked example, fictional company |

## No executable surface

This plugin ships documentation and a skill. No hooks, no MCP servers, no `bin/`.
Nothing in it runs on install, and a test asserts that stays true — so you can read the
whole thing before you trust it.

## Privacy

No customer data ships in this repo. The worked example is a fictional company. A
test (`test/pov-plugin.test.ts`) scans the whole tree for corporate email addresses,
LinkedIn profile URLs, Drive file IDs, and named real customers, and CI fails if any
appear. `test/pii-scan-mutation.test.ts` proves that scan can actually fail.

## Development

```bash
bun install
bun test
```

Two suites run: a portable one with no external dependency, and rungate's conformity
checks for repo structure and spec drift.
