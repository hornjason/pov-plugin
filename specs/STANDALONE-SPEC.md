---
doc-type: spec
status: active
owner: jason
created: 2026-11-03
updated: 2026-11-03
governs: Standalone mode — generating, checking and rendering a POV when no dashboard is available (ADR-001)
testable: true
---

# Standalone Mode Spec

What a POV run must do when no dashboard answers. *What a POV must contain*
is still governed by `specs/POV-SPEC.md`; this spec governs only the path
that replaces the dashboard. Decision record: `docs/adr/ADR-001-standalone-mode.md`.

## Mode selection (SC-S1 to SC-S3)

- [ ] SC-S1: When a dashboard answers discovery, the skill uses dashboard mode. Standalone mode is never chosen while a capable dashboard is reachable.
- [ ] SC-S2: When no dashboard answers and the user has supplied no account material, the skill refuses and the refusal names what to supply (notes, brief, deck or account plan, as a path or pasted text).
- [ ] SC-S3: The selected mode is stated in the first line of the run's output and in the score report.

## Inputs (SC-S4 to SC-S6)

- [ ] SC-S4: Public web research alone never produces a POV. A run whose only material is researched is a refusal (SC-S2).
- [ ] SC-S5: Every claim taken from web research carries its source URL in the score report.
- [ ] SC-S6: Every claim in the one-pager traces to either the user's material or a cited research source. An untraceable claim is a JUDGMENT finding, not a silent pass.

## Checking (SC-S7 to SC-S11)

- [ ] SC-S7: Every MACHINE criterion of POV-SPEC that can be computed from the artifact is checked by a command written out in SKILL.md, and the command's output is what the report records.
- [ ] SC-S8: JUDGMENT criteria are scored by a separate reviewer agent whose input is the artifact, the spec and the user's material — never the writer's notes, drafts or reasoning.
- [ ] SC-S9: The writer never scores its own output. No step reads the spec in order to grade.
- [ ] SC-S10: A criterion with no standalone instrument is reported UNMEASURED by id. UNMEASURED is never counted as a pass.
- [ ] SC-S11: The score report states that a standalone score is not comparable to a dashboard score.

## Output (SC-S12 to SC-S14)

- [ ] SC-S12: The one-pager is rendered from the shipped template (or its documented overrides) to a PDF of exactly one page.
- [ ] SC-S13: Standalone mode writes local files only — PDF, HTML, emails, score report — and never calls a publish endpoint.
- [ ] SC-S14: A copy edit after scoring sends the artifact back through checking; the reported score describes the file delivered.

## Packaging (SC-S15)

- [ ] SC-S15: Standalone mode adds no hook, `.mcp.json`, `bin/` or shipped script. `test/pov-plugin.test.ts`'s no-exec-surface case still passes unchanged.
