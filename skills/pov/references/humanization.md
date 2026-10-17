---
doc-type: guide
status: active
owner: jason
updated: 2026-10-15
---

# AI-Tell Checklist

Work through this before any draft ships. It replaces a paid AI-detection API at
runtime: the patterns below are the ones detection tooling actually flagged across real
POV drafts, distilled into checks a model can run on its own output.

Automated detection remains useful for **tuning this list** during development. It is
not part of the generation path, so nobody needs an account to use this skill.

## Structural tells

- [ ] **Em dashes.** The single strongest signal in token-level classifiers. Maximum one
      per email. Prefer a period, a comma, or a restructure.
- [ ] **Tricolon.** Three parallel items in a row ("faster, cheaper, and more secure").
      Models love it. Break the pattern or cut to two.
- [ ] **Sentence length is too even.** Human writing varies hard — a 4-word sentence next
      to a 30-word one. If every sentence is 12-18 words, rewrite some.
- [ ] **Every paragraph is the same size.** Vary them.
- [ ] **Symmetrical construction** across consecutive sentences ("Not only… but also",
      "It's not X, it's Y" twice in one email).

## Lexical tells

- [ ] **Hedge-and-elevate vocabulary:** leverage, robust, seamless, streamline, holistic,
      landscape, realm, delve, underscore, pivotal, crucial, comprehensive, tapestry.
- [ ] **"It's worth noting that" / "That said," / "In today's fast-paced…"**
- [ ] **Abstract nouns where a concrete one exists:** "solutions" for a product name,
      "challenges" for the actual problem.
- [ ] **Superlatives with no number attached.** Either quantify it or cut it.

## Content tells

- [ ] **Claims with no number and no named company.** Rule 28. Specificity forwards.
- [ ] **A summary paragraph at the end** restating what was just said. Cut it; the CTA is
      the ending.
- [ ] **Balanced both-sides framing** where a human would just pick one.
- [ ] **Flattery opener.** "I was impressed by your recent…" Replace with the observable
      signal itself, stated flatly.

## Voice tells

- [ ] Read it aloud. If it doesn't sound like the AE talking, it isn't ready.
- [ ] Would the AE use this word? If the vocabulary outranks their normal register, pull
      it down.
- [ ] Contractions present? Their absence reads formal and synthetic.

## Final pass

- [ ] Reading level at 3rd grade or simpler (rule 10).
- [ ] Competitor-swap test: swap your product for a competitor's. If it still reads fine,
      the POV says nothing (rule 37).
- [ ] Forward test: would the recipient forward this with "thoughts?" (rule 40).
