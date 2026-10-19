/**
 * The contract between this plugin and the dashboard's POV API.
 *
 * ## Why this file exists
 *
 * Until 2026-10-17 this plugin orchestrated raw dashboard endpoints and built
 * the POV itself. That was a reimplementation of work the dashboard already
 * does: `POST /api/customer/:name/pov/generate` has accepted a free-form
 * `intent` and a `sourceUrls` list since issue #1480, and the service behind
 * it already grounds research against the intent, applies the AE voice
 * profile, runs a Sapling gate and publishes to Drive.
 *
 * The plugin was reading 11 of the 42 customer-scoped endpoints and none of
 * the ones that mattered. The division of labour now is:
 *
 *   dashboard — intelligence, content, voice, quality gates, publish
 *   plugin    — the visual layer: template, HTML, PDF
 *
 * ## What can go wrong, and therefore what is asserted
 *
 * The request body is the whole interface, and it is stated in two documents
 * that a single edit can separate: `SKILL.md` tells the model what to send,
 * `references/dashboard-api.md` documents the endpoint. A field renamed in
 * one and not the other produces a request the dashboard rejects, or worse,
 * silently ignores.
 *
 * `publish` is the dangerous one. The route reads `body.publish !== false`,
 * so **omitting it publishes**. A review run that forgets the field writes to
 * a real customer's Drive folder. That is asserted twice here: that the skill
 * sends it explicitly, and that it says why.
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
 * The generation endpoint.
 *
 * Asserted by its unambiguous tail rather than its full path, because the two
 * documents legitimately write the parameter differently: `SKILL.md` uses
 * `{name}` to match its own `{base}/...` URL-template style, and
 * `dashboard-api.md` uses `:name` to match the route definition it documents.
 * Forcing one convention on both would make the reference disagree with the
 * source it describes.
 *
 * `/pov/generate` is the whole of what matters here and no other route ends
 * that way, so this is narrower than it looks — it cannot be satisfied by a
 * coincidence, which is the only thing a loosened assertion must not be.
 */
const GENERATE_PATH = "/pov/generate";

/** The full route form, which the API reference specifically must carry. */
const GENERATE_ROUTE = "/api/customer/:name/pov/generate";

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

describe("The skill calls the dashboard's POV API rather than rebuilding it", () => {
  test("GEN-1: the skill names the generation endpoint", () => {
    expect(SKILL).toContain(GENERATE_PATH);
  });

  test("GEN-2: the skill sends intent, and says it is required", () => {
    const step = section(SKILL, "### 3. Generate", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("intent");
    expect(step.toLowerCase()).toContain("required");
  });

  test("GEN-3: the skill sends sourceUrls for supplied documents and links", () => {
    const step = section(SKILL, "### 3. Generate", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("sourceUrls");
  });

  test("GEN-4: the skill sends publish explicitly, because omitting it publishes", () => {
    // The route reads `body.publish !== false`. An omitted field is a publish
    // to a real customer's Drive folder, so "we just won't set it" is the
    // failure mode, not the safe default.
    const step = section(SKILL, "### 3. Generate", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("publish");
    expect(step).toContain("false");
  });

  test("GEN-5: the API reference documents the generation endpoint as a route", () => {
    expect(API).toContain(GENERATE_ROUTE);
  });

  test("GEN-6: both documents name the same request fields", () => {
    const skillStep = section(SKILL, "### 3. Generate", /\n### /);
    const apiStep = section(API, "### POST", /\n## /);
    expect(skillStep.length).toBeGreaterThan(200);
    expect(apiStep.length).toBeGreaterThan(100);
    for (const field of ["intent", "sourceUrls", "personas", "publish"]) {
      expect(skillStep).toContain(field);
      expect(apiStep).toContain(field);
    }
  });
});

describe("A dashboard without the POV API refuses distinguishably", () => {
  test("CAP-1: the skill probes for the POV API before relying on it", () => {
    const step = section(SKILL, "### 2. Confirm the dashboard can generate", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain(GENERATE_PATH);
  });

  test("CAP-2: the probe decides on the endpoint's answer, not a version string", () => {
    // A dashboard built from main carries the API and reports no version for
    // it. A dashboard on a future release could have it disabled. Only the
    // endpoint knows.
    const step = section(SKILL, "### 2. Confirm the dashboard can generate", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step).toContain("404");
  });

  test("CAP-3: the README tells a reader their dashboard may be too old", () => {
    const req = section(README, "## Requirements", /\n## /);
    expect(req.length).toBeGreaterThan(100);
    expect(req).toContain("/pov/generate");
  });

  test("CAP-4: the three dashboard refusals are distinct outcomes", () => {
    // None reachable, several reachable, and reachable-but-too-old are three
    // different problems with three different fixes. A single "cannot use the
    // dashboard" message would send someone to start a service that is
    // already running.
    const find = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    const confirm = section(SKILL, "### 2. Confirm the dashboard can generate", /\n### /);
    expect(find.length).toBeGreaterThan(200);
    expect(confirm.length).toBeGreaterThan(200);
    expect(find).toContain("Start the dashboard");
    expect(confirm.toLowerCase()).toContain("upgrade");
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
    const step = section(SKILL, "### 5. Self-review before publishing", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(step.toLowerCase()).toContain("case");
  });
});

describe("The PDF has a named renderer", () => {
  test("PDF-1: the skill names what renders the PDF", () => {
    // The spec calls the one-pager "a PDF rendered from HTML" and for the
    // life of this repo nothing named a tool that renders one. The original
    // work used headless Chrome; SUCCESS.md carried it as an open question.
    const step = section(SKILL, "### 4. Render", /\n### /);
    expect(step.length).toBeGreaterThan(100);
    expect(step.toLowerCase()).toContain("chrome");
  });
});
