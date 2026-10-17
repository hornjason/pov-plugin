/**
 * Proves the PII scan can fail. Covers ISC-21.
 *
 * A scan that returns "clean" is indistinguishable from a scan that never
 * looked. So every pattern is planted and observed being caught, and the scan
 * function itself is mutated to `return []` and observed going quiet over the
 * same input. Without the second half, a scan broken by a future refactor would
 * keep reporting an empty violation list and keep passing.
 *
 * Since the split into structural and identity patterns, there are two halves
 * to prove rather than one, and they fail for different reasons: the structural
 * half can go blind, and the identity half can go ABSENT. A missing identity
 * list is the more dangerous of the two, because it produces a shorter
 * violation list rather than an error, so it has its own cases below.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import {
  piiViolations,
  repoFiles,
  structuralPatterns,
  identityPatterns,
  loadIdentityList,
  identityRefusal,
  IDENTITY_FILE,
} from "./pov-plugin.test";

const SOURCE = resolve(import.meta.dir, "pov-plugin.test.ts");
const BINDING =
  "export function piiViolations(files: string[], root: string, patterns: Pattern[]): string[] {";

const temps: string[] = [];
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "pov-pii-"));
  temps.push(dir);
  return dir;
}
afterAll(() => temps.forEach(d => rmSync(d, { recursive: true, force: true })));

/**
 * The identity list these fixtures are scanned against. Fictional, and
 * deliberately NOT the repo's real list — a battery that plants a real name
 * commits that name, which is the leak this file guards against, performed by
 * the test that guards against it.
 */
const FIXTURE_LIST = { identities: ["Initech", "Globex Corporation"], trackers: ["acme/internal-tracker"] };

function allPatterns() {
  return [...structuralPatterns(), ...identityPatterns(FIXTURE_LIST)];
}

/**
 * One planted file per pattern the scan claims to catch.
 *
 * Every value here is synthetic. Planting a REAL id to prove the scan catches
 * real ids would put that id in the repo permanently. The patterns are
 * shape-matchers for the structural half and exact names for the identity
 * half, so a shape-correct fake exercises both identically.
 */
const PLANTED: Array<[name: string, content: string, expected: string]> = [
  ["linkedin url", "Persona: https://linkedin.com/in/not-a-real-handle/", "real LinkedIn profile URL"],
  ["drive id", "File ID: 1AbCdEfGhIjKlMnOpQrStUvWxYz0123456", "Google Drive file or folder ID"],
  [
    "google doc id",
    "See docs.google.com/document/d/0ZyXwVuTsRqPoNmLkJiHgFeDcBa98765",
    "Google Docs document ID",
  ],
  ["named customer", "The Initech account is cloud-first.", "named real customer"],
  ["multi-word customer", "Globex Corporation is consolidating two platforms.", "named real customer"],
  ["corporate email domain", "Contact: someone.else@initech.com for access.", "real email address"],
  ["internal issue", "Tracked at acme/internal-tracker#9999", "internal issue reference"],
  ["arbitrary real email", "Reach me at first.last@some-company.co.uk anytime.", "real email address"],
];

