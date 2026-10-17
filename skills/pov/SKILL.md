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

**Read `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md` first.** It holds the 41 design rules
and the 43 success criteria this skill is graded against. Do not generate from memory of
the rules — read them, then grade against them.

## What this skill does, and what the dashboard does

The dashboard generates the POV. This skill **drives it and renders the result.**

That division is not an arrangement of convenience — it is where the capability
already sits. `POST /api/customer/:name/pov/generate` grounds research against
the point of view being argued, applies the owning AE's voice profile, runs an
AI-detection gate over every email, and publishes to the customer's Drive
folder. Reimplementing any of that here would produce a second, worse copy that
drifts.

What the dashboard does **not** do is make it look like anything. Its one-pager
comes back as four markdown headings. The visual layer — the template, the HTML,
the PDF — is this plugin's job, and it is the whole of claim 3.

| Concern | Owner |
|---|---|
| Account intelligence, signals, research grounding | dashboard |
| AE voice profile, AI-detection gate | dashboard |
| One-pager copy and per-persona emails | dashboard |
| Publishing to Drive | dashboard |
| **Template, HTML, PDF, one-page fit** | **this plugin** |

## Invocation

The user says something like "run a POV for Northwind Logistics".

The customer name is the only required input **from the user**. The point of
view itself is required by the API, so if the user has not said what they want
to argue, ask — see step 3.

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

### 2. Confirm the dashboard can generate

Reachable is not the same as capable. Probe the generation endpoint itself:

```
POST {base}/api/customer/{name}/pov/generate   with an empty JSON body
```

Read the status code, and **decide on the endpoint's answer rather than on a
version number**:

| Response | Meaning | What to do |
|---|---|---|
| `400` `{"error":"intent is required"}` | capable | continue |
| `404`, plain-text body | the dashboard predates the POV API | **refuse** |
| anything else | unknown | refuse, and print the status and body |

**The empty body is what makes this unambiguous, and it is not an
accident of convenience.** Measured against a live dashboard:

| Probe | Response |
|---|---|
| empty body, customer that does not exist | `400 {"error":"intent is required"}` |
| with an intent, customer that does not exist | `400 {"error":"Unknown customer name"}` |
| route that is not registered | `404 Not Found`, plain text |

The route validates `intent` **before** it looks the customer up, so an empty
body reaches the capability answer without the customer name mattering at all.
A missing customer is a `400` on this API and never a `404`, so the two cannot
be confused — and on a freshly installed dashboard with nothing seeded yet,
the probe still correctly reports capable.

The `404` refusal:

```
This dashboard is running but has no POV API.
Upgrade the dashboard, then run this again.
```

**Why a probe and not a version check.** A version string is a label about the
thing; the endpoint is the thing. A dashboard built from main carries the API
and has no release to point at, so a `>= X` comparison would refuse the one
machine that definitely works. The converse holds too — a future release could
ship the route disabled. Only the endpoint knows.

The empty body is deliberate: the route validates before it does anything, so
this costs nothing and generates nothing.

### 3. Generate

One call does the work. Build the request body:

| Field | Required | What goes in it |
|---|---|---|
| `intent` | **yes** | the point of view being argued, in the user's own words |
| `sourceUrls` | no | up to 10 links to material the user supplied |
| `personas` | no | `{name?, role}` per target; omit to let the dashboard pick |
| `publish` | **send it** | `false` for a review run |

```
POST {base}/api/customer/{name}/pov/generate
{"intent": "...", "sourceUrls": [...], "personas": [...], "publish": false}
```

**`intent` is required and the request fails without it.** If the user said
only "run a POV for Acme", they have not given you one. Ask what they want to
argue — a single sentence is enough. Do not infer a thesis and proceed; an
invented point of view is the forced convergence rule 31 warns against, and
the user is the one holding the context that makes it real.

**`sourceUrls` is how the user brings their own evidence** — a deck, a call
summary, a press release, an architecture doc. The dashboard fetches and
grounds against them. Mention this if the user seems to be working from
something you cannot see.

**`publish` must be sent explicitly, and this is the dangerous one.** The route
reads `body.publish !== false`, so **omitting the field publishes.** A run
meant for review writes to a real customer's Drive folder, in the right place,
with a share link — and nothing about it looks like an error. Send
`"publish": false` unless the user has asked for it to be published in this
run.

