---
doc-type: reference
status: active
owner: jason
updated: 2026-10-15
---

# Northwind Logistics — Outreach Emails

**Fictional.** Invented personas at an invented company, for format demonstration only.

---

## Persona 1 — Dana Reyes, VP Infrastructure

Peer reference: **Gates Corporation** (scale + AI capacity)

### Short (108 words)

Subject: Project Lantern and the Q3 routing model

Dana,

Your team said at FreightTech that Lantern wraps in the spring, and the board wants the
routing model live by Q3. That is two hard dates sharing one set of hardware.

Most teams run those as separate projects. We think they are one. Gates Corporation
moved 1,300 VMs during their consolidation and freed half their compute, which is what
paid for the AI work that came after. The consolidation funded the model.

I attached a one-page view of how Lantern, the driver app, and the routing model
connect. One page.

Would the 22nd work for 20 minutes?

Jamie

### Long (184 words)

Subject: Project Lantern and the Q3 routing model

Dana,

Your team mentioned at FreightTech that Project Lantern wraps in the spring. The board
wants the dispatch routing model in production by Q3. Those two dates are competing for
the same hardware, and right now they are being planned in different rooms.

We see this pattern often after an acquisition. Two regional environments merge, the
app teams lose environment parity, and the ML work gets scheduled as though capacity
will appear on its own.

Gates Corporation hit the same sequence. They moved 1,300 VMs and containerized 67
applications during consolidation, and freed 50% of their compute in the process. That
freed capacity is what the AI roadmap ran on. The consolidation was not a prerequisite
to the AI work. It was the funding for it.

Worth saying plainly: this adds an abstraction layer your platform team has to learn,
and that is a real cost in the first two quarters.

I attached a one-page view of how Lantern, the driver app rewrite, and the routing model
intersect. One page, no deck.

Would the 22nd work for 20 minutes?

Jamie

---

## Persona 2 — Priya Raghunathan, Director of Platform Engineering

Peer reference: **B2 Impact** (consolidation mechanics)

### Short (96 words)

Subject: environment parity for the driver app

Priya,

The driver app rewrite has been waiting on environment parity since the merger. Lantern
closes in the spring. Those are the same problem.

B2 Impact went from 400 VMs to 150 and 46 servers to 18 through one consolidation. The
part their platform team cared about was that staging finally matched production.

I attached a one-pager on how the consolidation, the app rewrite, and the routing model
line up. One page.

Would the 22nd work for 20 minutes?

Jamie

### Long (176 words)

Subject: environment parity for the driver app

Priya,

The driver app rewrite has been blocked on environment parity since the regional merger,
and Project Lantern closes in the spring. From the outside those read as two tickets in
two backlogs. They are the same constraint.

Two incompatible environments mean staging cannot mirror production, so the rewrite
cannot be validated, so it slips. Consolidation is usually framed as a cost project.
For the platform team it is a correctness project.

B2 Impact consolidated 400 VMs down to 150 and 46 servers to 18. The number their
platform engineers quoted afterward was not the server count. It was that staging
matched production for the first time in three years.

The honest trade-off: your team takes on a new abstraction layer, and the first two
quarters carry a real learning cost. That is not nothing.

I attached a one-page view of how consolidation, the driver app, and the Q3 routing
model connect. One page, no deck.

Would the 22nd work for 20 minutes?

Jamie
