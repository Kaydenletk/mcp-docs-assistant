import { describe, it, expect } from 'vitest';
import { applyRanking } from '../lib/retrieve/rerank';

const items = ['a', 'b', 'c', 'd'];

describe('applyRanking', () => {
  it('reorders items by descending score', () => {
    const scores = [
      { index: 0, score: 1 },
      { index: 1, score: 9 },
      { index: 2, score: 5 },
      { index: 3, score: 3 },
    ];
    expect(applyRanking(items, scores, 4)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('keeps only the top K', () => {
    const scores = [
      { index: 0, score: 2 },
      { index: 1, score: 8 },
      { index: 2, score: 6 },
    ];
    expect(applyRanking(items, scores, 2)).toEqual(['b', 'c']);
  });

  it('sinks unscored items to the bottom in original order', () => {
    const scores = [{ index: 2, score: 10 }];
    expect(applyRanking(items, scores, 4)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('breaks score ties by original order', () => {
    const scores = [
      { index: 0, score: 5 },
      { index: 1, score: 5 },
    ];
    expect(applyRanking(['a', 'b'], scores, 2)).toEqual(['a', 'b']);
  });
});
