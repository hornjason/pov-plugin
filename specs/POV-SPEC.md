---
doc-type: spec
status: active
owner: jason
created: 2026-10-01
updated: 2026-10-15
governs: Unsolicited customer POV documents — the visual one-pager and the outreach email that carries it
testable: true
compliance: strict
---

# Unsolicited POV Spec

Single source of truth for customer-specific POV documents — the visual one-pager and
the accompanying outreach email. Derived from research across RAIN Group, Corporate
Visions, Gartner, Forrester, Challenger, and 2025-2026 cold outreach benchmarking.

---

## What a POV Is

An unsolicited POV is a one-page visual document that demonstrates you understand a
customer's current state, challenges, and strategic direction — then connects 2-3 of
their initiatives as one interconnected decision. It earns credibility before the first
meeting by showing homework, not a product pitch.

**POV = Convergence thesis + homework proof + one honest trade-off.**

The POV is attached as a PDF to a short outreach email:

- **Email** — 75-125 words, sells the meeting
- **PDF** — visual, narrative, sells the forward ("thoughts?")

---

## THE EMAIL (15 rules)

### Structure (Rules 1-5)

1. **Provide both short and long versions.** Short: 75-125 words (Boomerang, 40M emails).
   Long: ~200 words max. Generate both so the AE can choose. Short is the default
   recommendation — emails over 200 words drop reply rates 2.4x, and 61% of B2B email
   opens are on mobile.

2. **Three paragraphs, no more.** Personalized opener → value statement with a number →
   single clear CTA.

3. **Timeline hook, not problem hook.** Timeline-based hooks achieve 10.01% reply rates
   vs 4.77% for problem hooks — 2.3x (Digital Bloom 2025). Frame around compressed
   milestones, not pain.

4. **Single, specific, low-commitment CTA.** "Would the 15th work?" beats "Let's find
   time for a demo." Never a scheduling link on first touch. Never ask for more than 20
   minutes.

5. **Reference the attached one-pager in one sentence.** "I've attached a short
   perspective on how [X], [Y], and [Z] intersect — one page."

### Content (Rules 6-10)

6. **Signal-driven opener, always.** Signal-personalized outreach: 15-25% reply rates vs
   2-3% generic (Instantly 2026). The signal must be observable from outside — never
   internal data.

7. **Share a distinct point of view, not product features.** 68% of decision-makers
   favor "sharing a distinct POV" over ROI tools (Corporate Visions 2026). Perspective
   sellers win 2.7x more deals.

8. **Correct a confident misunderstanding.** 69% of buyers seek seller validation
   because they sense their AI-generated research may be wrong (Gartner, May 2026).
   Show them something they believe that isn't so, or connect dots they haven't.

9. **Named peer reference with a concrete metric, varied per persona.** A named company
   with a real number forwards; "leading companies improved efficiency" gets deleted.
   One company, one number, hyperlinked to the public case study, with the company name
   as the anchor text. When mailing multiple personas at one account, assign a different
   reference to each.

10. **3rd-grade reading level.** 36% more responses at a simpler reading level
    (Boomerang). Short words. Short sentences.

### Voice (Rule 10b)

10b. **Match the owning AE's voice.** Tone, sentence structure, opener pattern,
     vocabulary. The dashboard serves the profile at `/api/ae/{name}/style-guide`,
     and the generation endpoint applies it without being asked. If no profile
     exists, use a humble-expert voice: direct, specific, no superlatives. Never
     ship a generic-sounding email when a profile is available.

     *The source matters as much as the rule.* An earlier version said only
     "if the dashboard exposes a voice profile, use it" and named no endpoint.
     It does expose one, and nothing called it — a rule with no locatable
     source is a rule nobody can satisfy or check. SC-43 grades this.

### Anti-Patterns (Rules 11-15)

11. **Never spray-and-pray.** Narrowing ICP from broad to specific moved response from
    2% to 11% (Belkins 2025).

12. **Never let a model write the final email.** Generic AI-written emails see ~90%
    lower response. Use AI for research and structure, not for the finished prose. See
    `references/humanization.md` for the tell-checklist to self-review against.

13. **Never send from the primary domain.** Use a separate lookalike domain for outbound
    to protect domain reputation.

14. **Never skip follow-up.** 48% of reps never follow up. The first follow-up adds
    40-50% more replies. A 3-7-7 day cadence captures 93% of total replies by day 10.

15. **Never ask for more than 20 minutes on first touch.**

---

## THE ONE-PAGER / PDF (15 rules)

### Structure (Rules 16-20)

