---
name: pov
description: Generate an unsolicited customer POV — a one-page visual document plus the outreach email that carries it. Pulls account intelligence from a locally running dashboard, builds a convergence thesis connecting 2-3 customer initiatives, and publishes the artifacts back to the customer's Drive folder. USE WHEN run a POV, create a POV, build a POV for, POV one-pager, convergence thesis, unsolicited POV, outreach one-pager, customer POV, write a POV email.
doc-type: reference
status: active
owner: jason
updated: 2026-10-15
---

# POV Generator

Produce a research-backed POV package for one customer: a one-page PDF and a short
outreach email per persona.

**Read `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md` first.** It holds the 40 design rules
and the 40 success criteria this skill is graded against. Do not generate from memory of
the rules — read them, then generate.

## Invocation

The user says something like "run a POV for Northwind Logistics". The customer name is
the only required input.

## Steps

### 1. Find the dashboard, or refuse

**If `POV_DASHBOARD_URL` is set, use it and probe nothing else.** An explicit
answer is not a hint to be second-guessed. If it does not answer, that is a
refusal — do not fall back to a search.

Otherwise discover it. Probe **one port at a time**, and for each port try the
host aliases in order, stopping at the first that answers:

| Order | Port | What it is | Host aliases, in order |
|---|---|---|---|
| 1 | `7777` | the dashboard | `localhost`, `127.0.0.1`, `host.docker.internal` |
| 2 | `7776` | the **test** dashboard | `localhost`, `127.0.0.1`, `host.docker.internal` |

Probe with `GET {base}/api/accounts` and a short timeout (2s is plenty for a
local service).

`host.docker.internal` is there because `localhost` inside a container is the
container, not the machine the dashboard runs on. On a normal macOS or Linux
host it simply fails to resolve, which costs one failed probe.

**Stopping at the first alias that answers is the whole point of the
per-port loop.** `localhost:7777` and `127.0.0.1:7777` are the same dashboard
reached two ways. Collecting both and then asking the user to choose
manufactures an ambiguity that is not real, and a prompt that is wrong half
the time is one the user learns to dismiss — which is how they will dismiss
the prompt below that matters.

Then, on the number of distinct dashboards found:

**None.** Stop. Name **every** URL you tried, one per line, and print:

```
Start the dashboard, then run this again.
```

Do not fall back to web research alone and present the result as a normal POV.
The account intelligence is what makes it credible, and a POV built without it
is the generic outreach rule 11 warns against.

**Exactly one.** Use it. Say which one, including the port, before continuing.

**More than one.** **Stop and ask which.** List them with what each appears to
be — note explicitly that `7776` is the test dashboard. Do not pick. Do not
pick the lower-numbered port, the first to respond, or the non-test one.

This refusal is the one in this skill most likely to be quietly dropped as an
annoyance, so here is what it costs to drop it: on a development machine both
dashboards answer `/api/accounts` with `200`, test data looks exactly like
real data to anything reading the response, and step 9 **publishes to the
customer's real Drive folder**. Guessing wrong does not produce a visible
error. It produces a plausible document, in the right place, built from
fixtures, with a share link somebody sends to a customer.

### 2. Pull account intelligence

See `${CLAUDE_PLUGIN_ROOT}/skills/pov/references/dashboard-api.md` for the endpoints and
their shapes. Gather, in parallel where possible:

- the customer brief
- contacts, to pick target personas
- intelligence: news, events, roadmap
- existing footprint and expansion opportunities

Record which of these returned nothing. Gaps change what you can claim.

### 3. Research the public signal

The dashboard gives you the internal picture. The opener needs an **externally
observable** signal (rule 6) — a funding round, an executive hire, a public migration
talk, a regulatory deadline. Search for it. If you cannot find one, say so rather than
inventing a hook.

### 4. Build the convergence thesis

This is the centerpiece and the hardest part. Find 2-3 initiatives the customer is
treating as separate conversations and argue they are one. Name them by their internal
program names. If you cannot find a genuine connection, say so — a forced convergence
thesis reads worse than none.

### 5. Pick peer references

One named company and one concrete metric per persona, from the registry in the spec.
**Different reference for each persona** at the same account. Verify the URL resolves.

### 6. Generate the one-pager

**Start from the shipped template. Do not compose the HTML from the rules.**

Read `${CLAUDE_PLUGIN_ROOT}/templates/one-pager.html.tmpl`, or the file named
by `POV_TEMPLATE_PATH` if that is set, and fill in every `{{PLACEHOLDER}}`.

Change the copy. Do not change the CSS, the section order, or the markup. The
type scale, the colour, the callout treatment and the bridge diagram are the
reason two POVs for two customers look like one product, and they are the
first thing to drift if each run rebuilds the page from rules 16-34. Both
documents can honour every rule and still share no visual DNA — that is the
failure claim 3 names, and the template is the whole defence against it.

If a placeholder has no good answer, that is a finding about the POV, not a
licence to delete the section. Say so in the output.

Follow rules 16-34 for the CONTENT that goes in the placeholders: narrative
arc, bold inline terms, one idea in the convergence callout, one honest
trade-off, no date stamp. Render HTML, then PDF.

Check it is one page. If it bleeds, tighten the copy — do not shrink the font
and do not edit the stylesheet.

### 7. Generate the emails

Short (75-125 words) and long (under 200) per persona. Follow rules 1-15.

### 8. Self-review before publishing

Work through `${CLAUDE_PLUGIN_ROOT}/skills/pov/references/humanization.md` line by line,
then the quality gates in the spec (rules 35-40). Fix what fails. Report what you fixed.

This step is not optional and it is not a formality. Report the result honestly — if a
gate fails and you could not fix it, say which one.

### 9. Publish

Push the artifacts back through the dashboard's campaign endpoints so they land in the
customer's Drive folder. **Update in place** if an artifact already exists; never delete
and recreate.

## Output

Report: artifacts produced and where they landed, which personas got which peer
reference, which quality gates passed, and every intelligence gap you hit. The gaps
matter as much as the output — they tell the AE what to verify before sending.

## What not to do

- Do not invent customer initiatives, metrics, or quotes. Unverified specifics are worse
  than vagueness here, because the recipient knows their own business.
- Do not reference anything from internal systems — ticket counts, subscription numbers,
  pipeline values (rule 36).
- Do not send anything. This skill produces drafts for a human to review and send.
