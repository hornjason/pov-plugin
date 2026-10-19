---
name: pov
description: Generate an unsolicited customer POV — a one-page visual document plus the outreach email that carries it. Pulls account intelligence from a locally running dashboard, builds a convergence thesis connecting 2-3 customer initiatives, and publishes the artifacts back to the customer's Drive folder. USE WHEN run a POV, create a POV, build a POV for, POV one-pager, convergence thesis, unsolicited POV, outreach one-pager, customer POV, write a POV email.
doc-type: reference
status: active
owner: jason
updated: 2026-10-19
---

# POV Generator

Produce a research-backed POV package for one customer: a one-page PDF and a short
outreach email per persona.

**Read `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md` first.** It holds the 41 design rules
and the 43 success criteria this skill is graded against. Do not generate from memory of
the rules — read them, then grade against them.

## What this skill does, and what the dashboard does

**You write the POV.** The dashboard supplies the facts and grades the result.

The split is **model-vs-deterministic**, not plugin-vs-dashboard, and the
reason is the first sentence of this file's own install story. A colleague
installs this as a Claude Code plugin. If the dashboard did the writing, every
consumer would be a caller of one person's GCP project — for the one task
their host already supplies a model for. A Claude Code plugin that needs its
own model credential has misplaced a dependency it was being handed for free.

| Concern | Owner | Why it sits there |
|---|---|---|
| Account intelligence, signals, contacts, AE voice | dashboard | it holds the data |
| Grounded public web research | dashboard | it holds the search credential |
| **One-pager copy and per-persona emails** | **you, in this session** | the host is the model |
| Conformance gate, AI-tell check, peer-citation check | dashboard | deterministic, and a *different instrument* |
| **Template, HTML, PDF, one-page fit** | **this plugin** | the visual layer is claim 3 |
| Publishing to Drive | dashboard | it holds the credentials and the folder |

### The gate does not move with the generation, and this is the rule to get right

The tempting shape is: read `POV-SPEC.md`, write the POV, check your own work
against the same prose, report a score. **Do not do that.** A model grading
its own output against the rules it generated from is one instrument used
twice — it is not a check, it is the same judgement restated with more
confidence.

`POST /pov/score` is deterministic TypeScript carrying its own recorded
mutation evidence. It is a *different* instrument, it needs no credential, and
its verdict is the one you report — **verbatim, including `unmeasured`**.

Read the spec to WRITE well. Never to grade.

See `${CLAUDE_PLUGIN_ROOT}/../docs/adr/ADR-051` in the dashboard repo for the
full decision. It supersedes the earlier arrangement in which the dashboard
generated and this skill only rendered.

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

### 2. Confirm the dashboard has the three endpoints

Reachable is not the same as capable. Probe the context endpoint itself:

```
POST {base}/api/customer/{name}/pov/context   with an empty JSON body
```

Read the status code, and **decide on the endpoint's answer rather than on a
version number**:

| Response | Meaning | What to do |
|---|---|---|
| `400` `{"error":"intent is required"}` | capable | continue |
| `404`, plain-text body | the dashboard predates ADR-051 | **refuse** |
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

**Probe `/pov/context` and not `/pov/generate`.** A dashboard can carry the
old single-call API and none of the three this skill now needs — that is
exactly what every dashboard built before ADR-051 looks like. Probing the
endpoint you are not going to call answers a question nobody asked.

The `404` refusal:

```
This dashboard is running but has no POV context API.
Upgrade the dashboard, then run this again.
```

**Why a probe and not a version check.** A version string is a label about the
thing; the endpoint is the thing. A dashboard built from main carries the API
and has no release to point at, so a `>= X` comparison would refuse the one
machine that definitely works. The converse holds too — a future release could
ship the route disabled. Only the endpoint knows.

The empty body is deliberate: the route validates before it does anything, so
this costs nothing and generates nothing.

### 3. Pull the context

```
POST {base}/api/customer/{name}/pov/context
{"intent": "...", "sourceUrls": [...], "personas": [...]}
```

| Field | Required | What goes in it |
|---|---|---|
| `intent` | **yes** | the point of view being argued, in the user's own words |
| `sourceUrls` | no | up to 10 links to material the user supplied |
| `personas` | no | `{name?, role}` per target; omit to let the dashboard resolve them from the contact registry |

**`intent` is required and the request fails without it.** If the user said
only "run a POV for Acme", they have not given you one. Ask what they want to
argue — a single sentence is enough. Do not infer a thesis and proceed; an
invented point of view is the forced convergence rule 31 warns against, and
the user is the one holding the context that makes it real.

