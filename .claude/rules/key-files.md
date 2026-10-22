---
description: Key files and documentation routing for this project
generated-sha: 1d31019040a8130d
doc-type: reference
status: active
owner: jason
updated: 2026-10-16
---

## Key Files

| File | What | When to Read |
|------|------|--------------|
| AGENTS.md | Project entry point | Always first |
| PROJECT-STATE.md | Live status + handoff. DA-owned (#296) — nothing in this project reads project-state.json, so this file is maintained directly and regenerating it would destroy its contents | Session start, always first after AGENTS.md |
| project-state.json | Source of truth for project status | When editing state |
| package.json | Dependencies and scripts | Adding deps or scripts |
| tsconfig.json | TypeScript configuration | Changing TS settings |
| specs/POV-SPEC.md | The methodology — 41 rules, 43 SCs. Single copy; the skill reads it at `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md` | Changing what a POV must contain |
| skills/pov/SKILL.md | The skill body — drives the dashboard POV API and renders the result | Changing how a POV gets generated |
| .claude-plugin/marketplace.json | Makes this repo installable with `claude plugin marketplace add` | Changing how it is distributed |
| CODE-MAP.md | Generated architecture snapshot. Thin here — this tree is markdown and a template | Orientation only; see the note below |

Hand-edited (#370 preserves this). One row the scaffold wrote was removed
rather than corrected: `.claude/rungate.json` is harness config this project
scaffolds with `--profile=minimal` and therefore does not have. A key-files
table that points at files which do not exist teaches a reader to stop
trusting it.

A second row was removed on the same grounds and is **restored**, because the
grounds turned out to be wrong: the note said `CODE-MAP.md` is generated only
for `--type code`, and the 0.8.1 scaffold generated one here. It is thin —
0 dependencies, 0 routes, 0 components, and four UNMEASURED rows for a tree
that is markdown and a template — but `.claude/rules/docs-routing.md` routes
`Codebase structure` to it, so deleting the file would leave a generated table
pointing at nothing, which is the failure this paragraph exists to prevent.

The PROJECT-STATE row was hand-corrected on the rungate 0.5.0 → 0.8.1 upgrade,
and the correction is the one case where #370's preservation works against the
project. Under 0.5.0 that row was an unconditional literal — *"generated from
project-state.json — don't edit directly"* — emitted to every consumer whether
or not it was true. **It is false here.** Measured: nothing in this repository
reads `project-state.json` (`projectStateDerivation` returns `NO_GENERATOR`
over 2 files, 8,785 bytes, so a reading and not a silent default). There is no
generator, `PROJECT-STATE.md` is the only copy of the session bridge, and a row
telling the next session not to edit it directly is a row that lets the bridge
go stale.

rungate #781 made that row conditional, so 0.8.1 would emit the correct text —
but `key-files.md` is preserved here and the scaffold therefore skips it. The
text above is `projectStateKeyFileNote()`'s own output for this tree, copied
verbatim rather than paraphrased, so a later unpreserved regeneration writes
the same sentence instead of a competing one.
