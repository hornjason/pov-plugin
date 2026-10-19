/**
 * `specs/POV-SPEC.md` is a DERIVED copy, and something has to say when it rots.
 *
 * This repo shipped the pre-#1568 spec for weeks — still claiming the
 * validated reference is a "~90 word" email with no stat tiles, against an
 * artifact that is 111 words with three attributed stat tiles on a 2.5-page
 * PDF. The correction landed in DailyBriefDashboard and nothing carried it
 * here, because nothing compared the two.
 *
 * #1568 found TWO copies, picked one, and retired the other to a stub reading
 * *"Two copies existed and had already drifted."* There were three. A
 * de-duplication is only as good as the inventory it was done against, which
 * is an argument for a check rather than for a tidier inventory.
 *
 * ## Two hashes, because they answer different questions
 *
 * | hash | catches | measurable |
 * |---|---|---|
 * | `body-sha256` | someone edited the derived copy by hand | **everywhere** |
 * | `source-sha256` | upstream moved and nobody re-synced | only beside a DDB checkout |
 *
 * The body hash is the one with teeth on a consumer machine, and it is the
 * half that would have caught a local "quick fix" to the spec. The source
 * hash is the half that catches the actual #1568 failure, and it cannot run
 * where the source is absent — so that case reports UNMEASURED in words
 * rather than passing silently, which is the fold this project's sibling repo
 * uses everywhere a three-state answer meets a two-state interface.
 */
import { describe, test, expect } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { CANONICAL_SPEC, DERIVED_SPEC, sha256, bodyOf, recordedHashes, DRIVE_ID_RE } from '../scripts/sync-spec.ts'
import { structuralPatterns } from './pov-plugin.test.ts'

/** The gate's own Drive rule, pulled from the gate rather than restated here. */
function driveIdGatePattern(): RegExp {
  const found = structuralPatterns().find(([label]) => /Drive/i.test(label))
  if (!found) throw new Error('the PII gate no longer has a Drive ID pattern to agree with')
  return found[1]
}

export type DriftStatus = 'in-sync' | 'drifted' | 'unmeasured'

/** Pure, so all three branches are exercised on every machine. */
export function specDriftStatus(
  derived: string,
  sourcePath: string,
  read: (p: string) => string | null,
): { status: DriftStatus; detail: string } {
  const recorded = recordedHashes(derived)
  if (!recorded.source) {
    return { status: 'drifted', detail: 'the derived copy records no source hash — it was not generated' }
  }
  const source = read(sourcePath)
  if (source === null) {
    return {
      status: 'unmeasured',
      detail: `UNMEASURED — the canonical spec is not on this machine (${sourcePath}); upstream drift was not checked`,
    }
  }
  const actual = sha256(source)
  return actual === recorded.source
    ? { status: 'in-sync', detail: 'the derived copy matches the canonical spec' }
    : {
        status: 'drifted',
        detail: `the canonical spec has moved (${actual.slice(0, 12)} vs recorded ${recorded.source.slice(0, 12)}) — run: bun scripts/sync-spec.ts`,
      }
}

const DERIVED = readFileSync(DERIVED_SPEC, 'utf-8')

