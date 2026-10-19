---
doc-type: guide
status: active
owner: jason
updated: 2026-10-19
---

# Dashboard API

The skill reads account intelligence from a dashboard running on the user's own machine.
Nothing leaves that machine except the grounded web research the dashboard does under
its own search credential, and the artifacts it publishes under its own Google
credentials.

**The writing happens here, in your session.** The dashboard supplies facts and
grades the result; it does not generate the POV. See ADR-051.

**Base URL resolution:** `POV_DASHBOARD_URL` if set — used as given, with no
probing and no fallback. Otherwise discovery, port by port:

| Order | Port | What it is | Host aliases, in order |
|---|---|---|---|
| 1 | `7777` | the dashboard | `localhost`, `127.0.0.1`, `host.docker.internal` |
| 2 | `7776` | the **test** dashboard | `localhost`, `127.0.0.1`, `host.docker.internal` |

One entry per port: stop at the first alias that answers, because
`localhost:7777` and `127.0.0.1:7777` are the same dashboard and reporting
both as candidates invents an ambiguity. `host.docker.internal` covers the
case where the skill runs in a container and `localhost` is the container
rather than the host.

Zero dashboards is a refusal naming every URL tried. More than one is a
question, never a guess — see SKILL.md step 1 for why that one matters.

This is an **unversioned local contract**. If an endpoint 404s, report it plainly rather
than guessing at a replacement — a silently skipped intelligence source produces a POV
that looks complete and isn't.

## Endpoints used

| Purpose | Method | Path |
|---|---|---|
| Reachability check | GET | `/api/accounts` |
| Capability probe, and grounded facts | POST | `/api/customer/:name/pov/context` |
| The conformance gate | POST | `/api/customer/:name/pov/score` |
| Publish the finished artifact | POST | `/api/customer/:name/pov/publish` |
| AE voice profile (rule 10b, SC-43) | GET | `/api/ae/:name/style-guide` |

Five, where this file once listed fifteen and then four. The long list
described a POV being assembled here out of raw intelligence; the list of four
described the dashboard writing one. Both are retired. The other endpoints
still exist and are still useful — they are simply not this plugin's business,
and a reference that lists endpoints nobody calls teaches a reader to stop
trusting it.

`POST /api/customer/:name/pov/generate` is the **retired** single-call form. A
dashboard may still serve it; this plugin does not call it, and its presence
says nothing about whether the three endpoints above exist.

### POST `/api/customer/:name/pov/context`

Everything the dashboard knows, plus the grounded research. The slow call, and
the only one involving a search credential. Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `intent` | string | **yes** | the point of view to argue; max 2000 chars; `400` without it |
| `sourceUrls` | string[] | no | user-supplied material; the first 10 are used |
| `personas` | `{name?, role}[]` | no | omit to resolve them from the contact registry |

Responses:

| Status | Body | Meaning |
|---|---|---|
| `200` | the context object below | |
| `400` | `{"error":"intent is required"}` | the API is present — this is the capability probe |
| `400` | `{"error":"Unknown customer name"}` | resolve `:name` against `/api/accounts` |
| `409` | in-progress | one POV per customer at a time |
| `422` | `{"code":"NO_CUSTOMER_CONTACTS"}` | nobody is registered for this account |
| `422` | `{"code":"CONTACTS_HAVE_NO_TITLE", "contacts":[…]}` | they are registered and their roles are unknown |
| `404` | plain text, not JSON | **the dashboard has no POV context API** |

The two `422`s are two codes because they have two remedies. Report whichever
came back by name; collapsing them sends the user to the wrong one.

`intent` is validated **before** the customer lookup, which is what makes an
empty-body probe unambiguous: it answers "can this dashboard do the job"
without the customer name mattering, so a freshly installed dashboard with
nothing seeded still reports correctly.

The `200` body carries `personas`, `signalContext`, `customerDataContext`,
`researchContext`, `teamContext`, `voiceContext`, `caseStudies`,
`caseStudyContext`, and `loaded` / `missing`. **Read `missing`** — a POV that
reads complete over a source that returned nothing is what that field exists to
prevent.

### POST `/api/customer/:name/pov/score`

The conformance gate. Deterministic, offline, no credential — which is why it
stays server-side even though the writing moved.

| Field | Type | Required | Notes |
|---|---|---|---|
| `artifact` | string | **yes** | the POV object, JSON-stringified; `400` otherwise |

The `200` body is the full card: `findings` (`sc`, `status`, `detail` per
criterion), `passed`, `score`, `peerValidation`, `aiTells`. `status` has three
values and the third is not a pass — `unmeasured` means the criterion could not
be checked.

Report what it returns, verbatim. Scoring your own work against the spec you
wrote from is one instrument used twice; this one is a different instrument.

### POST `/api/customer/:name/pov/publish`

| Field | Type | Required | Notes |
|---|---|---|---|
| `artifact` | string | **yes** | the same JSON string you scored |
| `pdfBase64` | string | no | the rendered one-pager; must be a string when supplied |

Responses:

| Status | Body | Meaning |
|---|---|---|
| `200` | `{written: true, docUrl, pdfPath, score}` | published |
| `422` | `{written: false, refusal: {gate, reason}, score}` | refused — `gate` is `conformance`, `peer-citation`, `ai-tells` or `pdf` |
| `409` | in-progress | |

**It re-scores. It does not take your word for it** — a caller-supplied verdict
means the gate exists and never runs. The PDF is graded too, over its extracted
text, so an attachment carrying something the one-pager does not is refused
even though the JSON passed. A PDF with no extractable text layer is a refusal
rather than a pass: an unreadable document is not a clean one.

Nothing resolves the customer's Drive folder until every gate has passed.

## Notes

- `:name` is the customer name as the dashboard knows it. Resolve it against
  `/api/accounts` first rather than assuming the user's spelling matches.
- Always **preview before publish**. The publish step writes to a shared Drive folder
  that other people are looking at.
- Publishing updates in place when the artifact already exists. Do not delete and
  recreate — it breaks existing share links.

## When the dashboard is absent

The skill stops and says so. There is deliberately no degraded mode: a POV assembled
from public web research alone is the generic outreach the spec exists to prevent, and
shipping one under the same label would misrepresent its quality.

## History

**The port was documented as 3000 until 2026-10-17 and was never that.** The
dashboard listens on `7777` and the test instance on `7776`. Nothing caught it
because claim 2 had never been run end to end — three documents agreed with
each other and all three were wrong, which is why `test/dashboard-discovery.test.ts`
pins the numbers rather than only checking that they match.