**`sourceUrls` is how the user brings their own evidence** — a deck, a call
summary, a press release, an architecture doc. The dashboard fetches and
grounds the research against them. Mention this if the user seems to be
working from something you cannot see.

**This call does the grounded web research**, so it is the slow one and it is
the only place a search credential is involved. You are not expected to
research the customer yourself, and you should not: anything you recall rather
than read is the invented specific rule 11 warns against.

The response:

| Field | What it is |
|---|---|
| `personas` | who to write to — name, role, trust |
| `signalContext`, `customerDataContext` | the account's own intelligence |
| `researchContext` | grounded public research, with citations |
| `teamContext` | the account team, for named participants |
| `voiceContext` | the owning AE's voice profile (rule 10b, SC-43) |
| `caseStudies`, `caseStudyContext` | the Verified Case Study Registry |
| `loaded`, `missing` | which sources answered and which did not |

**Read `missing` and carry it through to the output.** Gaps change what you can
claim, and rule 29 wants one stated plainly. A POV that reads complete over a
source that returned nothing is the failure this field exists to prevent.

#### Two refusals this call can return, and they are different

| Code | Means | Remedy |
|---|---|---|
| `422 NO_CUSTOMER_CONTACTS` | nobody is registered for this account | run contact discovery in the dashboard |
| `422 CONTACTS_HAVE_NO_TITLE` | contacts exist and their roles are unknown | the dashboard attempts one grounded resolution before raising this; if it still fails, the named contacts need titles |

Report whichever came back, by name. They are two codes because they have two
remedies, and collapsing them sends the user to the wrong one.

### 4. Write the POV

This is the step that used to be a server call. **You write it now**, from the
context above and the rules in `${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md`.

Produce a single JSON object — this exact shape, because it is what
`/pov/score` and `/pov/publish` read:

```json
{
  "onePager": {
    "title": "...", "subtitle": "...",
    "environment": "...", "insight": "...", "convergence": "...",
    "numbers": "markdown STRING, not an array",
    "statTiles": [{"value": "...", "label": "...", "attribution": "..."}],
    "tradeoff": "...", "diagram": {"from": "...", "to": "..."},
    "pathForward": [{"title": "...", "detail": "..."}]
  },
  "emails": [
    {"recipientName": "...", "role": "...", "subject": "...", "body": "..."}
  ]
}
```

**Three fields are easy to get wrong, and getting them wrong is quiet.**

| Field | Must be | Not |
|---|---|---|
| `numbers` | a markdown **string** | an array of tiles |
| `statTiles` | the tile array, `{value, label, attribution}` | folded into `numbers` |
| `pathForward` | `[{title, detail}]` | `[{step, detail}]` |

The first live run of this skill sent tiles as `numbers`. The dashboard's
renderer calls `numbers.trim()`, an array has no `trim`, and the resulting
`TypeError` is caught and turned into an empty one-pager — so every
one-pager criterion came back `unmeasured`, the email criteria carried the
score to **80 with `passed: true`**, and the document the customer would
receive was never graded at all. The gate said yes about a page it had not
read.

So: if `/pov/score` reports the one-pager as empty and you know you sent one,
**that is this bug and not an empty one-pager.** Check these three fields
before you change a word of the copy. Dashboard issue #1682 is open to make
that case a refusal rather than a silent `unmeasured`; until it lands, the
`unmeasured` is the only signal you get.

What to hold in mind while writing, each of them a criterion the gate will
check in a moment:

- **The convergence thesis (rules 19, 31, 34).** Connect 2-3 initiatives the
  customer treats as separate conversations, named by their internal program
  names from `signalContext`. A theme is not a thesis. A forced convergence
  reads worse than none — if the initiatives do not converge, say so to the
  user rather than inventing a bridge.
- **Peer references (rule 9).** One named company and one concrete metric per
  persona, **different per persona at the same account**, taken only from
  `caseStudies`. The company name must be the anchor text of a markdown link
  to its `sourceUrl` — `[Company](url)`, never bold and never plain. Quote
  only the figures listed under that peer; any other number attributed to them
  blocks publication.
- **Nothing from internal systems (rule 36).** No ticket counts, no
  subscription numbers, no node or VM inventory, no pipeline values. The
  customer's own telemetry read back to them is the creepy line, and the gate
  checks for it by name.
- **The AE's voice** from `voiceContext`, not a house style.
- **Short sentences and plain words.** The readability gate caps the email at
  Flesch-Kincaid grade 16 and reports both levers when it fails.
- **Prose that does not read as machine-written.** Work through
  `${CLAUDE_PLUGIN_ROOT}/skills/pov/references/humanization.md` while drafting
  the emails, not afterwards. It is the cheapest place to apply it, and the
  deterministic AI-tell check in step 5 will report what survives — em-dash
  pairs, `Moreover`/`Furthermore`/`Additionally` openers, uniform sentence
  length, "it's not just X, it's Y".

