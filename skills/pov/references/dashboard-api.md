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
| List briefs | GET | `/api/briefs` |
| Read one brief | GET | `/api/briefs/:name` |
| Free-text account query | GET | `/api/customer-query` |
| Contacts for persona selection | GET | `/api/customer/:name/contacts` |
| Meeting attendees | GET | `/api/customer/:name/attendees` |
| Trigger intelligence refresh | POST | `/api/customer/:name/generate-intelligence` |
| Refresh status | GET | `/api/customer/:name/intelligence-status` |
| News signals | GET | `/api/customer/:name/intelligence/news` |
| Event signals | GET | `/api/customer/:name/intelligence/events` |
| Product roadmap fit | GET | `/api/customer/:name/intelligence/roadmap` |
| Expansion opportunities | GET | `/api/customer/:name/expansion-opportunities` |
| Create campaign | POST | `/api/customer/:name/campaigns/generate` |
| Preview before publishing | GET | `/api/customer/:name/campaigns/:id/preview` |
| Publish to the customer folder | POST | `/api/customer/:name/campaigns/:id/publish` |

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
