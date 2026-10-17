---
doc-type: reference
status: active
owner: jason
updated: 2026-10-16
---

# What this is, and what would prove it works

## The one sentence

A colleague who has never seen this repo installs it with one command, says
*"run a POV for Acme"*, and gets back a one-pager and outreach emails that look
like the ones Jason has been producing by hand — published to Acme's Drive
folder — without configuring a credential, reading the source, or asking Jason
anything.

Everything below is in service of that sentence. Anything that does not move one
of the five claims is cleanup, and should say so rather than borrowing urgency.

## What this is not

Naming the boundaries, because each one was a real decision and a later reader
will otherwise relitigate them:

- **Not a general-purpose POV generator.** It is bound to the DailyBrief
  dashboard, deliberately. The dashboard holds the account intelligence and the
  Google credentials; without it there is no POV worth sending.
- **Not Sapling-dependent.** Sapling shaped the humanization checklist during
  development. It is not a runtime dependency and must never become one.
- **Not a ship-harness project.** It takes rungate's AI-friendly repo structure
  (`--profile=minimal`) and none of the ship pipeline.
- **Not a sender.** It produces drafts for a human to review and send.

---

## The five claims

Each is written so it can be **false**. A claim nothing can falsify is a slogan.

### Claim 1 — A stranger can install it

One command, on a machine that has never seen this repo, with no account on
anything, no credential configured, and no help from Jason.

```
claude plugin install pov --marketplace hornjason/pov-plugin
```

**How it fails:** the command errors; or it succeeds and the skill does not
appear; or it appears and the first run demands a credential, an API key, an
MCP server, or a file the colleague does not have.

**How to measure it:** a cold install in a sandbox, performed by someone
following only the README. Not a description of the steps — the steps, run.

### Claim 2 — It runs end to end against a real dashboard

Discovers the dashboard, resolves the customer, pulls the intelligence, builds
the artifacts, and publishes them to that customer's Drive folder.

**How it fails:** it cannot find a dashboard that is running; it finds the wrong
one of several; it silently skips an intelligence source and produces a POV that
looks complete; it writes to the wrong Drive folder; it deletes and recreates an
artifact instead of updating in place, breaking existing share links.

**How to measure it:** run it against the live dashboard and check the Drive
folder, the share links, and which endpoints actually returned data.

**Known unresolved:** the spec says the one-pager is a *"PDF rendered from
HTML"* and nothing in the plugin names a tool that renders PDFs, while the
dashboard's publish path tracks a doc and an HTML and no PDF. Either the spec is
describing an artifact the pipeline does not produce, or the rendering lives
somewhere not yet found. The first end-to-end run settles it.

### Claim 3 — Two POVs for two customers look like the same product

This is the claim the repo is currently furthest from, and the one most likely
to be declared true without evidence.

Consistency is not "both satisfy rule 24." Two documents can each honour
*"whitespace is functional"* and share no visual DNA. The output has to come
from a **template that ships in the repo**, not from the model's taste on the
day.

**How it fails:** generate a POV for two different customers and put the
one-pagers side by side. Different type scale, different colour, different
section order, different diagram treatment — any of those means the template is
decorative and the rules are doing the work alone.

**How to measure it:** two renders, compared against the template and against
each other. A human looks at them. There is no automated substitute for this one
yet, and pretending otherwise would be the vacuous-check failure this project's
own rules open with.

**Also required:** a config override. Someone who wants a different look should
point at their own template rather than fork the spec.

### Claim 4 — It refuses honestly

The failure modes are more common than the success path, and a confident wrong
answer is worse here than no answer — the recipient is a real customer.

Four refusals that must each be distinguishable:

| Situation | Required behaviour |
|---|---|
| No dashboard running | Stop. Say which URLs were tried and print the command to start it. |
| Several dashboards running | Ask which. Never guess between production and test. |
| No genuine convergence thesis | Say so. A forced thesis reads worse than none. |
| An intelligence source returned nothing | Report the gap in the output. |

**How it fails:** any of these produces a plausible-looking POV instead of a
refusal. The second row is the dangerous one — on the development machine both
`pai-dashboard` (7777) and `pai-dashboard-test` (7776) answer the health check
with 200, so a port probe picks test data and publishes it to a real customer's
folder with no warning.

