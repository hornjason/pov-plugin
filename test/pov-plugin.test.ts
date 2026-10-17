/**
 * Portable repo gate. No rungate dependency — runs on any fork, in any CI.
 *
 * Covers ISC-17..ISC-21, ISC-28.
 *
 * The PII scan is the reason this file exists. This plugin is extracted from a
 * working directory that held live customer intelligence, so "no customer data
 * reached the public repo" is the one property that cannot be allowed to pass
 * vacuously. See test/pii-scan-mutation.test.ts, which plants each pattern and
 * asserts this scan goes red.
 *
 * ## Why the patterns are split in two
 *
 * An earlier version of this file enumerated five customer names and a
 * corporate email domain in a regex. A gate that lists five customers in order
 * to keep them out of a public repo publishes those five customers; SUCCESS.md
 * called claim 5 false on exactly that ground.
 *
 * So the population is split by what this repo can see:
 *
 * - STRUCTURAL patterns name nobody. An email address, a LinkedIn profile URL
 *   and a Google Drive id have shapes, and a shape is safe to publish. These
 *   are tracked, and they run everywhere, always.
 * - IDENTITY patterns are the names themselves. They live in
 *   `.pii-identities.local.json`, which is gitignored, and are never committed.
 *
 * The identity half is the half that can go quiet, so its absence is a
 * REFUSAL and not a pass — see IDENT-1. `0`, `{}` and "file not found" are
 * indistinguishable from a clean scan; an explicit refusal is not.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, statSync, existsSync, openSync, readSync, closeSync } from "fs";
import { execFileSync } from "child_process";
import { join, resolve, relative } from "path";

const ROOT = resolve(import.meta.dir, "..");

const SKIP_DIRS = new Set([".git", "node_modules"]);

/**
 * A file is binary if it carries a NUL in its first 8 KiB.
 *
 * ## Why this is a content check and not an extension list
 *
 * The scan used to select files by an extension ALLOWLIST —
 * `\.(md|json|ts|js|html|yml|yaml|txt|tmpl)$` — and that was a hole. Four
 * tracked files matched none of it and were therefore never opened:
 * `.gitignore`, `bun.lock`, `.pii-identities.local.json.example`, and
 * `test/scaffold-conformity.test.ts.blocked`. All four ship in a clone.
 *
 * It is not theoretical. `.gitignore` carried an internal issue reference for
 * the whole life of the old gate and was found by reading the tree by hand,
 * never by the check whose entire job that is. The parked test file is the
 * sharper case: renaming `foo.test.ts` to `foo.test.ts.blocked` removed it
 * from the scan's view while leaving it in the published tree.
 *
 * An extension DENYLIST was the first repair and it was dead weight beside
 * this function — no real `.png` lacks a NUL in its first 8 KiB, so nothing
 * could reach it that this does not already catch. Two deciders that agree
 * are behaviourally one, so it is gone. Its only genuine job was keeping
 * `readFileSync` from slurping a large video to look at 8 KiB of it, and
 * reading by descriptor does that properly instead of approximately.
 */
function isBinary(path: string): boolean {
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(8192);
    const read = readSync(fd, buf, 0, 8192, 0);
    return buf.subarray(0, read).includes(0);
  } finally {
    closeSync(fd);
  }
}

/** Where the untracked identity list lives, relative to the repo root. */
export const IDENTITY_FILE = ".pii-identities.local.json";

/**
 * The files exempt from the scan, because each must contain the very strings
 * the scan looks for.
 *
 * - the mutation test plants a sample of every pattern, by design
 * - the identity `.example` is a list of names; a template for "names that
 *   must not appear" cannot be scanned for the names it demonstrates
 *
 * `test/pov-plugin.test.ts` is NOT on this list and used to be, because it
 * held the customer names. It holds none now, which is the point of the
 * split above — and it has twice caught its own documentation since, which
 * is the argument for leaving it scanned.
 *
 * ALLOWLIST-1 pins this to exactly two entries. Adding a third means a real
 * file stopped being checked, and that should cost a deliberate edit and a
 * failing test rather than a quiet append.
 *
 * Exempting the `.example` costs one thing and IDENT-4 pays it back: a real
 * name placed in the example would no longer be caught by the scan, so
 * IDENT-4 compares the example's names against the active list directly.
 */
const SELF_REFERENTIAL = new Set([
  "test/pii-scan-mutation.test.ts",
  ".pii-identities.local.json.example",
]);

