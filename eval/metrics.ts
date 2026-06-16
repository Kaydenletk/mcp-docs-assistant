import { parseCitations } from '../lib/ui/citations';

/**
 * Pure scoring for the eval harness. These check the three disciplines that
 * define the product: it refuses when it should, it cites, and version-pinned
 * answers stay in their version. Pure + DB-free → unit-tested without creds.
 */

export type Expectation = 'answer' | 'refuse';

export interface EvalCase {
  id: string;
  question: string;
  expect: Expectation;
  /** For version-pinned questions: every citation must be this version. */
  version?: 'v1' | 'v2';
}

export interface CaseResult {
  id: string;
  expect: Expectation;
  refused: boolean;
  citationCount: number;
  citedVersions: string[];
  /** Did the answer satisfy its expectation (+ version constraint)? */
  pass: boolean;
}

const REFUSAL = /\b(do(?:es)?\s?n['’]?t|do not|cannot|can['’]?t)\b[^.]*\b(cover|have|find|answer)\b/i;

/** A refusal is the model declining — and crucially, citing nothing. */
export function isRefusal(text: string, citationCount: number): boolean {
  return citationCount === 0 && REFUSAL.test(text);
}

/** Distinct citation versions present in an answer (e.g. ['v1','v2'] or ['2025-11-25']). */
export function citedVersions(text: string): string[] {
  const versions = parseCitations(text)
    .filter((s): s is Extract<ReturnType<typeof parseCitations>[number], { type: 'citation' }> => s.type === 'citation')
    .map((c) => c.version);
  return [...new Set(versions)];
}

export function scoreCase(c: EvalCase, answerText: string): CaseResult {
  const versions = citedVersions(answerText);
  const citationCount = parseCitations(answerText).filter((s) => s.type === 'citation').length;
  const refused = isRefusal(answerText, citationCount);

  let pass: boolean;
  if (c.expect === 'refuse') {
    pass = refused;
  } else {
    // Must answer (not refuse) and ground it with at least one citation.
    pass = !refused && citationCount > 0;
    // Version-pinned: every cited version must equal the requested one.
    if (pass && c.version) pass = versions.length > 0 && versions.every((v) => v === c.version);
  }

  return { id: c.id, expect: c.expect, refused, citationCount, citedVersions: versions, pass };
}
