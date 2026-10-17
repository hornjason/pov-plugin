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
| PROJECT-STATE.md | Live status + handoff (generated from project-state.json — don't edit directly) | Session start, always first after AGENTS.md |
| project-state.json | Source of truth for project status | When editing state |
| package.json | Dependencies and scripts | Adding deps or scripts |
| tsconfig.json | TypeScript configuration | Changing TS settings |
| specs/POV-SPEC.md | The methodology — 40 rules, 40 SCs. Single copy; the skill reads it at `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md` | Changing what a POV must contain |
| skills/pov/SKILL.md | The skill body — 9 steps, stops loudly if the dashboard is unreachable | Changing how a POV gets generated |
| .claude-plugin/marketplace.json | Makes this repo installable with `claude plugin marketplace add` | Changing how it is distributed |

Hand-edited (#370 preserves this). Two rows the scaffold wrote were removed
rather than corrected: `.claude/rungate.json` is harness config this project
scaffolds with `--profile=minimal` and therefore does not have, and
`CODE-MAP.md` is generated only for `--type code`. A key-files table that
points at files which do not exist teaches a reader to stop trusting it.