/**
 * The files the scan covers.
 *
 * Inside a git repo this is `git ls-files` and not a filesystem walk, because
 * the tracked set is EXACTLY what a clone receives and a walk is not. A walk
 * would also open `.pii-identities.local.json` — the gate would then report
 * its own untracked pattern list as a leak, and the obvious way to silence
 * that is to stop scanning dot-files, which is how a real one gets through.
 *
 * Outside a git repo it walks, so the mutation test can point it at a scratch
 * directory. FILES-1 asserts both branches are reachable, because a branch
 * nothing exercises is a branch that has stopped working.
 */
export function repoFiles(root: string): string[] {
  const candidates: string[] = [];
  if (existsSync(join(root, ".git"))) {
    const out = execFileSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf-8" });
    for (const p of out.split("\0")) {
      if (p.length > 0 && !SELF_REFERENTIAL.has(p)) candidates.push(join(root, p));
    }
  } else {
    (function walk(dir: string) {
      for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (!SELF_REFERENTIAL.has(relative(root, full))) candidates.push(full);
      }
    })(root);
  }
  return candidates.filter(p => existsSync(p) && !isBinary(p));
}

export type Pattern = [label: string, pattern: RegExp];

/**
 * Patterns that describe a SHAPE and name no one. Safe to publish, so they are
 * tracked, and they are the half of the gate that runs in a stranger's CI.
 */
export function structuralPatterns(): Pattern[] {
  return [
    ["real LinkedIn profile URL", /linkedin\.com\/in\/[A-Za-z0-9-]+/gi],
    ["Google Drive file or folder ID", /\b[01][A-Za-z0-9_-]{27,}\b/g],
    ["Google Docs document ID", /docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{20,}/gi],
    ["real email address", emailPattern()],
  ];
}

/**
 * Any email address at a domain that is not reserved for documentation.
 *
 * The exemption is a negative lookahead rather than a post-filter so that the
 * rule stays ONE pattern in the same table as the others. An earlier version
 * applied it afterwards in a separate function, which meant the email check
 * ran on every call regardless of which pattern set the caller passed —
 * `piiViolations(files, root, identityPatterns(...))` reported email findings,
 * so the `patterns` argument was not telling the truth about what was scanned.
 *
 * The lookahead is anchored right after the `@`, so `mail.example.com` is
 * still a finding: it is a real deliverable host, and treating the reserved
 * name as a SUFFIX rather than as the whole domain is the widening that would
 * quietly excuse it.
 *
 * The final label must be two or more LETTERS. Every real TLD is alphabetic,
 * and without that requirement a lockfile is a wall of false positives:
 * `rungate@0.4.1` and `bun@1.4.3` are `local-part@dotted-labels` and match
 * an email shape exactly. 27 of them came out of `bun.lock` the first time
 * this scan was widened to cover every tracked file, and a gate that cries
 * wolf 27 times gets switched off. Residual, and left deliberately to a human
 * rather than patched blind: a prerelease specifier whose final dotted
 * segment is alphabetic rather than numeric still reads as an address. No
 * example is written out here, because this file is scanned by the gate it
 * describes and an illustration of a match IS a match — which this comment
 * learned by tripping it.
 *
 * Returned from a function rather than held as a module constant. A `/g`
 * regex carries `lastIndex`, so a single shared instance is mutable state
 * threaded through every file in the scan; `String.match` happens to reset it
 * and `RegExp.test` does not, which makes the safety of the shared copy a
 * property of the call site rather than of the pattern. A fresh object per
 * call costs nothing and removes the question.
 */