16. **One page, no exceptions.** The constraint is the feature.
17. **200-350 words of copy, plus visuals.** Every word earns its place.
18. **Narrative arc: Environment → Insight → Convergence → Path Forward.** Challenger
    Commercial Teaching compressed to one page.
19. **Convergence thesis as the centerpiece.** Connect 2-3 separate customer initiatives
    as one challenge. Without convergence, 40%+ of deals end in "no decision"
    (CEB/Challenger).
20. **Bold key terms inline, not in separate cards.** Running bold through body copy
    beats isolated stat tiles or card grids.

### Visual Design (Rules 21-25)

21. **Top-left entry, proof center, CTA bottom-right.** F-pattern reading.
22. **Logo and credibility signals over faces.** Partner logos and named references
    build B2B trust faster than photography.
23. **Address both System 1 and System 2.** Even complex B2B decisions are 40% emotional
    (CEB/Gartner). Convergence callout = emotion; capability table = logic.
24. **Whitespace is functional, not decorative.**
25. **No date stamp, no file name in header or footer.** It must forward weeks later
    without looking stale.

### Forward-Worthiness (Rules 26-30)

26. **Pass the "forward without changing a word" test.** Buyer's perspective, buyer's
    language, buyer's metrics.
27. **Pre-answer exactly one objection.** One pre-empted objection reads as honesty;
    five read as defensiveness.
28. **Specificity forwards, vagueness gets deleted.** Every claim carries a number or a
    named company.
29. **Be honest about limitations.** One concession earns more trust than five
    superlatives.
30. **No gates.** No login, no form, no "contact us." A clean PDF that opens instantly.

---

## THE CONVERGENCE FORMAT (4 rules)

31. **Frame 2-3 customer initiatives as one interconnected challenge.**
32. **Create a shared mental model.** The convergence callout is the most important
    element on the page. It reframes how the buyer sees their own situation.
33. **Use a simple visual to show the connection.** Two-column diagram with your product
    bridging both initiatives.
34. **Name their initiatives by name.** Internal program names prove real research.

---

## QUALITY GATES (6 rules)

35. **Self-review against the AI-tell checklist.** Work through
    `references/humanization.md` line by line before the draft ships. Automated AI
    detection is a development-time tool for tuning this checklist, not a runtime
    dependency — the skill never calls a paid detection API.
36. **Creepy-line check.** Never reference support tickets, subscription counts, node
    counts, pipeline values, usage telemetry, or headcount reductions. If it came from
    internal systems rather than public observation, it does not go in.
37. **Competitor-swap test.** Replace your product name with a competitor's. If the
    email still works, it's a brochure.
38. **One-page render test.** Print-preview the PDF. Any bleed to page two means tighten.
39. **Mobile render test.** The email must be fully readable without scrolling on mobile.
40. **Forward-worthy test.** Read the one-pager as the buyer's engineering lead receiving
    it forwarded with "thoughts?" — does it stand alone without the email?

---

## Intelligence Requirements

Every POV pulls from these sources. Dashboard-backed items are fetched automatically;
see `references/dashboard-api.md`.

- [ ] Customer brief from the dashboard, if one exists
- [ ] Subsidiary and connected-account briefs
- [ ] Web research: cloud migration posture, tech stack, leadership, hiring signals
- [ ] Leadership: CTO, CEO, target persona name and title
- [ ] Existing product footprint at the account
- [ ] Public case study for the peer reference — see the registry below
- [ ] Regulatory or market hooks (tax changes, compliance deadlines)
- [ ] The target persona's own public activity

---

## Verified Case Study Registry

Public, published case studies. Match the reference to the persona by situation fit, not
just industry. Verify the URL still resolves before using it — these rot.

| Company | Industry | What They Did | Key Metric | Best For |
|---|---|---|---|---|
| Gates Corporation | Manufacturing | 1,300+ VMs to OpenShift, 67 apps containerized | 50% compute freed for AI | Scale + AI strategy |
| B2 Impact | Financial Services | VM and container consolidation | 400 VMs → 150, 46 servers → 18 | Consolidation stories |
| Telefónica Brazil | Telecom | Legacy virtualization to OpenShift | 99% faster scaling, 55% less CPU | Enterprise migration at scale |
| Reist Telecom AG | IT Services | Legacy virtualization to OpenShift | Halved licensing costs | Cost reduction |

**Adding entries:** named company, concrete number, public URL. Vague "leading
enterprise" references get deleted by recipients.

---

## Validated Format Reference

One POV has been through the full loop — written, humanized, rendered,
published, and read by its recipients. Its shape is the reference, and it is
recorded here because "follow the 41 rules" and "produce that document" are
not the same instruction. The rules constrain; this describes.

