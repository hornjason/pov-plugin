/**
 * One page, rendered — not estimated.
 *
 * Rule 16 is the hardest constraint in the spec and until now it was the only
 * load-bearing one with nothing behind it. TPL-5 and TPL-6 pin the stylesheet
 * and the section order, so the two artifacts drift together; neither notices
 * when they drift together off the bottom of page one.
 *
 * That is not hypothetical. Adding the stat tiles, the path-forward list and
 * the signature block (#8) pushed the worked example to 1.11 pages, and every
 * test in this suite stayed green. The bug was found by rendering the file by
 * hand, which is exactly the review step a check is supposed to replace.
 *
 * ## Why this shells out to a browser instead of estimating
 *
 * A line-counting heuristic would be a detector narrower than what it detects:
 * it cannot see wrapping, the flex row, or the fact that a one-word-longer
 * heading costs a whole line. The thing being asserted IS the layout, so the
 * instrument has to be a layout engine.
 *
 * ## Why an absent browser reports UNMEASURED rather than passing
 *
 * Headless Chrome is not a dependency of this plugin and must not become one —
 * `no-executable-surface.md` is the reason the install is auditable. So on a
 * machine without a browser this case cannot run, and it says so in words.
 * A skip that reads as a pass is the failure mode this repo has recorded five
 * times; see `.claude/rules/checks-must-be-able-to-fail.md`.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const EXAMPLE_PATH = join(ROOT, "examples", "northwind-logistics", "one-pager.html");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((p): p is string => Boolean(p));

function findChrome(): string | null {
  return CHROME_CANDIDATES.find(p => existsSync(p)) ?? null;
}

/**
 * Page count from the PDF itself. Counting `/Type /Page` would also match
 * `/Type /Pages`, the node that holds the count rather than a page — the
 * negative lookahead is the difference between "2 pages" and "2 pages plus
 * the tree node", which is an off-by-one that always reads as a bleed.
 */
function pageCount(pdf: Buffer): number {
  return [...pdf.toString("latin1").matchAll(/\/Type\s*\/Page(?![sA-Za-z])/g)].length;
}

function renderPageCount(chrome: string, html: string): number {
  const dir = mkdtempSync(join(tmpdir(), "pov-onepage-"));
  try {
    const src = join(dir, "in.html");
    const out = join(dir, "out.pdf");
    writeFileSync(src, html);
    execFileSync(chrome, [
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${out}`,
      src,
    ], { stdio: "ignore", timeout: 60_000 });
    return pageCount(readFileSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("The shipped artifacts fit on one page", () => {
  const chrome = findChrome();
  const example = readFileSync(EXAMPLE_PATH, "utf-8");

  test("PAGE-0: the renderer is present, or this file reports UNMEASURED", () => {
    if (!chrome) {
      console.warn(
        "UNMEASURED PAGE-1/PAGE-2 (one-page render): no headless browser found. " +
        `Set CHROME_PATH, or install one of: ${CHROME_CANDIDATES.join(", ")}. ` +
        "This check did NOT run — it is not a pass.",
      );
    }
    // Asserting the branch rather than the browser. Without this the file is
    // silent about its own measurability on a machine that cannot run it.
    expect(typeof chrome === "string" || chrome === null).toBe(true);
  });

  test.skipIf(!chrome)("PAGE-1: the worked example renders to exactly one page", () => {
    expect(renderPageCount(chrome!, example)).toBe(1);
  });

  test.skipIf(!chrome)("PAGE-2: negative control — an overflowing example renders to two", () => {
    // Without this row, "always returns 1" and "the page fits" are the same
    // observation. The padding is added to the one element guaranteed to be
    // in flow, so the mutation cannot be absorbed by a flex row.
    const bloated = example.replace(
      "</body>",
      `<p>${"The page has to be able to overflow for PAGE-1 to mean anything. ".repeat(40)}</p></body>`,
    );
    expect(bloated).not.toEqual(example);
    expect(renderPageCount(chrome!, bloated)).toBeGreaterThan(1);
  });
});
