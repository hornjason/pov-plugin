/**
 * The contract between this plugin and the dashboard's POV API.
 *
 * ## Why this file exists
 *
 * This file has been rewritten twice, and the second rewrite is the one that
 * matters.
 *
 * Until 2026-10-17 the plugin assembled a POV out of 11 raw intelligence
 * endpoints and none of the ones that mattered. That was replaced by a single
 * call to the dashboard's `pov/generate`, which researched, wrote, gated and
 * published, leaving the plugin as a visual layer.
 *
 * **ADR-051 (2026-10-19) replaced that one again, and the reason is the
 * install story.** A colleague installs this *as a Claude Code plugin*. If the
 * dashboard does the writing, every consumer of the plugin is a caller of one
 * person's GCP project — for the one task their host already supplies a model
 * for. So the split is model-vs-deterministic, not plugin-vs-dashboard:
 *
 *   dashboard — grounded facts, and the gate (`/pov/context`, `/pov/score`,
 *               `/pov/publish`)
 *   the host  — writing the one-pager and the per-persona emails
 *   plugin    — the visual layer: template, HTML, PDF
 *
 * ## What can go wrong, and therefore what is asserted
 *
 * **The gate must not move with the generation**, which is the decision most
 * likely to be dropped as a round trip nobody needs. A model grading its own
 * output against the rules it generated from is one instrument used twice.
 * The `SELF-*` block is about that and nothing else.
 *
 * The request bodies are the rest of the interface, and each is stated in two
 * documents that a single edit can separate: `SKILL.md` tells the model what
 * to send, `references/dashboard-api.md` documents the endpoint. A field
 * renamed in one and not the other produces a request the dashboard rejects,
 * or worse, silently ignores.
 *
 * Per `.claude/rules/checks-must-be-able-to-fail.md`, every assertion slices
 * the region it is about out of the document first and asserts the slice is
 * non-empty — a claim scoped to one section but matched against a whole file
 * is satisfied by a coincidence somewhere else in it.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const SKILL = readFileSync(join(ROOT, "skills", "pov", "SKILL.md"), "utf-8");
const API = readFileSync(join(ROOT, "skills", "pov", "references", "dashboard-api.md"), "utf-8");
const README = readFileSync(join(ROOT, "README.md"), "utf-8");
const SPEC = readFileSync(join(ROOT, "specs", "POV-SPEC.md"), "utf-8");

/**
 * The RETIRED single-call endpoint, kept as a constant because two cases are
 * about its absence.
 *
 * Endpoints are asserted by their unambiguous tail rather than their full
 * path, because the two documents legitimately write the parameter
 * differently: `SKILL.md` uses `{name}` to match its own `{base}/...`
 * URL-template style, and `dashboard-api.md` uses `:name` to match the route
 * definition it documents. Forcing one convention on both would make the
 * reference disagree with the source it describes.
 *
 * No other route ends in `/pov/generate`, so this is narrower than it looks —
 * it cannot be satisfied by a coincidence, which is the only thing a loosened
 * assertion must not be.
 */
const GENERATE_PATH = "/pov/generate";

/**
 * There is deliberately NO version constant here.
 *
 * The first draft of this file pinned `1.7.6`, on a check that reported the
 * routes present in that tag. They are not: `v1.7.6` was tagged 2026-09-02
 * and `src/pov-routes.ts` was added 2026-10-16. `git cat-file -e` prints
 * "exists on disk, but not in <tag>" to stderr and exits 128, which reads as
 * presence to anything that only looks at stdout. Three methods agree it is
 * absent: `ls-tree` is empty, `cat-file -e` exits 128, and the add-commit
 * postdates the tag by six weeks.
 *
 * The correction is better than the fix. **Probe the capability, do not
 * compare a version string.** A version is a label about the thing; the
 * endpoint is the thing. A container built from main carries the API with no
 * version to show for it, and a consumer on a future release could still have
 * it disabled. Asking the dashboard whether it can generate answers the
 * question a version number only approximates — which is the same lesson the
 * rest of this repo keeps relearning.
 */

/**
 * Cuts a section out of a markdown document by heading. Returns "" when the
 * heading is gone; every caller asserts non-empty first, because a slice that
 * failed to find its section contains nothing, and "contains nothing" is
 * indistinguishable from "contains no violation".
 */
