---
doc-type: adr
status: accepted
created: 2026-11-03
owner: jason
supersedes: "PROJECT-STATE decision: No degraded mode when the dashboard is down"
updated: 2026-11-03
---

# ADR-001 — Standalone mode: a POV without the dashboard

## Context

The plugin refuses to run when no dashboard answers. The recorded reason was
that a POV built from public research alone is the generic outreach the spec
exists to prevent. That reason is still true. What changed is the audience:
colleagues who do not run the dashboard, and people outside the team who have
their own account notes, want the methodology and the one-page template.

Two things the dashboard does today have no stand-in without it:

1. **Account intelligence** — signals, contacts, AE voice, grounded research.
2. **The grader** — `POST /pov/score`, a deterministic instrument separate
   from the model that wrote the POV. The skill is forbidden to grade itself.

## Decision

Add a second path, **standalone mode**, chosen only when discovery finds no
dashboard *and* the user supplies their own material. Dashboard mode is
unchanged and still preferred when one answers.

### Inputs: the user's material is required, research supplements it

- The user must supply account material: notes, a brief, a deck, call notes,
  an account plan. A file path or pasted text.
- Web research may add to it (public initiatives, leadership statements,
  filings) and every researched claim carries its source URL.
- **Public research alone is a refusal**, with a message saying what to supply.
  This keeps the original reason for "no degraded mode" intact: the thing it
  prevented is still prevented.

### Grading: two instruments, neither of them the writer

| Kind of criterion | Checked by | How |
|---|---|---|
| MACHINE (word counts, reading grade, one page, banned characters, required sections) | shell commands written out in SKILL.md, run by the session | arithmetic on the artifact; same answer every run |
| JUDGMENT (distinct POV, convergence holds, forward-worthy) | a **separate reviewer agent** spawned with only the artifact, the spec and the user's material, never the writer's reasoning | verdict per criterion, recorded verbatim |

The reviewer is a model, so it is a weaker instrument than the dashboard's
deterministic scorer. That is accepted and said out loud: a standalone score
is **not comparable** to a dashboard score and is labelled as such on output.

### Packaging: still markdown only

No hook, no `.mcp.json`, no `bin/`, no shipped script. MACHINE checks are
commands the skill tells the session to run, visible in the skill text, so
`.claude/rules/no-executable-surface.md` holds unchanged. PDF rendering already
works this way (headless Chrome, step 6).

### Publishing

No Drive publish in standalone mode. Output is local files: the PDF, the HTML,
the emails, and a score report. Publishing needs credentials the dashboard holds.

## Consequences

- The spec copied from DailyBriefDashboard stays canonical for *what a POV
  must contain*. Standalone behaviour is governed by a plugin-owned spec,
  `specs/STANDALONE-SPEC.md`, because the derived copy cannot be edited here.
- Some dashboard-scored criteria have no standalone instrument (for example,
  the peer-reference registry check). Those report **UNMEASURED**, never pass.
- The README's install story changes: "needs the dashboard" becomes "works
  best with the dashboard; works without it if you bring your own notes."

## Rejected

- **Ship a grader script.** Closest to the dashboard's scorer, but it breaks the
  read-before-you-install promise that is this plugin's whole security story.
- **Ungraded draft.** Leaves colleagues with no signal at all on the criteria
  that are pure arithmetic.
- **Allow research-only POVs.** Reintroduces the generic outreach the spec exists
  to prevent.