describe('the derived copy has not been hand-edited', () => {
  // The half with teeth on every machine, including a consumer's.
  test('the body matches the hash recorded in its own banner', () => {
    const recorded = recordedHashes(DERIVED)
    // Narrowed with a throw rather than `expect(...).not.toBeNull()`, which
    // reads as a guard and narrows nothing — the assertion below it would
    // then compare a hash against `null` and fail with a message about
    // hashes when the real answer is that the banner has no hash in it.
    if (recorded.body === null) throw new Error('the banner records no body hash — it was not generated')
    expect(sha256(bodyOf(DERIVED))).toBe(recorded.body)
  })

  test('the banner says the file is derived and names the generator', () => {
    // Without this, the first person to hit a wrong line edits it here, the
    // hash check goes red, and the obvious way to make it green again is to
    // update the hash. The file has to say what to do instead.
    expect(DERIVED).toContain('DERIVED FILE')
    expect(DERIVED).toContain('bun scripts/sync-spec.ts')
  })

  test('the copy carries the corrections the shipped one was missing', () => {
    // Named explicitly rather than left to the hash, because a hash says
    // "something changed" and this says what was wrong. These are the
    // measured differences that made the previously shipped copy describe a
    // document that does not exist.
    expect(DERIVED).toContain('111 words')
    expect(DERIVED).not.toContain('~90 word')
    expect(DERIVED).toContain('MACHINE')
    expect(DERIVED).toContain('GROUNDING')
  })

  test('the copy is redacted — no identity survives the sync', () => {
    // The PII gate is the real enforcement and it scans the whole tree. This
    // asserts the SYNC is what keeps the file clean, so a future change to
    // the script that drops redaction fails here with a message about the
    // script rather than somewhere generic about the tree.
    const local = resolve(import.meta.dir, '..', '.pii-identities.local.json')
    if (!existsSync(local)) {
      console.warn('[spec-drift] UNMEASURED — no local identity list; redaction was not checked')
      return
    }
    const { identities = [] } = JSON.parse(readFileSync(local, 'utf-8'))
    expect(identities.length).toBeGreaterThan(0) // an empty list cannot catch anything
    for (const name of identities) {
      expect(DERIVED.toLowerCase()).not.toContain(String(name).toLowerCase())
    }
  })

  test('no Drive ID survives the sync, and the redactor shares the gate pattern', () => {
    // Two assertions, because they fail for different reasons. The first is
    // the outcome: the canonical spec cites two Drive files and neither may
    // ship. A Drive ID is worse than a name — it is a live handle that
    // RESOLVES to the customer's document.
    expect(DERIVED).not.toMatch(DRIVE_ID_RE)

    // The second is the mechanism, and it is the one with a future. The
    // redactor and the PII gate ask the same question in two files, and two
    // deciders that agree today are one edit from disagreeing — with the gate
    // winning and the sync becoming unrunnable. Asserting the SOURCE of both
    // is what makes them one decider in practice.
    expect(DRIVE_ID_RE.source).toBe(driveIdGatePattern().source)
    expect(DRIVE_ID_RE.flags).toBe(driveIdGatePattern().flags)
  })

  test('redaction keeps the methodology — the negative control', () => {
    // Without this, "redact everything" passes the check above. The spec has
    // to still say what a POV must contain after the names come out.
    expect(DERIVED).toMatch(/SC-\d+/)
    expect(DERIVED).toContain('one page')
    expect(DERIVED.length).toBeGreaterThan(10_000)
  })
})

describe('upstream drift is reported, and never silently passed', () => {
  const GOOD = 'the canonical text'
  const banner = (sha: string) => `<!-- DERIVED FILE\nsource-sha256: ${sha}\nbody-sha256: ${sha}\n-->\n`

  test('matching hashes are in-sync', () => {
    const d = banner(sha256(GOOD)) + GOOD
    expect(specDriftStatus(d, '/x', () => GOOD).status).toBe('in-sync')
  })

  test('a moved source is DRIFTED, and the message says how to fix it', () => {
    const d = banner(sha256(GOOD)) + GOOD
    const r = specDriftStatus(d, '/x', () => 'the canonical text, amended')
    expect(r.status).toBe('drifted')
    expect(r.detail).toContain('bun scripts/sync-spec.ts')
  })

  test('an absent source is UNMEASURED, not in-sync', () => {
    // The consumer machine. Reporting it as in-sync is the claim nobody made
    // — the two copies were never compared.
    const d = banner(sha256(GOOD)) + GOOD
    const r = specDriftStatus(d, '/nope', () => null)
    expect(r.status).toBe('unmeasured')
    expect(r.detail).toContain('UNMEASURED')
  })

  test('a copy with no recorded source hash is DRIFTED, not unmeasured', () => {
    // A hand-written file that never went through the generator cannot be
    // trusted, and "we could not check" is the wrong answer for a file that
    // declines to say what it came from.
    expect(specDriftStatus('no banner here', '/x', () => GOOD).status).toBe('drifted')
  })
})

describe('against the real canonical spec', () => {
  test('this machine reports in-sync, or says it could not look', () => {
    const r = specDriftStatus(DERIVED, CANONICAL_SPEC, p => (existsSync(p) ? readFileSync(p, 'utf-8') : null))
    // Written as an assertion on the VERDICT rather than a skip, so a drifted
    // copy is red here and an absent source is legible in the failure output
    // of neither. `drifted` is the only unacceptable state.
    if (r.status === 'unmeasured') console.warn(`[spec-drift] ${r.detail}`)
    expect(r.status).not.toBe('drifted')
  })
})
