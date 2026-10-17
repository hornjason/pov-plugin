---
doc-type: reference
status: active
owner: jason
updated: 2026-10-16
---

## The plugin ships zero executable surface

No hooks. No `.mcp.json`. No `bin/`. No `postinstall`. No install-time or
session-start script of any kind.

What this plugin ships is markdown: a skill, the spec it reads, two reference
files, and a fictional example. A colleague can read all of it in ten minutes
before deciding to install it.

## Why

Installing a Claude Code plugin from a marketplace grants it whatever the
plugin declares. A plugin with a hook runs code on someone else's machine
every session; a plugin with `.mcp.json` adds a server to their tool surface.
Both are reasonable things to ship and neither is what this is.

The distinction is not "safer" in the abstract — it is the difference between
something a colleague can **audit** before trusting and something they have to
**trust** before auditing. For a plugin distributed person-to-person rather
than through a reviewed registry, that difference is the whole security story,
and the README makes the claim out loud.

`test/pov-plugin.test.ts` enforces it rather than leaving it to review: the
no-exec-surface case fails if any of those paths appears.

## If one becomes genuinely necessary

Say so in the PR, explain what it does and why markdown could not, and update
the README's claim in the same change. A claim in a README that the tree has
quietly outgrown is worse than never having made it — the reader who checked
once has no reason to check again.