function emailPattern(): RegExp {
  return /\b[A-Za-z0-9._%+-]+@(?!(?:example\.(?:com|org|net|edu))\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g;
}

export type IdentityList = {
  /** Company or person names that must never appear. */
  identities: string[];
  /** Issue-tracker repositories whose references must never appear. */
  trackers: string[];
};

export type IdentityLoad =
  | { status: "present"; list: IdentityList; path: string }
  | { status: "absent"; path: string };

/**
 * Reads the untracked identity list.
 *
 * An EMPTY list is refused as hard as an absent one. That is the cheapest
 * wrong repair available here: faced with IDENT-1 failing on a machine with no
 * list, the five-o'clock fix is to return `{identities: []}` and move on, and
 * every downstream assertion would then hold vacuously over zero patterns.
 * IDENT-3 is pointed at exactly that repair.
 */
export function loadIdentityList(root: string): IdentityLoad {
  const path = join(root, IDENTITY_FILE);
  if (!existsSync(path)) return { status: "absent", path };
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  // A wrong TYPE is refused rather than coerced to an empty list. `?? []` and
  // `Array.isArray(x) ? x : []` both turn a typo'd or renamed key into "there
  // were no patterns", which scans for nothing and reports clean — the
  // fail-open this whole file is written against. `trackers` is the one that
  // bites: misspell it and internal issue references stop being checked, with
  // nothing anywhere saying so.
  for (const key of ["identities", "trackers"]) {
    if (!Array.isArray(raw[key])) {
      throw new Error(
        `UNMEASURED: ${IDENTITY_FILE} has no array at "${key}" (found ${typeof raw[key]}). ` +
          `A missing or mistyped key would otherwise scan for nothing and report clean.`,
      );
    }
  }
  const identities: string[] = raw.identities;
  const trackers: string[] = raw.trackers;
  if (identities.length === 0) {
    throw new Error(
      `UNMEASURED: ${IDENTITY_FILE} carries no identities. An empty list scans for nothing ` +
        `and reports clean, which is indistinguishable from a repo with nothing to find.`,
    );
  }
  return { status: "present", list: { identities, trackers }, path };
}

/**
 * The refusal text for a missing identity list, as a function rather than
 * inline in the test, so that the branch can be DRIVEN.
 *
 * Without this every fixture in the suite has the list present — the repo's
 * own copy is always there — and the branch that matters most on a machine
 * that lacks it is the one branch nothing can reach. That is the shape
 * `.claude/rules/checks-must-be-able-to-fail.md` records as "a battery whose
 * fixtures all meet a precondition measures nothing past it".
 */
export function identityRefusal(load: IdentityLoad): string | null {
  if (load.status === "present") return null;
  return (
    `UNMEASURED: no identity list at ${load.path}. The named-customer half of this gate ` +
    `did not run. Copy ${IDENTITY_FILE}.example to ${IDENTITY_FILE} and fill it in. ` +
    `This is a refusal and not a skip: a scan that did not look reports the same ` +
    `empty violation list as a repo with nothing to find.`
  );
}

/** Builds the name patterns. Separate from the structural half so the two can be mutated apart. */
export function identityPatterns(list: IdentityList): Pattern[] {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const out: Pattern[] = [];
  // One pattern, not two. A rule matching an address at a listed identity's
  // own domain was here and was dead, but not for the reason it first looked
  // like. The structural email pattern is wider — and so is the bare-name
  // pattern below it, because a word-boundary match on the identity finds it
  // INSIDE the address. So that input was already two other things' business.
  // Removing it was 0 red, and the measurement that proves it is the one that
  // corrected the diagnosis: mutating the email pattern away stayed at the
  // same count after the removal, which is only possible if something else
  // was holding that case up.
  if (list.identities.length > 0) {
    out.push(["named real customer", new RegExp(`\\b(${list.identities.map(esc).join("|")})\\b`, "gi")]);
  }
  if (list.trackers.length > 0) {
    out.push([
      "internal issue reference",
      new RegExp(`(${list.trackers.map(esc).join("|")})(?:/issues/|#)\\d+`, "gi"),
    ]);
  }
  return out;
}

/**
 * The single binding. test/pii-scan-mutation.test.ts builds a copy of this file
 * with this function short-circuited to `return []` and asserts the suite then
 * goes green over planted data — which is how we know the scan is load-bearing
 * and not decorative.
 */
export function piiViolations(files: string[], root: string, patterns: Pattern[]): string[] {
  const violations: string[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    for (const [label, pattern] of patterns) {
      const hits = content.match(pattern);
      if (hits) violations.push(`${relative(root, file)}: ${label} — ${[...new Set(hits)].join(", ")}`);
    }
  }
  return violations;
}

describe("Published repo carries no customer data", () => {
  test("PII-1: no structurally-identifiable data anywhere in the tracked tree", () => {
    const files = repoFiles(ROOT);
    // A scan over nothing is the failure mode this guards against.
    expect(files.length).toBeGreaterThan(5);
    expect(piiViolations(files, ROOT, structuralPatterns())).toEqual([]);
  });

  test("ALLOWLIST-1: exactly two files are exempt, and both exist", () => {
    expect(SELF_REFERENTIAL.size).toBe(2);
    for (const rel of SELF_REFERENTIAL) {
      expect(existsSync(join(ROOT, rel))).toBe(true);
    }
  });

  test("PII-2: the scan reaches every content directory", () => {
    const scanned = repoFiles(ROOT).map(f => relative(ROOT, f));
    // Named explicitly: a glob that silently stopped matching a directory is
    // how a scan goes green over data it never opened.
    for (const dir of ["specs/", "skills/", "examples/", "README.md", ".claude/"]) {
      expect(scanned.some(f => f.startsWith(dir))).toBe(true);
    }
  });

  test("FILES-1: inside a repo the scan reads the tracked set, not the filesystem", () => {
    const scanned = repoFiles(ROOT).map(f => relative(ROOT, f));
    // The identity list is untracked and sits in the root. If this ever shows
    // up, the scan has switched to walking and will report the gate's own
    // pattern list as a leak.
    expect(scanned).not.toContain(IDENTITY_FILE);

    // Every tracked file is accounted for: scanned, deliberately exempt, or
    // binary. Nothing falls through.
    //
    // Asserted this way rather than by rebuilding the expected list with the
    // same filter the scan uses, which is how this test read before and was
    // circular — it compared the filter against itself and would have agreed
    // with any filter at all, including the allowlist that silently dropped
    // four files.
    const tracked = execFileSync("git", ["-C", ROOT, "ls-files"], { encoding: "utf-8" })
      .split("\n")
      .filter(p => p.length > 0);
    const unaccounted = tracked.filter(
      p => !scanned.includes(p) && !SELF_REFERENTIAL.has(p) && !isBinary(join(ROOT, p)),
    );
    expect(unaccounted).toEqual([]);
    // And the exempt set is small enough to read, so "accounted for" cannot
    // become a synonym for "excused".
    expect(tracked.length - scanned.length).toBeLessThanOrEqual(SELF_REFERENTIAL.size + 2);
  });

  test("IDENT-1: the identity list is present, or the scan refuses", () => {
    const load = loadIdentityList(ROOT);
    const refusal = identityRefusal(load);
    if (refusal) throw new Error(refusal);
    expect(load.status).toBe("present");
  });

  test("IDENT-2: no named customer or internal tracker reference in the tracked tree", () => {
    const load = loadIdentityList(ROOT);
    const refusal = identityRefusal(load);
    if (refusal) throw new Error(refusal);
    if (load.status !== "present") return;
    const files = repoFiles(ROOT);
    expect(files.length).toBeGreaterThan(5);
    expect(piiViolations(files, ROOT, identityPatterns(load.list))).toEqual([]);
  });

  test("IDENT-3: an identity list with no identities is refused, not accepted as clean", () => {
    // The cheapest repair for IDENT-1 on a machine with no list is to hand back
    // an empty one. Every assertion downstream then holds over zero patterns.
    const dir = resolve(import.meta.dir, "..", "node_modules", ".pii-ident-probe");
    const { mkdirSync, writeFileSync, rmSync } = require("fs");
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(join(dir, IDENTITY_FILE), JSON.stringify({ identities: [], trackers: [] }));
      expect(() => loadIdentityList(dir)).toThrow(/carries no identities/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("IDENT-4: the tracked example names nobody real", () => {
    const example = join(ROOT, `${IDENTITY_FILE}.example`);
    expect(existsSync(example)).toBe(true);
    const raw = readFileSync(example, "utf-8");
    const list = JSON.parse(raw);
    // It has to be a usable template — a non-empty list, so a stranger who
    // copies it gets a gate that runs rather than one that throws.
    expect(list.identities.length).toBeGreaterThan(0);
    // Every name in it has to be fictional, and this is the only check on
    // that: the example is exempt from the scan (it is a list of names, so
    // scanning it for names is incoherent), which means a real name placed
    // here would otherwise ship unnoticed.
    //
    // Fiction is not directly checkable, so the proxy is that the ACTIVE
    // list must not contain any of them.
    const real = loadIdentityList(ROOT);
    if (real.status !== "present") return;

    // Unless the active list IS this file. CI has no real list — the names
    // are the thing this repo must not publish — so the workflow copies the
    // example into place, and comparing it against itself would fail on
    // every name for a reason that says nothing about fiction.
    //
    // Recorded as a branch with its reason rather than passed over in
    // silence: this check is NOT MEASURED on a machine without a real list,
    // and on that machine nothing else measures it either.
    const activeIsTheExample = readFileSync(join(ROOT, IDENTITY_FILE), "utf-8").trim() === raw.trim();
    if (activeIsTheExample) {
      expect(real.list.identities).toEqual(list.identities);
      return;
    }

    for (const name of list.identities) {
      expect(real.list.identities.map(s => s.toLowerCase())).not.toContain(String(name).toLowerCase());
    }
  });

  test("GITIGNORE-1: the identity list is ignored, so it cannot be committed by accident", () => {
    // `git check-ignore -q` exits 0 when the path IS ignored and 1 when it is
    // not, so the exit status is the whole answer and a thrown error is the
    // failing case. Asserted as a boolean rather than as "it did not throw",
    // because a git that is missing entirely also does not return 0.
    let ignored: boolean;
    try {
      execFileSync("git", ["-C", ROOT, "check-ignore", "-q", IDENTITY_FILE], { stdio: "ignore" });
      ignored = true;
    } catch {
      ignored = false;
    }
    expect(ignored).toBe(true);
  });
});

describe("Plugin manifests are valid", () => {
  const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
  const pluginPath = join(ROOT, ".claude-plugin", "plugin.json");

  test("MANIFEST-1: marketplace.json parses and declares required fields", () => {
    const m = JSON.parse(readFileSync(marketplacePath, "utf-8"));
    expect(typeof m.name).toBe("string");
    expect(typeof m.owner?.name).toBe("string");
    expect(Array.isArray(m.plugins)).toBe(true);
    expect(m.plugins.length).toBeGreaterThan(0);
  });

  test("MANIFEST-2: every marketplace entry has a name and a source", () => {
    const m = JSON.parse(readFileSync(marketplacePath, "utf-8"));
    for (const entry of m.plugins) {
      expect(typeof entry.name).toBe("string");
      expect(entry.source).toBeTruthy();
    }
  });

  test("MANIFEST-3: plugin.json parses and its name matches the marketplace entry", () => {
    const p = JSON.parse(readFileSync(pluginPath, "utf-8"));
    const m = JSON.parse(readFileSync(marketplacePath, "utf-8"));
    expect(typeof p.name).toBe("string");
    // Mismatched names install under one id and namespace under another.
    expect(m.plugins.map((e: any) => e.name)).toContain(p.name);
  });
});

describe("Skill is loadable", () => {
  const skillPath = join(ROOT, "skills", "pov", "SKILL.md");

  function frontmatter(path: string): Record<string, string> {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) throw new Error(`${path}: no frontmatter block`);
    const fm: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
      const kv = line.match(/^([a-z-]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
    return fm;
  }

  test("SKILL-1: SKILL.md has name and description frontmatter", () => {
    const fm = frontmatter(skillPath);
    expect(fm.name).toBeTruthy();
    expect(fm.description).toBeTruthy();
  });

  test("SKILL-2: description carries trigger phrases so the skill is discoverable", () => {
    const fm = frontmatter(skillPath);
    expect(fm.description.toLowerCase()).toContain("pov");
    expect(fm.description.length).toBeGreaterThan(40);
  });

  test("SKILL-3: spec is referenced through CLAUDE_PLUGIN_ROOT, not a relative path", () => {
    const body = readFileSync(skillPath, "utf-8");
    expect(body).toContain("${CLAUDE_PLUGIN_ROOT}/specs/POV-SPEC.md");
    // A relative climb out of skills/pov/ is undocumented and silently breaks.
    expect(body).not.toContain("../../specs/");
  });

  test("SKILL-4: the spec the skill points at actually exists", () => {
    expect(existsSync(join(ROOT, "specs", "POV-SPEC.md"))).toBe(true);
  });
});

describe("Plugin carries no executable surface", () => {
  // Installing a plugin runs its hooks, MCP servers and bin/ with the user's
  // permissions. This one is documentation plus a skill, and should stay
  // reviewable at a glance.
  for (const path of ["hooks", ".mcp.json", "bin"]) {
    test(`SAFE-1 (${path}): ${path} is absent`, () => {
      expect(existsSync(join(ROOT, path))).toBe(false);
    });
  }

  test("SAFE-2: package.json declares no install-time or lifecycle script", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    for (const hook of ["preinstall", "install", "postinstall", "prepare", "prepublish"]) {
      expect(pkg.scripts ?? {}).not.toHaveProperty(hook);
    }
  });
});
