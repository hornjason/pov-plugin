---
doc-type: reference
status: active
owner: jason
updated: 2026-10-19
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

Discovers the dashboard, resolves the customer, pulls grounded context,
**writes the one-pager and the emails itself**, scores the draft against the
dashboard's conformance gate, revises until it passes, renders the artifacts,
and publishes them to that customer's Drive folder.

**Rewritten twice, and the second rewrite is the one that matters.**

The 2026-10-17 version said the plugin *"drives the dashboard's POV API"* —
one call to `pov/generate` that researched, wrote, gated and published, with
the plugin reduced to a visual layer over four markdown headings. That was a
correction of an earlier version in which the plugin assembled a POV out of 11
raw intelligence endpoints and none of the ones that mattered.

**ADR-051 (2026-10-19) replaced it again, and the reason is the claim's own
first sentence.** A colleague installs this *as a Claude Code plugin*. If the
dashboard does the writing, every consumer of the plugin is a caller of one
person's GCP project — for the one task their host already has a model for. A
plugin that needs its own model credential has misplaced a dependency it was
being handed for free.

So the split is **model-vs-deterministic**, not plugin-vs-dashboard:

| Concern | Runs where |
|---|---|
| Account intelligence, contacts, AE voice profile | dashboard, `POST /pov/context` |
| Grounded public web research | dashboard — it holds the search credential |
| **Writing the one-pager and the per-persona emails** | **the consumer's own Claude Code** |
| Conformance gate, AI-tell check, peer-citation check | dashboard, `POST /pov/score` |
| Template, HTML, PDF, one-page fit | the plugin |
| Publishing the finished artifact | dashboard, `POST /pov/publish` |

The gate deliberately does **not** move with the generation. A model grading
its own output against the rules it wrote from is one instrument twice; the
whole value of the gate is that it is a different one. It needs no credential,
so leaving it server-side costs the consumer nothing.

**How it fails:** it cannot find a dashboard that is running; it finds the
wrong one of several; it silently skips an intelligence source and produces a
POV that looks complete; it writes a draft the gate rejects and ships it
anyway; it trusts its own verdict instead of re-scoring at publish time; it
writes to the wrong Drive folder; it deletes and recreates an artifact instead
of updating in place, breaking existing share links.

**How to measure it:** run it against the live dashboard and check the Drive
folder, the share links, which context sources actually returned data, and
whether the published artifact's score matches the score the skill reported.

**Resolved 2026-10-17 — and not by a run.** The question was *"nothing in the
plugin names a tool that renders PDFs"*, and it was answered by reading the
working directory that produced the real POVs rather than by generating
another one: **headless Chrome**, `--print-to-pdf`. The plugin now names it.

Worth recording why it stayed open as long as it did. It was filed as a
question about the pipeline — *does the pipeline produce this artifact?* — when
it was a question about the instructions: the spec demanded a PDF and no
document said what makes one. An instruction nobody can follow looks exactly
like a capability nobody has, and the way to tell them apart was to go and
look at what had already been done, which cost one file read.

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

**The default was wrong until 2026-10-17, and nothing here could see it.** The
one POV that has been through the full loop uses `Red Hat Display` and
`#EE0000`. The shipped template used `Inter` and `#1f4e79`, because a PII
sweep read the typeface and palette as a brand lifted from a real company and
neutralised them. They are the **sender's** brand — the POV is from Red Hat,
the case-study registry is a list of Red Hat references, and the spec names
OpenShift three times.

Every check in `test/template.test.ts` stayed green through all of it, and for
an instructive reason: they compare **this repo to itself**. The template and
the worked example agreed byte for byte on a stylesheet neither Jason nor any
recipient has ever seen. An agreement check cannot tell a shared right answer
from a shared wrong one — the same shape as the three documents that agreed on
port 3000.

`TPL-4b` now pins the typeface and the accent to the validated artifact rather
than to the example beside it. Two things turn it red: neutralising the brand
again, and the house style genuinely changing. The second deserves a
deliberate edit, which is the point.

**Two renders exist as of 2026-10-19, and they are waiting on a human.**
Northwind Logistics and Meridian Health Systems, both written through the
ADR-051 flow — context pulled from a live dashboard, written in session,
scored at **90 / passed** with the peer citation clean and no AI tells, filled
into the shipped template without touching the CSS, and rendered with headless
Chrome. Both **one page**, both with a real text layer, PDFs at
`/tmp/pov-probe/renders/{northwind,meridian}.{html,pdf,png}`.