The response carries the one-pager sections and the per-persona emails. The
dashboard has already applied the AE voice profile (rule 10b, SC-43) and run
its AI-detection gate; read what it reports rather than re-running either.

Record which intelligence sources returned nothing. Gaps change what you can
claim, and rule 29 wants one stated plainly.

### 3b. Check the thesis and the references the dashboard came back with

The dashboard argues the convergence; you grade it. Two things to read before
rendering anything, because both are cheaper to fix now than after a PDF
exists:

- **The convergence thesis (rules 19, 31, 34).** Does it connect 2-3
  initiatives the customer treats as separate conversations, named by their
  internal program names? If it has produced a theme rather than a thesis, or
  named nothing, say so. A forced convergence reads worse than none.
- **Peer references (rule 9).** One named company and one concrete metric per
  persona, different per persona at the same account, from the registry in the
  spec. Verify each URL still resolves — these rot.

### 4. Render

**Start from the shipped template. Do not compose the HTML from the rules.**

The dashboard returns the one-pager as four markdown sections — Environment,
Insight, Convergence, Path Forward. It has no opinion about how they look.
Turning those into the document is this step, and it is the whole of claim 3.

Read the template, in this order of precedence:

| Order | Source | When |
|---|---|---|
| 1 | `POV_TEMPLATE_PATH` | an explicit answer, never second-guessed |
| 2 | `.pov/template.html.tmpl` in the working directory | a per-project look |
| 3 | `${CLAUDE_PLUGIN_ROOT}/templates/one-pager.html.tmpl` | the shipped default |

Fill in every `{{PLACEHOLDER}}`.

Change the copy. **Do not change the CSS, the section order, or the markup.**
The type scale, the colour, the callout treatment and the bridge diagram are
the reason two POVs for two customers look like one product, and they are the
first thing to drift if each run styles the page to taste. Two documents can
honour every rule in the spec and share no visual DNA — that is the failure
claim 3 names, and the template is the whole defence against it.

If a placeholder has no good answer, that is a finding about the POV, not a
licence to delete the section. Say so in the output.

Check it is one page. If it bleeds, tighten the copy — do not shrink the font
and do not edit the stylesheet.

**Changing the look by showing it an example.** If the user supplies a document
or slide and says "make it look like this", do not hand-edit the shipped
template — derive a new one and write it to `.pov/template.html.tmpl`, so the
change is a file they keep, can read, can diff and can delete. Tell them where
you put it. A look that lives only in one conversation is a look that is gone
next week, which is the failure claim 3 describes from the other direction.

Then render:

```
chrome --headless --disable-gpu --print-to-pdf=<out.pdf> --no-pdf-header-footer <in.html>
```

Headless Chrome is what produced the validated one-pagers. The spec calls the
artifact "a PDF rendered from HTML" and for a long time nothing here named a
tool that renders one — an instruction nobody can follow is not an
instruction.

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

### 5. Self-review before publishing

Work through `${CLAUDE_PLUGIN_ROOT}/skills/pov/references/humanization.md` line by line,
then the quality gates in the spec (rules 35-40). Fix what fails. Report what you fixed.

This step is not optional and it is not a formality. Report the result honestly — if a
gate fails and you could not fix it, say which one.

**The creepy-line check is not a judgement call (rule 36, SC-36).** Internal
systems data must not reach the output, and one source of it is known and
mechanical: the dashboard's recommendation headlines are built as
`Case <number>: <summary>`, so a support **case** number can travel into
anything derived from them. Strip every one. Search the drafts for `Case`
followed by digits before you call this step done.

This strip is a **backstop, not the fix** — it belongs upstream at the
template boundary, where every consumer of that endpoint inherits it rather
than each one having to know to look. It is tracked there. Keep it here
anyway: rule 36 is a hard refusal for this skill whatever upstream does.

Also check what the dashboard already measured rather than redoing it. Its
AI-detection gate has a threshold and reports a score per email; read the
score. A gate that ran and passed is evidence, and re-running it here would
be a second opinion nobody asked for.

### 6. Publish

Only when the user has asked for it in this run. Re-issue the step 3 call with
`"publish": true` — the dashboard owns the Drive path, resolves the customer's
folder and **updates in place** rather than deleting and recreating, which is
what keeps existing share links alive.

Do not reach for the Drive API directly. The dashboard holds the credentials
and the folder resolution, and a second writer is how two copies of an
artifact start existing.

The PDF you rendered in step 4 is the artifact to publish, not the markdown
the dashboard returned.

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