function section(doc: string, startsWith: string, stopsAt: RegExp): string {
  const start = doc.indexOf(startsWith);
  if (start === -1) return "";
  const rest = doc.slice(start + startsWith.length);
  const end = rest.search(stopsAt);
  return end === -1 ? rest : rest.slice(0, end);
}

const CONTEXT_STEP = "### 3. Pull the context";
const WRITE_STEP = "### 4. Write the POV";
const SCORE_STEP = "### 5. Score it, and revise against what comes back";
const RENDER_STEP = "### 6. Render";
const PUBLISH_STEP = "### 7. Publish";
const CONFIRM_STEP = "### 2. Confirm the dashboard has the three endpoints";

describe("ADR-051 — the skill writes, the dashboard supplies facts and grades", () => {
  test("GEN-1: the skill names all three endpoints it drives", () => {
    for (const path of ["/pov/context", "/pov/score", "/pov/publish"]) {
      expect(SKILL).toContain(path);
    }
  });

  test("GEN-2: the context call sends intent, and says it is required", () => {
    const step = section(SKILL, CONTEXT_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("intent");
    expect(step.toLowerCase()).toContain("required");
  });

  test("GEN-3: the context call sends sourceUrls for supplied documents and links", () => {
    const step = section(SKILL, CONTEXT_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("sourceUrls");
  });

  test("GEN-4: the skill writes the artifact itself, in the shape the gate reads", () => {
    // The row ADR-051 inverted. Before this the model call was server-side,
    // which made every consumer of this plugin a caller of one person's GCP
    // project for the one task their host already supplies a model for.
    const step = section(SKILL, WRITE_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(400);
    for (const field of ["onePager", "emails", "convergence", "pathForward"]) {
      expect(step).toContain(field);
    }
  });

  test("GEN-5: the API reference documents all three as routes", () => {
    for (const route of [
      "/api/customer/:name/pov/context",
      "/api/customer/:name/pov/score",
      "/api/customer/:name/pov/publish",
    ]) {
      expect(API).toContain(route);
    }
  });

  test("GEN-6: both documents name the same context request fields", () => {
    // One edit can separate them: SKILL.md tells the model what to send and
    // the reference documents the endpoint. A field renamed in one and not
    // the other produces a request the dashboard rejects, or ignores.
    const skillStep = section(SKILL, CONTEXT_STEP, /\n### /);
    const apiStep = section(API, "### POST `/api/customer/:name/pov/context`", /\n### /);
    expect(skillStep.length).toBeGreaterThan(200);
    expect(apiStep.length).toBeGreaterThan(100);
    for (const field of ["intent", "sourceUrls", "personas"]) {
      expect(skillStep).toContain(field);
      expect(apiStep).toContain(field);
    }
  });

  test("GEN-7: both documents name the same publish request fields", () => {
    const skillStep = section(SKILL, PUBLISH_STEP, /\n## /);
    const apiStep = section(API, "### POST `/api/customer/:name/pov/publish`", /\n### |\n## /);
    expect(skillStep.length).toBeGreaterThan(200);
    expect(apiStep.length).toBeGreaterThan(100);
    for (const field of ["artifact", "pdfBase64"]) {
      expect(skillStep).toContain(field);
      expect(apiStep).toContain(field);
    }
  });

  test("GEN-8: the skill never CALLS the retired single-call endpoint", () => {
    // Scoped to the call form, not to the path, and the first draft of this
    // case got that wrong — it grepped the steps for `/pov/generate` and went
    // red on step 2's "probe /pov/context and not /pov/generate", which is
    // the sentence that makes the capability probe correct.
    //
    // Prose about an endpoint is an occurrence of that endpoint to any
    // scanner, so an assertion about what the skill DOES has to match
    // something only a call can produce. `{name}/pov/generate` is that: it
    // only appears inside this file's `{base}/api/customer/{name}/...` URL
    // template, which is a request and never a mention.
    const steps = section(SKILL, "## Steps", /\n## Output/);
    expect(steps.length).toBeGreaterThan(1000);
    expect(steps).not.toContain(`{name}${GENERATE_PATH}`);
    // The negative control: the same shape for an endpoint the skill DOES
    // call is present, so "contains no call" cannot be satisfied by a slice
    // that contains no calls at all.
    expect(steps).toContain("{name}/pov/context");
  });
});

/**
 * The self-grading refusal, which is ADR-051's load-bearing decision and the
 * one most likely to be quietly dropped as a round trip nobody needs.
 *
 * The tempting shape is: read the spec, write the POV, check your own work
 * against the same prose. That is one instrument used twice. `/pov/score` is
 * deterministic TypeScript with its own recorded mutation evidence, it needs
 * no credential, and its verdict is what gets reported.
 */
describe("ADR-051 — the skill does not grade itself", () => {
  test("SELF-1: the skill is told to score through the endpoint, not itself", () => {
    const step = section(SKILL, SCORE_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(400);
    expect(step).toContain("/pov/score");
  });

  test("SELF-2: the refusal is stated where the division of labour is", () => {
    const split = section(SKILL, "## What this skill does", /\n## Invocation/);
    expect(split.length).toBeGreaterThan(400);
    expect(split.toLowerCase()).toContain("do not do that");
    expect(split.toLowerCase()).toContain("different instrument");
  });

  test("SELF-3: unmeasured is reported as unmeasured, never as a pass", () => {
    // Three states, and the third is the one that gets rounded away. A
    // criterion that could not be checked is not a criterion that passed.
    const step = section(SKILL, SCORE_STEP, /\n### /);
    expect(step).toContain("unmeasured");
    expect(step.toLowerCase()).toContain("never summarise an `unmeasured` as a pass".toLowerCase());
  });

  test("SELF-4: the revision loop is bounded and stops rather than publishing", () => {
    const step = section(SKILL, SCORE_STEP, /\n### /);
    expect(step.toLowerCase()).toContain("at most three passes");
    expect(step.toLowerCase()).toContain("do not publish");
  });

  test("SELF-5: the skill is told the publish endpoint re-scores", () => {
    // Otherwise a 422 after a clean step 5 reads as a glitch, and the first
    // repair anyone reaches for is to stop checking.
    const step = section(SKILL, PUBLISH_STEP, /\n## /);
    expect(step.length).toBeGreaterThan(200);
    expect(step.toLowerCase()).toContain("re-scores");
  });
});

describe("A dashboard without the POV API refuses distinguishably", () => {
  test("CAP-1: the skill probes the endpoint it is going to call", () => {
    // Probing `/pov/generate` would answer a question nobody asked: a
    // dashboard can carry the old single-call API and none of the three this
    // skill now needs, which is what every pre-ADR-051 dashboard looks like.
    const step = section(SKILL, CONFIRM_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("/pov/context");
    expect(step).not.toContain(`POST {base}/api/customer/{name}${GENERATE_PATH}`);
  });

  test("CAP-2: the probe decides on the endpoint's answer, not a version string", () => {
    // A dashboard built from main carries the API and reports no version for
    // it. A dashboard on a future release could have it disabled. Only the
    // endpoint knows.
    const step = section(SKILL, CONFIRM_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("404");
  });

  test("CAP-3: the README tells a reader their dashboard may be too old", () => {
    const req = section(README, "## Requirements", /\n## /);
    expect(req.length).toBeGreaterThan(100);
    expect(req).toContain("/pov/context");
  });

  test("CAP-4: the three dashboard refusals are distinct outcomes", () => {
    // None reachable, several reachable, and reachable-but-too-old are three
    // different problems with three different fixes. A single "cannot use the
    // dashboard" message would send someone to start a service that is
    // already running.
    const find = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    const confirm = section(SKILL, CONFIRM_STEP, /\n### /);
    expect(find.length).toBeGreaterThan(200);
    expect(confirm.length).toBeGreaterThan(200);
    expect(find).toContain("Start the dashboard");
    expect(confirm.toLowerCase()).toContain("upgrade");
  });

  test("CAP-5: the two context refusals are kept apart", () => {
    // NO_CUSTOMER_CONTACTS means run contact discovery; CONTACTS_HAVE_NO_TITLE
    // means the contacts are there and their roles are not. Two codes because
    // two remedies, and collapsing them sends the user to the wrong one.
    const step = section(SKILL, CONTEXT_STEP, /\n### /);
    expect(step).toContain("NO_CUSTOMER_CONTACTS");
    expect(step).toContain("CONTACTS_HAVE_NO_TITLE");
  });
});

describe("The spec carries the criteria the retyping dropped", () => {
  // The original spec at ~/Projects/POV/specs/POV-SPEC.md has 43 success
  // criteria in five groups. This copy was retyped with four groups and
  // SC-41..SC-43 — "Process Rules" — were lost. SC-43 is the criterion that
  // enforces rule 10b, so the rule survived here with nothing grading it.
  test("SPEC-1: SC-41 is present", () => {
    expect(SPEC).toContain("SC-41:");
  });

  test("SPEC-2: SC-42 is present", () => {
    expect(SPEC).toContain("SC-42:");
  });

  test("SPEC-3: SC-43 is present, and names the voice profile", () => {
    const sc = section(SPEC, "SC-43:", /\n/);
    expect(sc.length).toBeGreaterThan(10);
    expect(sc.toLowerCase()).toContain("voice");
  });

  test("SPEC-4: the Process Rules group exists", () => {
    // Matched on the property — a heading that groups SC-41 to SC-43 — and
    // not on one verbatim rendering of it. This copy is now DERIVED, so the
    // canonical spec's wording wins; it says "Process Rules (SC-41 through
    // SC-43)" where the retyped copy said "Process (SC-41 to SC-43)".
    //
    // The old assertion would have gone red on that, and the red would have
    // said nothing about the thing it exists for. The group being DROPPED is
    // the defect this test was written for — the retyping lost it, taking
    // SC-43 and with it the only grader for rule 10b. A test that also fails
    // when "through" replaces "to" is a test somebody fixes by editing the
    // string, which is how a real signal gets trained out of a suite.
    expect(SPEC).toMatch(/^#+ Process[^\n]*SC-41[^\n]*SC-43/m);
  });

  test("SPEC-5: rule 10b names the endpoint serving the voice profile", () => {
    // The rule said "if the dashboard exposes a voice profile, use it" and
    // never said where. It does expose one, at /api/ae/:name/style-guide,
    // and the skill never called it — a rule with no locatable source is a
    // rule nothing can satisfy.
    const rule = section(SPEC, "10b.", /\n### /);
    expect(rule.length).toBeGreaterThan(100);
    expect(rule).toContain("/api/ae/");
  });
});

describe("Output cannot carry what rule 36 forbids", () => {
  test("REDACT-1: the skill strips support case references", () => {
    // GET /api/customer/:name/recommendations returns headlines containing
    // support case numbers. Rule 36 forbids referencing support tickets in
    // customer-facing output. Pulling more dashboard data is not free: this
    // is the filter that makes the wider pull safe.
    //
    // ADR-051 moved this. There is no longer a self-review step — the skill
    // does not grade itself — so the filter had to go somewhere that is not a
    // grading pass. It is in the WRITING step, which is cheaper anyway: the
    // case number never enters the draft instead of being taken back out.
    const step = section(SKILL, WRITE_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(400);
    expect(step.toLowerCase()).toContain("case");
  });

  test("REDACT-2: the filter names the mechanical form the number arrives in", () => {
    // `Case <number>: <summary>` is how the dashboard builds recommendation
    // headlines, so this is a string search, not a judgement call. Saying
    // "do not reference support tickets" leaves the reader looking for an
    // intent they never had.
    const step = section(SKILL, WRITE_STEP, /\n### /);
    expect(step).toContain("Case");
    expect(step).toMatch(/digits|<number>|\\d/);
  });
});

describe("The PDF has a named renderer", () => {
  test("PDF-1: the skill names what renders the PDF", () => {
    // The spec calls the one-pager "a PDF rendered from HTML" and for the
    // life of this repo nothing named a tool that renders one. The original
    // work used headless Chrome; SUCCESS.md carried it as an open question.
    const step = section(SKILL, RENDER_STEP, /\n### /);
    expect(step.length).toBeGreaterThan(100);
    expect(step.toLowerCase()).toContain("chrome");
  });

  test("PDF-2: a re-tightened one-pager is sent back through the gate", () => {
    // The one case where the ordering of the steps is load-bearing. Trimming
    // copy to fit one page changes the artifact, and the score then describes
    // a document nobody has — which is also the likeliest cause of a 422 at
    // publish, since that endpoint re-scores what it is handed.
    const step = section(SKILL, RENDER_STEP, /\n### /);
    expect(step).toContain("step 5");
  });
});