| Element | What the validated POV did |
|---|---|
| Email length | ~90 words, under the 125 ceiling rather than near it |
| Email body | three tight bullets, not three prose paragraphs |
| One-pager reference | one sentence — *"one-pager attached with the full convergence map"* |
| One-pager flow | narrative, not a dashboard: Environment → Insight → Convergence → Path Forward |
| Emphasis | bold terms running inline through body copy |
| Convergence | one callout box, visually dominant, one idea in it |
| Diagram | two columns, the product bridging the two initiatives |
| What it did **not** use | stat tiles, card grids, a date stamp, a file name in the footer |

The last row is the useful one. Stat tiles and card grids satisfy every
written rule and still produce a different document — the first draft of that
POV used them and was rebuilt. A rule set cannot catch that, which is why
claim 3's evidence is two renders and a human looking at them.

**The customer is not named here, deliberately.** The format is the
transferable part; the account is not, and this file is public.

## Output Artifacts

| Artifact | Format | Destination |
|---|---|---|
| Per-persona outreach emails | Markdown + campaign HTML | Customer folder, via the dashboard |
| Visual one-pager | PDF rendered from HTML | Customer folder, via the dashboard |
| Source HTML | `.html` | Local working directory |

**Rule:** when updating an artifact that already exists, update in place. Never delete
and recreate — it breaks sharing and link history.

---

## Success Criteria

### Email (SC-1 to SC-15)
- [ ] SC-1: Short version 75-125 words and long version under 200 words both generated
- [ ] SC-2: Three paragraphs maximum
- [ ] SC-3: Opener uses a timeline hook rather than a problem hook
- [ ] SC-4: Exactly one CTA, and it is not a scheduling link
- [ ] SC-5: The attached one-pager is referenced in one sentence
- [ ] SC-6: Opener cites an externally observable signal
- [ ] SC-7: Body states a point of view rather than product features
- [ ] SC-8: The POV corrects a misunderstanding or connects unconnected dots
- [ ] SC-9: Peer reference names one company and one metric
- [ ] SC-10: Peer reference differs across personas at the same account
- [ ] SC-11: Reading level is 3rd grade or simpler
- [ ] SC-12: Email matches the owning AE's voice profile when one exists
- [ ] SC-13: Draft passes every line of the AI-tell checklist
- [ ] SC-14: Follow-up cadence of 3-7-7 days is included
- [ ] SC-15: No ask exceeds 20 minutes

### One-Pager (SC-16 to SC-30)
- [ ] SC-16: Renders to exactly one page
- [ ] SC-17: Copy is between 200 and 350 words
- [ ] SC-18: Sections follow Environment, Insight, Convergence, Path Forward
- [ ] SC-19: A convergence thesis connects 2-3 named initiatives
- [ ] SC-20: Key terms are bolded inline rather than placed in cards
- [ ] SC-21: Headline sits top-left and next steps sit bottom-right
- [ ] SC-22: Credibility signals are logos or named references, not stock photography
- [ ] SC-23: Page contains both a convergence callout and a capability table
- [ ] SC-24: Margins and spacing leave the page uncrowded
- [ ] SC-25: No date stamp or file name appears in the header or footer
- [ ] SC-26: Text reads from the buyer's perspective throughout
- [ ] SC-27: Exactly one objection is pre-answered
- [ ] SC-28: Every claim carries a number or a named company
- [ ] SC-29: One honest limitation is stated plainly
- [ ] SC-30: PDF opens with no login, form, or gate

### Convergence (SC-31 to SC-34)
- [ ] SC-31: Two or three initiatives are framed as one challenge
- [ ] SC-32: A convergence callout box is visually dominant
- [ ] SC-33: A two-column diagram shows the product bridging the initiatives
- [ ] SC-34: Customer initiatives are named by their internal program names

### Quality Gates (SC-35 to SC-40)
- [ ] SC-35: AI-tell checklist completed with no unresolved items
- [ ] SC-36: Creepy-line check finds no internal-systems data
- [ ] SC-37: Competitor-swap test fails, proving the POV is not a brochure
- [ ] SC-38: Print preview shows no bleed onto a second page
- [ ] SC-39: Email is readable on mobile without scrolling
- [ ] SC-40: One-pager stands alone when read without the email

### Process (SC-41 to SC-43)

These three govern how the artifacts are produced rather than what they
contain, and they were lost once already: an earlier copy of this spec carried
SC-1 to SC-40 only, so rule 10b sat here with nothing grading it. A rule whose
criterion is missing is a rule that cannot fail.

- [ ] SC-41: Peer references come from the Verified Case Study Registry
- [ ] SC-42: No ask exceeds 20 minutes
- [ ] SC-43: Emails use the AE voice profile whenever the dashboard serves one