Structurally they are the same document: same type scale, same section order,
same red-bordered convergence callout, same three-panel bridge, same peer
table, same italic trade-off above the same ruled CTA. The template is doing
the work rather than the rules alone, which is the mechanism claim 3 is about.

**That is not the claim, and this section already says why.** *"A human looks
at them. There is no automated substitute for this one"* — so the claim stays
**evidence pending** until Jason has. Three things to look at, each a question
this file cannot answer for itself:

- **The brand is nearly absent.** The only red on the page is the convergence
  callout's border and tint. The bridge's middle panel — the one naming the
  product — renders **black**. On a POV from Red Hat that reads like a
  monochrome document with one accident of colour.
- **Both pages stop around 55% down.** One page is satisfied with room to
  spare. Rule 24 calls whitespace functional, and this much trailing space
  reads as a short document rather than a composed one.
- **The template has no stat tiles.** Decision 1 of the 2026-10-18 plan kept
  them, with attribution required, and the validated reference artifact
  carries three. The artifact JSON now has a `statTiles` field, the dashboard
  PDF renderer uses it, and **the shipped plugin template has nowhere to put
  it** — so the tiles are written and dropped. That is a divergence between
  the template and the spec, not a rendering bug, and which one moves is a
  design decision rather than a fix.

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

**Driven 2026-10-19 against a live dashboard built from merged main.** Six
refusals exercised, not four — the ADR-051 capability probe added one and the
contact registry turned out to carry two:

| Driven | What fired | Verdict |
|---|---|---|
| nothing on the port | connection refused, `exit 7` | unambiguous |
| two dashboards reachable | both `200`, **identical headers and response shape** | the worry is real |
| a port that answers but is not a dashboard | `3000/` is `200`, `3000/api/accounts` is `404` | the probe path saves it |
| a dashboard with no POV API | `404`, plain text, not JSON | distinguishable from every `400` |
| the capability probe, empty body | `400 {"error":"intent is required"}` | capable |
| the same probe, unknown customer | `400 {"error":"Unknown customer name"}` | and never a `404` |
| a customer with no registered contacts | `422 NO_CUSTOMER_CONTACTS` | names the remedy |
| contacts registered, no titles | `422 CONTACTS_HAVE_NO_TITLE`, naming the contact | a *different* remedy |

Two of those are worth more than a tick.

**The second row is the dangerous one and it is confirmed.** `7777` and `7776`
answer with byte-identical headers and the same response shape. The only
difference is the content, and "Acme Corp" is not self-evidently fixture data.
Nothing in the response tells them apart, which is exactly why the skill asks
rather than picks.

**The untitled-contacts refusal attempted a grounded resolution first**, logged
it, and reported `1 UNMEASURED of 1 untitled contact(s)` rather than inventing
a job title. Three states held all the way down.

### Claim 4's fourth row was false, and driving it is what found that

*"An intelligence source returned nothing → report the gap in the output."*
For the AE voice profile it did not. Measured:

```
loaded : ['signals', 'customer-data', 'research', 'case-studies']
missing: []
voiceContext: {"formality":"professional","wordBudget":{...},"assertionLevel":"collaborative"}
```

Byte-identical to `getVoiceTokens(null)` — every field a default. The source
returned nothing, the consumer received a complete plausible answer, and both
provenance lists stayed silent. Under ADR-051 the skill is told to write in
the AE's voice **and not a house style**, and it was handed a house style it
could not tell apart; SC-43 is *"voice profile applied"*, so the gate would
have certified it.

Filed as dashboard #1679, fixed, five mutation rows, re-measured live:
`missing: ['ae-voice']`, `voiceContext: ''`. The claim is true now because the
row was driven, which is the whole argument for driving them.

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

Measured 2026-10-16; claim 2's row revised 2026-10-19 for ADR-051. Update this
section whenever a claim moves.

