---
doc-type: guide
status: active
owner: jason
updated: 2026-10-15
---

# Dashboard API

The skill reads account intelligence from a dashboard running on the user's own machine.
Nothing leaves that machine except the web research the skill does itself, and the
artifacts the dashboard publishes under its own credentials.

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
| Capability probe, and generation | POST | `/api/customer/:name/pov/generate` |
| Contacts for persona selection | GET | `/api/customer/:name/contacts` |
| AE voice profile (rule 10b, SC-43) | GET | `/api/ae/:name/style-guide` |

Four, where this file once listed fifteen. The long list described a POV being
assembled here out of raw intelligence, which is work the dashboard already
does behind the one POST below. The other eleven endpoints still exist and are
still useful — they are simply not this plugin's business, and a reference that
lists endpoints nobody calls teaches a reader to stop trusting it.

### POST `/api/customer/:name/pov/generate`

The whole interface. Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `intent` | string | **yes** | the point of view to argue; max 2000 chars; `400` without it |
| `sourceUrls` | string[] | no | user-supplied material; the first 10 are used |
| `personas` | `{name?, role}[]` | no | omit to let the dashboard choose |
| `publish` | boolean | no, **but send it** | **omitting it publishes** — the route reads `publish !== false` |

Responses:

| Status | Body | Meaning |
|---|---|---|
| `400` | `{"error":"intent is required"}` | the API is present — this is the capability probe |
| `400` | `{"error":"Unknown customer name"}` | resolve `:name` against `/api/accounts` |
| `409` | in-progress | one generation per customer at a time |
| `404` | plain text, not JSON | **the dashboard has no POV API** |

`intent` is validated **before** the customer lookup, which is what makes an
empty-body probe unambiguous: it answers "can this dashboard generate" without
the customer name mattering, so a freshly installed dashboard with nothing
seeded still reports correctly.

The response carries the one-pager sections and the per-persona emails, with
the AE voice profile already applied and the AI-detection gate already run.

## Notes

- `:name` is the customer name as the dashboard knows it. Resolve it against
  `/api/accounts` first rather than assuming the user's spelling matches.
- `generate-intelligence` is asynchronous. Poll `intelligence-status` rather than
  sleeping a fixed interval.
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