describe("The PII scan is load-bearing", () => {
  /**
   * Each case asserts WHICH pattern fired, not merely that something did.
   *
   * `length > 0` was the original assertion and it was vacuous for at least
   * one row: `\bInitech\b` matches inside `someone@initech.com`, so the
   * email case was satisfied by the name pattern and deleting email handling
   * altogether left it green. Naming the expected label is what makes each
   * row a test of its own pattern instead of a test of the union.
   */
  for (const [name, content, expected] of PLANTED) {
    test(`MUT-1 (${name}): planting it is caught, and by the right pattern`, () => {
      const dir = scratch();
      writeFileSync(join(dir, "planted.md"), content);
      const found = piiViolations(repoFiles(dir), dir, allPatterns());
      expect(found.length).toBeGreaterThan(0);
      expect(found.some(v => v.includes(expected))).toBe(true);
    });
  }

  test("MUT-2: clean content produces no violations", () => {
    const dir = scratch();
    writeFileSync(join(dir, "clean.md"), "Northwind Logistics is consolidating two platforms.");
    expect(piiViolations(repoFiles(dir), dir, allPatterns())).toEqual([]);
  });

  test("MUT-3: the binding appears exactly once, so it cannot be bypassed", () => {
    const src = readFileSync(SOURCE, "utf-8");
    const count = src.split(BINDING).length - 1;
    expect(count).toBe(1);
  });

  test("MUT-4: short-circuiting the scan makes planted data pass unnoticed", async () => {
    const src = readFileSync(SOURCE, "utf-8");
    expect(src).toContain(BINDING);
    const mutated = src.replace(BINDING, `${BINDING}\n  return [];`);

    const dir = scratch();
    const mutantPath = join(dir, "mutant.ts");
    // Strip the describe blocks: we want the function, not a nested suite run.
    writeFileSync(mutantPath, mutated.replace(/\ndescribe\([\s\S]*$/, "\n"));

    const mutant = await import(mutantPath);
    const planted = scratch();
    writeFileSync(join(planted, "planted.md"), "someone.else@initech.com and Initech");

    // The real scan catches it...
    expect(piiViolations(repoFiles(planted), planted, allPatterns()).length).toBeGreaterThan(0);
    // ...and the mutant does not. That gap is the proof.
    expect(mutant.piiViolations(repoFiles(planted), planted, allPatterns())).toEqual([]);
  });

  /**
   * The reserved-domain exemption is the one place in the structural half that
   * is allowed to say "not a finding", so it is the one place a widening would
   * go unnoticed. Both directions are asserted.
   */
  test("MUT-5: documentation domains are exempt and real ones are not", () => {
    const scan = (text: string) => {
      const dir = scratch();
      writeFileSync(join(dir, "probe.md"), text);
      return piiViolations(repoFiles(dir), dir, structuralPatterns());
    };
    expect(scan("write to someone@example.com")).toEqual([]);
    expect(scan("write to someone@example.org")).toEqual([]);
    expect(scan("write to someone@notexample.com")[0]).toContain("someone@notexample.com");
    // A subdomain of a reserved domain is NOT reserved — mail.example.com is a
    // real deliverable host, and treating the reserved name as a SUFFIX rather
    // than as the whole domain is the widening this case exists to catch.
    expect(scan("write to someone@mail.example.com")[0]).toContain("someone@mail.example.com");
    // A package specifier is `local-part@dotted-labels` and matches an email
    // shape exactly. Requiring an alphabetic TLD is what separates them, and
    // without this case that requirement could be dropped silently — a
    // lockfile is a tracked file, so the cost would be 27 false positives and
    // a gate nobody trusts.
    expect(scan("depends on rungate@0.4.1 and bun@1.4.3")).toEqual([]);
  });

  /**
   * An absent identity list is the failure mode that produces a SHORTER
   * violation list rather than an error, so nothing downstream can see it.
   */
  test("MUT-6: an absent identity list is reported as absent, not as empty", () => {
    const dir = scratch();
    const load = loadIdentityList(dir);
    expect(load.status).toBe("absent");
  });

  /**
   * The refusal itself, driven. Every other case in this file and the gate it
   * tests runs with the repo's own identity list present, so without this the
   * branch that fires on a machine WITHOUT one is unreachable — and that is
   * the only machine where it matters.
   */
  test("MUT-6b: an absent list produces a refusal, a present one produces none", () => {
    const dir = scratch();
    const absent = identityRefusal(loadIdentityList(dir));
    expect(absent).toBeTruthy();
    expect(absent).toContain("UNMEASURED");
    // It has to name the path, or the reader cannot act on it.
    expect(absent).toContain(IDENTITY_FILE);

    writeFileSync(join(dir, IDENTITY_FILE), JSON.stringify(FIXTURE_LIST));
    expect(identityRefusal(loadIdentityList(dir))).toBeNull();
  });

  test("MUT-7: an identity list with no names is refused rather than used", () => {
    const dir = scratch();
    writeFileSync(join(dir, IDENTITY_FILE), JSON.stringify({ identities: [], trackers: [] }));
    expect(() => loadIdentityList(dir)).toThrow(/carries no identities/);
  });

  /**
   * A renamed or mistyped key is the quiet version of an absent file: the
   * JSON parses, the load succeeds, and that half of the gate scans for
   * nothing. `trackers` is the one that matters — misspell it and internal
   * issue references stop being checked with nothing anywhere saying so,
   * because unlike `identities` there is no downstream emptiness check to
   * trip over.
   */
  for (const [key, bad] of [
    ["identities", { identitys: ["Initech"], trackers: [] }],
    ["trackers", { identities: ["Initech"], trackerz: [] }],
    ["identities", { identities: "Initech", trackers: [] }],
  ] as Array<[string, unknown]>) {
    test(`MUT-7b (${key}): a missing or mistyped key is refused, not read as empty`, () => {
      const dir = scratch();
      writeFileSync(join(dir, IDENTITY_FILE), JSON.stringify(bad));
      expect(() => loadIdentityList(dir)).toThrow(/UNMEASURED/);
    });
  }

  /**
   * The scan opens every tracked file now, so it has to survive one that is
   * not text. A NUL-bearing file is skipped by content rather than by name,
   * because the extension denylist cannot know about a format nobody has
   * added to it — the same blindness the old extension ALLOWLIST had.
   */
  test("MUT-10b: a binary file is skipped by content, and a text one beside it is not", () => {
    const dir = scratch();
    writeFileSync(join(dir, "blob.dat"), Buffer.from([0x50, 0x00, 0x4b, 0x01, 0x02]));
    writeFileSync(join(dir, "note.md"), "The Initech account is cloud-first.");
    const scanned = repoFiles(dir).map(f => f.replace(`${dir}/`, ""));
    expect(scanned).toContain("note.md");
    expect(scanned).not.toContain("blob.dat");
    // ...and the text file beside it is still caught, so "skipped the binary"
    // cannot be satisfied by scanning nothing at all.
    expect(piiViolations(repoFiles(dir), dir, allPatterns()).length).toBeGreaterThan(0);
  });

  test("MUT-8: a present list is read back with its names intact", () => {
    const dir = scratch();
    writeFileSync(join(dir, IDENTITY_FILE), JSON.stringify(FIXTURE_LIST));
    const load = loadIdentityList(dir);
    expect(load.status).toBe("present");
    if (load.status !== "present") return;
    expect(load.list.identities).toEqual(FIXTURE_LIST.identities);
    expect(load.list.trackers).toEqual(FIXTURE_LIST.trackers);
  });

  /**
   * Dropping the identity patterns entirely is the shape of "the local file
   * went missing on this machine" — the structural half still runs, still
   * reports clean, and the suite stays green over a planted customer name.
   * This is the case that makes IDENT-1's refusal load-bearing.
   */
  test("MUT-9: with only the structural half, a planted customer name goes unnoticed", () => {
    const dir = scratch();
    writeFileSync(join(dir, "planted.md"), "The Initech account is cloud-first.");
    expect(piiViolations(repoFiles(dir), dir, structuralPatterns())).toEqual([]);
    expect(piiViolations(repoFiles(dir), dir, allPatterns()).length).toBeGreaterThan(0);
  });

  /**
   * repoFiles has two branches and the git one is the one that runs in anger.
   * A scratch directory is not a repo, so every other case here exercises the
   * walk; without this, the branch that decides what actually gets published
   * would be untested.
   */
  test("MUT-10: inside a git repo only tracked files are scanned", () => {
    const dir = scratch();
    mkdirSync(join(dir, ".git"), { recursive: true });
    rmSync(join(dir, ".git"), { recursive: true, force: true });
    const { execFileSync } = require("child_process");
    execFileSync("git", ["-C", dir, "init", "-q"]);
    execFileSync("git", ["-C", dir, "config", "user.email", "t@example.com"]);
    execFileSync("git", ["-C", dir, "config", "user.name", "t"]);
    writeFileSync(join(dir, "tracked.md"), "clean");
    writeFileSync(join(dir, "untracked.md"), "The Initech account is cloud-first.");
    execFileSync("git", ["-C", dir, "add", "tracked.md"]);

    const scanned = repoFiles(dir).map(f => f.replace(`${dir}/`, ""));
    expect(scanned).toContain("tracked.md");
    // The untracked file holds a planted name and must NOT be scanned, because
    // it is not what a clone receives.
    expect(scanned).not.toContain("untracked.md");
    expect(piiViolations(repoFiles(dir), dir, allPatterns())).toEqual([]);
  });
});
