/**
 * The shipped one-pager template. Covers claim 3 — two POVs for two customers
 * look like the same product.
 *
 * Claim 3's own wording is what this file is written against: *"Consistency is
 * not 'both satisfy rule 24.' Two documents can each honour 'whitespace is
 * functional' and share no visual DNA. The output has to come from a template
 * that ships in the repo, not from the model's taste on the day."*
 *
 * So existence is not the assertion. TPL-5 is: the worked example and the
 * shipped template carry the SAME stylesheet, byte for byte. A repo whose own
 * two artifacts have drifted apart cannot claim that two generated POVs will
 * not, and that drift is silent — both files keep rendering, both keep looking
 * fine on their own, and nothing but a comparison says they stopped matching.
 *
 * What this file does NOT claim: that two generated POVs actually look alike.
 * That needs two renders and a human, which SUCCESS.md says plainly and which
 * no assertion here substitutes for.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const TEMPLATE_PATH = join(ROOT, "templates", "one-pager.html.tmpl");
const EXAMPLE_PATH = join(ROOT, "examples", "northwind-logistics", "one-pager.html");
const SKILL = readFileSync(join(ROOT, "skills", "pov", "SKILL.md"), "utf-8");
const README = readFileSync(join(ROOT, "README.md"), "utf-8");

const OVERRIDE_ENV = "POV_TEMPLATE_PATH";

function styleBlock(html: string): string {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1].trim() : "";
}

function section(doc: string, startsWith: string, stopsAt: RegExp): string {
  const start = doc.indexOf(startsWith);
  if (start === -1) return "";
  const rest = doc.slice(start + startsWith.length);
  const end = rest.search(stopsAt);
  return end === -1 ? rest : rest.slice(0, end);
}

describe("A one-pager template ships", () => {
  test("TPL-1: the template exists and carries a stylesheet", () => {
    expect(existsSync(TEMPLATE_PATH)).toBe(true);
    const css = styleBlock(readFileSync(TEMPLATE_PATH, "utf-8"));
    // Non-empty asserted explicitly: an empty slice contains nothing, and
    // "contains nothing" passes every `not.toContain` written below it.
    expect(css.length).toBeGreaterThan(400);
  });

  test("TPL-2: the template is a template — every slot is an unfilled placeholder", () => {
    const tmpl = readFileSync(TEMPLATE_PATH, "utf-8");
    const slots = [...tmpl.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map(m => m[1]);
    expect(slots.length).toBeGreaterThan(8);
    // The elements claim 3 and rules 21/32/33 make load-bearing, by name.
    for (const required of ["CUSTOMER_NAME", "HEADLINE", "CONVERGENCE_THESIS", "BRIDGE_MIDDLE", "TRADEOFF", "CTA"]) {
      expect(slots).toContain(required);
    }
  });

  test("TPL-3: the template names no customer, real or fictional", () => {
    const tmpl = readFileSync(TEMPLATE_PATH, "utf-8");
    // Northwind is the worked example's company. Finding it here would mean
    // the template was copied from a filled-in document and a stale name is
    // one un-replaced placeholder away from shipping to someone else.
    expect(tmpl).not.toMatch(/Northwind/i);
  });

  test("TPL-4: the skill reads the template and offers the override", () => {
    const step = section(SKILL, "### 6. Generate the one-pager", /\n### /);
    expect(step.length).toBeGreaterThan(300);
    expect(step).toContain("${CLAUDE_PLUGIN_ROOT}/templates/one-pager.html.tmpl");
    expect(step).toContain(OVERRIDE_ENV);
    // The instruction that does the work is the prohibition. "Start from the
    // template" is advice; "do not change the CSS" is the rule that keeps two
    // POVs matching when the model has an opinion about the colour.
    expect(step).toMatch(/do not change the css/i);
  });

  test("TPL-5: the worked example and the template share one stylesheet", () => {
    const templateCss = styleBlock(readFileSync(TEMPLATE_PATH, "utf-8"));
    const exampleCss = styleBlock(readFileSync(EXAMPLE_PATH, "utf-8"));
    expect(exampleCss.length).toBeGreaterThan(400);
    // This is the claim-3 assertion. If these drift, the repo's own two
    // artifacts no longer look like the same product, and nothing else in
    // the suite would notice.
    expect(exampleCss).toEqual(templateCss);
  });

  test("TPL-6: the example and the template share a section order", () => {
    const headings = (html: string) => [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m => m[1].trim());
    const fromTemplate = headings(readFileSync(TEMPLATE_PATH, "utf-8"));
    const fromExample = headings(readFileSync(EXAMPLE_PATH, "utf-8"));
    expect(fromTemplate.length).toBeGreaterThan(2);
    // Section ORDER, not merely the set — claim 3 names "different section
    // order" as one of the four ways the look comes apart.
    expect(fromExample).toEqual(fromTemplate);
  });

  test("TPL-7: the override is documented where a user would look for it", () => {
    expect(README).toContain(OVERRIDE_ENV);
    const how = section(README, "## Changing how the one-pager looks", /\n## /);
    expect(how.length).toBeGreaterThan(150);
    // A reader who copies the template has to be told the slot names matter,
    // or their copy silently stops being fillable.
    expect(how).toMatch(/\{\{PLACEHOLDER\}\}|placeholder/i);
  });
});