One known source of a rule-36 violation is mechanical rather than a judgement
call: the dashboard's recommendation headlines are built as
`Case <number>: <summary>`, so a support case number can travel into anything
derived from them. Search your drafts for `Case` followed by digits before you
send them anywhere.

Write it, then stop. **Do not score it yourself.**

### 5. Score it, and revise against what comes back

```
POST {base}/api/customer/{name}/pov/score
{"artifact": "<the JSON object from step 4, as a string>"}
```

The response is the full card — every criterion, including the ones that
pass, so it can be read as *what was checked* rather than only *what broke*:

| Field | What it is |
|---|---|
| `findings` | one row per criterion: `sc`, `status`, `detail` |
| `passed` | the verdict |
| `score` | the number |
| `peerValidation` | the verdict on your peer citation against the registry |
| `aiTells` | the deterministic AI-tell violations in the email bodies |

**Revise against the `detail`, which names the location and the number.**
`SC-17: 396 words, band 200-350` tells you what to change; a bare criterion
id does not, and three attempts spent re-guessing is what this field exists
to prevent.

**At most three passes.** If it still fails, **report the remaining findings
and stop. Do not publish.** Three attempts that have not closed a criterion
mean the criterion needs a human, and a fourth attempt is a model guessing at
a number it has already seen three times.

Three statuses, and the third is not a pass:

- `pass` — checked, and clean.
- `fail` — checked, and wrong. Revise.
- `unmeasured` — **the criterion could not be checked.** Report it in those
  words. `SC-1b` is permanently unmeasured because the artifact carries one
  body per persona and the criterion asks for two variants; it does not block.
  Never summarise an `unmeasured` as a pass, and never let it disappear into a
  score.

Report `score` and `passed` **as the endpoint returned them.** Do not round
them, do not soften them, and do not add an assessment of your own alongside.

### 6. Render

**Start from the shipped template. Do not compose the HTML from the rules.**

The one-pager you wrote in step 4 is structured content — Environment,
Insight, Convergence, Path Forward — with no opinion about how it looks.
Turning that into the document is this step, and it is the whole of claim 3.

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

Check it is one page. If it bleeds, **tighten the copy** — do not shrink the
font and do not edit the stylesheet. A re-tightened one-pager has changed, so
send it back through step 5 before publishing: the artifact that gets scored
has to be the artifact that gets published, or the score describes a document
nobody has.

### 7. Publish

**Only when the user has asked for it in this run.** Publishing writes to a
real customer's Drive folder with a share link, and nothing about a wrong one
looks like an error.

```
POST {base}/api/customer/{name}/pov/publish
{"artifact": "<the same JSON string you scored>", "pdfBase64": "<the rendered PDF>"}
```

| Response | Means |
|---|---|
| `200` with `written: true` and a `docUrl` | published |
| `422` with a `refusal` naming the gate | **it refused** — report which gate and why |

**The endpoint re-scores. It does not take your word for it**, and that is
deliberate rather than distrustful: a caller-supplied verdict means the gate
exists and never runs. So a `422` here after a clean step 5 is information,
not a glitch — the usual cause is that the artifact changed between scoring
and publishing, which is the one-page re-tighten above.

**The PDF is graded too**, by the same gate, over its extracted text. A PDF
that carries something the one-pager does not — a leaked node count, a second
page — is refused even though the JSON passed. It has to be a render of what
you scored, not a different document that happens to be attached.

Do not reach for the Drive API directly. The dashboard holds the credentials
and resolves the folder, and it **updates in place** rather than deleting and
recreating, which is what keeps existing share links alive. A second writer is
how two copies of one artifact start existing.

## Output

Report, in this order:

1. **The score, verbatim** — the number, the verdict, and every criterion that
   is not `pass`, with the endpoint's own `detail`. Including the `unmeasured`
   ones, named as unmeasured.
2. **What was published and where** — the Drive URL, or the refusal and its
   gate.
3. **Which persona got which peer reference.**
4. **Every intelligence gap** from the context call's `missing`. These matter
   as much as the output: they tell the AE what to verify before sending.

Do not add a verdict of your own beside the gate's. If you think the artifact
is better or worse than its score, that is worth saying in words — but the
score is the score.

## What not to do

- Do not invent customer initiatives, metrics, or quotes. Unverified specifics are worse
  than vagueness here, because the recipient knows their own business.
- Do not reference anything from internal systems — ticket counts, subscription numbers,
  pipeline values (rule 36).
- Do not send anything. This skill produces drafts for a human to review and send.