**How to measure it:** stop the dashboard and run it. Start two and run it.
Ask for a customer with thin intelligence and read what it admits to.

### Claim 5 — Nothing private is in the public repo

The repo is public and installed by other people. It carries a methodology
developed against real accounts, so every file in it started life next to data
that must not ship.

**How it fails:** a real company name, a personal or corporate email, a LinkedIn
URL, a Drive or Docs id, an internal issue reference, or an account list — in
any tracked file. Including in the gate's own patterns: a regex enumerating five
customers publishes those five customers.

**How to measure it:** `piiViolations()` runs on every commit and in CI, and
`test/pii-scan-mutation.test.ts` proves it can fail by planting each pattern.
Plus one human read of the published tree, because a gate only catches what
someone thought to write a pattern for.

**True as of 2026-10-16.** The patterns are split by what the repo can see.

*Structural* patterns describe a shape and name nobody — an email address at
any domain not reserved by RFC 2606, a LinkedIn profile URL, a Drive or Docs
id. They are tracked and they run everywhere, and they are **wider** than what
they replaced: the old rule enumerated five email domains and was silent on the
sixth.

*Identity* patterns are the names themselves. They live in
`.pii-identities.local.json`, which is gitignored and never committed. Its
absence is a **refusal**, not a skip — a scan that did not look reports the
same empty list as a repo with nothing to find.

The scan reads `git ls-files` rather than walking the filesystem, because the
tracked set is exactly what a clone receives, and a walk would open the
untracked identity list and report the gate's own patterns as a leak.

Three real findings came out of the rewrite, none of which the old gate could
see: two internal issue references in CI comments and `PROJECT-STATE.md`, and
a font-family and accent palette in the worked example lifted from a real
company's brand.

**Measured, not asserted.** Six mutations, every count predicted before the
run and every one matched:

| Mutation | Red of 38 |
|---|---|
| `piiViolations` short-circuited to `return []` | 11 |
| the absent-list branch returns an empty present list | 2 |
| `repoFiles` stops reading the tracked set and walks | 3 |
| `identityRefusal` short-circuited to `return null` | 1 |
| the named-customer pattern removed | 3 |
| the email pattern removed | 3 |

The battery also corrected itself twice, which is the part worth keeping. A
seventh row came back one lower than predicted and exposed a case asserting
only `length > 0` — a word-boundary match on an identity name fires *inside*
an email address, so the row that looked like email coverage was the name
pattern all along. Each case now asserts which pattern fired. And the gate
caught its own documentation: a comment written during the rewrite contained a
sample address, which the scan found because this file is no longer exempt
from it.

---

## Where we actually stand

Measured 2026-10-16. Update this section whenever a claim moves.

| Claim | Standing | What is in the way |
|---|---|---|
| 1 — a stranger can install it | **untested** | Never pushed; no cold install has been run |
| 2 — end to end against a dashboard | **untested** | Port documented as 3000; it is 7777 |
| 3 — consistent look and feel | **false** | No template ships. 1,317 lines of real design work sit unported in `~/Projects/POV/reference/` |
| 4 — refuses honestly | **partly true** | The no-dashboard refusal is specified and good. Multiple-dashboard disambiguation does not exist |
| 5 — nothing private ships | **true (tree)** | Git history still predates the split; squash before the first push |

Three of five are false or untested, and the repo has never been pushed. That is
the honest reading, and it is why the cold install is the next milestone rather
than the last step.

**On claim 5's qualifier.** The working tree is clean and the gate proves it.
The *clone* is not: the three commits behind this one carry the old gate, and
`git log -p` is what a reader actually gets. A tree-scanning gate cannot see
that, and nothing about a green suite would tell you. The repo has never been
pushed, so the fix is free — squash to a single initial commit before creating
the remote — but it has to happen before the push and not after, because a
public commit is public the moment it lands.

## The order the claims have to be earned in

5 before anything is public. Then 1, because it is the cheapest to run and
everything else depends on the install working. Then 2, which is also what
settles the PDF question. Then 4, which needs 2 working in order to break it on
purpose. Then 3, which is the most work and the least automatable.
