/**
 * The dashboard discovery contract, asserted across the three documents that
 * state it. Covers claim 2 (it runs end to end) and the second row of claim 4
 * (several dashboards running -> ask, never guess).
 *
 * ## Why a test over prose is worth writing here
 *
 * This plugin ships zero executable surface, so the discovery logic IS the
 * prose — there is no function to unit-test. What there is instead is a
 * cross-document invariant with a real way to go wrong: the port is stated in
 * SKILL.md, in references/dashboard-api.md and in README.md, and a change to
 * one of them is exactly the kind of edit that leaves the other two behind.
 *
 * That is not hypothetical here either. All three said `3000` until
 * 2026-10-17, and the dashboard has never listened on `3000` — SUCCESS.md
 * carried "Port documented as 3000; it is 7777" as a known blocker on claim 2
 * while the three documents went on agreeing with each other and being wrong.
 * An agreement check alone would have been green that whole time, which is
 * why PORTS-1 below pins the actual numbers and not merely their consistency.
 *
 * Per `.claude/rules/checks-must-be-able-to-fail.md`: every assertion here
 * slices the section it is about out of the document first and asserts the
 * slice is non-empty, because a claim scoped to one section and asserted
 * against the whole file is satisfied by a match anywhere in it — and these
 * files discuss ports in several places.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const SKILL = readFileSync(join(ROOT, "skills", "pov", "SKILL.md"), "utf-8");
const API = readFileSync(join(ROOT, "skills", "pov", "references", "dashboard-api.md"), "utf-8");
const README = readFileSync(join(ROOT, "README.md"), "utf-8");

const DASHBOARD_PORT = "7777";
const TEST_DASHBOARD_PORT = "7776";

/**
 * Cuts a section out of a markdown document by heading.
 *
 * Returns the empty string when the heading is gone, and every caller asserts
 * non-empty before asserting anything else — a slice that failed to find its
 * own section contains nothing, and "contains nothing" is indistinguishable
 * from "contains no violation".
 */
function section(doc: string, startsWith: string, stopsAt: RegExp): string {
  const start = doc.indexOf(startsWith);
  if (start === -1) return "";
  const rest = doc.slice(start + startsWith.length);
  const end = rest.search(stopsAt);
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * Every four-digit port in a chunk of text, whether written as part of a URL
 * (`:7777`) or quoted on its own in a table (`` `7777` ``). Both forms appear
 * in these documents and an earlier version of this helper only knew the
 * first, which made every port set come back empty — and an empty set
 * compared against another empty set is the vacuous assertion this file's
 * own header warns about.
 */
function portsIn(text: string): Set<string> {
  return new Set([...text.matchAll(/[:`](\d{4})\b/g)].map(m => m[1]));
}

describe("Dashboard discovery is stated consistently", () => {
  test("PORTS-1: the dashboard port is 7777 and the test port is 7776", () => {
    // Pinned, not merely cross-checked. Three documents agreed on 3000 for
    // the life of this repo and all three were wrong, so consistency alone
    // is not evidence of correctness.
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    expect(step.length).toBeGreaterThan(200);
    expect(portsIn(step)).toEqual(new Set([DASHBOARD_PORT, TEST_DASHBOARD_PORT]));
  });

  test("PORTS-2: the API reference names the same ports as the skill", () => {
    const resolution = section(API, "**Base URL resolution:**", /\n## /);
    expect(resolution.length).toBeGreaterThan(200);
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    expect(portsIn(resolution)).toEqual(portsIn(step));
  });

  test("PORTS-3: no tracked document still points at the old port", () => {
    for (const [name, doc] of [["SKILL.md", SKILL], ["dashboard-api.md", API], ["README.md", README]] as const) {
      // Scoped to a URL or port position so that prose about the number
      // elsewhere would not fail this, and a real `localhost:3000` would.
      expect(doc).not.toMatch(/localhost:3000|127\.0\.0\.1:3000|:3000\b/);
      expect(name).toBeTruthy();
    }
  });

  test("DISC-1: the test dashboard is labelled as the test one wherever it appears", () => {
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    expect(step).toContain(TEST_DASHBOARD_PORT);
    // The number alone is not a warning. The row that names it has to say
    // what it is, or a reader picking from a list has nothing to pick on.
    const portLine = step.split("\n").find(l => l.includes(TEST_DASHBOARD_PORT) && l.includes("|"));
    expect(portLine).toBeDefined();
    expect(portLine!.toLowerCase()).toContain("test");
  });

  test("DISC-2: container discovery is offered and explained", () => {
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    expect(step).toContain("host.docker.internal");
    expect(section(API, "**Base URL resolution:**", /\n## /)).toContain("host.docker.internal");
  });

  test("DISC-3: zero dashboards is a refusal that names what was tried", () => {
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    const none = section(step, "**None.**", /\n\*\*Exactly one/);
    expect(none.length).toBeGreaterThan(80);
    expect(none.toLowerCase()).toContain("every");
    expect(none.toLowerCase()).toContain("url");
  });

  test("DISC-4: several dashboards is a question, and the skill is told not to pick", () => {
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    const many = section(step, "**More than one.**", /\nThis refusal/);
    expect(many.length).toBeGreaterThan(80);
    expect(many.toLowerCase()).toContain("ask");
    // The instruction that does the work is the prohibition, not the request.
    // "Ask which" alone is advice an agent weighs against being helpful.
    expect(many).toMatch(/do not pick/i);
  });

  test("DISC-5: an explicit POV_DASHBOARD_URL disables discovery rather than seeding it", () => {
    const step = section(SKILL, "### 1. Find the dashboard, or refuse", /\n### /);
    const explicit = section(step, "**If `POV_DASHBOARD_URL` is set", /\nOtherwise/);
    expect(explicit.length).toBeGreaterThan(40);
    // The failure mode this forbids: an explicit URL that does not answer,
    // followed by a silent probe that finds the test dashboard instead.
    expect(explicit.toLowerCase()).toContain("refusal");
  });

  test("DISC-6: the README tells the reader the same thing as the skill", () => {
    const req = section(README, "## Requirements", /\n## /);
    expect(req.length).toBeGreaterThan(200);
    expect(portsIn(req)).toEqual(new Set([DASHBOARD_PORT, TEST_DASHBOARD_PORT]));
    expect(req).toContain("host.docker.internal");
    expect(req.toLowerCase()).toContain("asks which");
  });
});