| Claim | Standing | What is in the way |
|---|---|---|
| 1 — a stranger can install it | **true, measured** | Nothing. See the run below |
| 2 — end to end against a dashboard | **untested, but no longer blocked** | No POV has been generated *by the plugin*. All three endpoints now exist — `pov/context`, `pov/score` and `pov/publish`, the last merged 2026-10-19 — and the skill describes the ADR-051 path. What remains is one supervised run, because the last step writes to a real customer's Drive folder |
| 3 — consistent look and feel | **mechanism true, two renders waiting on a human** | Two POVs generated and rendered 2026-10-19, both one page, structurally identical. Jason has not looked at them yet, and the section says there is no substitute for that. Three things flagged for his eye, including a template that has nowhere to put the stat tiles the spec kept |
| 4 — refuses honestly | **eight refusals driven, one found false and fixed** | Driven against a live dashboard 2026-10-19. Seven fired correctly. The eighth — report the gap when a source returns nothing — did not, for the AE voice profile: filed as #1679, fixed, re-measured. Row 3 (no genuine convergence thesis) is still unexercised, because it needs an account where the initiatives genuinely do not converge |
| 5 — nothing private ships | **true, tree and history** | Nothing. 0 occurrences across the complete patch history |

Two of five are true. Claim 4 is close and claim 3 is one human review away,
and what moved them was driving them rather than reasoning about them.

**That is the finding worth keeping from 2026-10-19.** Claims 3 and 4 had
their mechanism built and their evidence outstanding, and the evidence is what
found the bugs. Driving claim 4's four refusals surfaced a fifth the plugin's
own skill had wrong, and a dashboard defect (#1679) in which an absent voice
profile was substituted with house defaults and reported as no gap. Driving
claim 3 — writing two real POVs and scoring them — surfaced a second
dashboard defect (#1682), where a one-pager the renderer refuses is reported
as `unmeasured` and the gate still answers `passed: true`.

Neither was findable by reading. Both were one command away from anyone who
ran the thing.

### Claim 1, measured 2026-10-17

Run, not described. Against an isolated `CLAUDE_CONFIG_DIR`, so this is a
cold machine's result rather than this machine's accumulated state:

```
git clone https://github.com/hornjason/pov-plugin.git   ->  15 entries
claude plugin marketplace add hornjason/pov-plugin      ->  OK pov-marketplace
claude plugin install pov@pov-marketplace               ->  OK enabled, v0.1.0
claude -p "list your skills"                            ->  pov:pov, ...
```

No credential, no API key, no MCP server, nothing asked for. The installed
tree carries no `hooks/`, no `.mcp.json` and no `bin/`, and its
`package.json` declares only `test` and `typecheck` — no lifecycle script of
any kind, so nothing in it runs at install time.

**One variable this run did not isolate.** `claude plugin marketplace add`
cloned over SSH, because this machine is configured for it. A colleague with
no GitHub SSH key takes the HTTPS path, which is a different code path and is
untested. That is the one thing standing between this measurement and the
claim's own words, *"no account on anything"*.

### Claim 5, and why the clone needed more than the tree

The working tree was clean once the gate was split, and the gate proved it.
The *clone* was not. Three commits carried the old pattern list, and the
commit that REMOVED the names reproduced every one of them in its own diff —
`git log -p` is what a reader actually gets, a tree-scanning gate cannot see
it, and a green suite says nothing about it.

The repo had never been pushed, so the fix was free: squashed to a single
root commit before the remote existed. Verified by walking every commit
reachable from `main` and grepping the complete patch history — 0
occurrences. The development history is kept locally at
`refs/archive/pre-sanitization-history`, which no ordinary push transfers.

### What is still in the way of claim 2, and why it was not simply run

The port was wrong and is fixed, and the correction is sharper than "3000
should have said 7777". Measured on the development machine:

| URL | Response |
|---|---|
| `localhost:7777/api/accounts` | `200`, `{customers: ...}` |
| `localhost:7776/api/accounts` | `200`, `{customers: ...}` |
| `localhost:3000/` | `200`, `X-Powered-By: Express` |

`3000` was never a dead port that would have failed loudly. **A different
application is listening there and answering**, so a probe asking only "did
something respond" would have connected to it and proceeded. And the two
dashboards return an identical response shape — claim 4's second row as a
measurement rather than a worry.

What remains is one full run, deliberately not done here: the last step
publishes to a real customer's Drive folder, which is not an action to take
unattended. It also settles the open PDF question.

## The order the claims have to be earned in

5 before anything is public. Then 1, because it is the cheapest to run and
everything else depends on the install working. Then 2, which is also what
settles the PDF question. Then 4, which needs 2 working in order to break it on
purpose. Then 3, which is the most work and the least automatable.
