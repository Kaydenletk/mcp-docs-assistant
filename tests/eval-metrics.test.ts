import { describe, it, expect } from 'vitest';
import { isRefusal, citedVersions, scoreCase, type EvalCase } from '../eval/metrics';

const V2_CITE = '[v2] server > Tools — https://github.com/x/blob/abc/docs/server.md#tools';
const V1_CITE = '[v1] server > Tools — https://github.com/x/blob/v1.29.0/docs/server.md#tools';

describe('isRefusal', () => {
  it('flags a no-citation decline as a refusal', () => {
    expect(isRefusal("The MCP TypeScript SDK docs I have don't cover this.", 0)).toBe(true);
  });
  it('is not a refusal when the answer cites sources', () => {
    expect(isRefusal('You cannot find a better way. ' + V2_CITE, 1)).toBe(false);
  });
});

describe('citedVersions', () => {
  it('returns the distinct versions cited', () => {
    expect(citedVersions(`${V1_CITE} and ${V2_CITE}`).sort()).toEqual(['v1', 'v2']);
  });
});

describe('scoreCase', () => {
  it('passes a should-refuse case when the model refuses', () => {
    const c: EvalCase = { id: 'r1', question: 'deploy k8s', expect: 'refuse' };
    expect(scoreCase(c, "The docs I have don't cover this.").pass).toBe(true);
  });
  it('fails a should-refuse case when the model answers anyway', () => {
    const c: EvalCase = { id: 'r2', question: 'deploy k8s', expect: 'refuse' };
    expect(scoreCase(c, `Sure, do this. ${V2_CITE}`).pass).toBe(false);
  });
  it('passes an answer case that cites at least one source', () => {
    const c: EvalCase = { id: 'a1', question: 'register tool', expect: 'answer' };
    expect(scoreCase(c, `Use registerTool(). ${V2_CITE}`).pass).toBe(true);
  });
  it('fails an answer case with no citation', () => {
    const c: EvalCase = { id: 'a2', question: 'register tool', expect: 'answer' };
    expect(scoreCase(c, 'Use registerTool().').pass).toBe(false);
  });
  it('fails a v2-pinned case that cites a v1 source', () => {
    const c: EvalCase = { id: 'v', question: 'in v2…', expect: 'answer', version: 'v2' };
    expect(scoreCase(c, `Do this. ${V1_CITE}`).pass).toBe(false);
  });
  it('passes a v2-pinned case that cites only v2', () => {
    const c: EvalCase = { id: 'v', question: 'in v2…', expect: 'answer', version: 'v2' };
    expect(scoreCase(c, `Do this. ${V2_CITE}`).pass).toBe(true);
  });
});
