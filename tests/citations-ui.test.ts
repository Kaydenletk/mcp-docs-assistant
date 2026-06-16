import { describe, it, expect } from 'vitest';
import { parseCitations, splitInlineCode, type Segment } from '../lib/ui/citations';

describe('splitInlineCode', () => {
  it('splits plain text and inline code spans', () => {
    expect(splitInlineCode('call `registerTool()` now')).toEqual([
      { code: false, value: 'call ' },
      { code: true, value: 'registerTool()' },
      { code: false, value: ' now' },
    ]);
  });
  it('returns a single plain span when there is no code', () => {
    expect(splitInlineCode('plain')).toEqual([{ code: false, value: 'plain' }]);
  });
});

describe('parseCitations', () => {
  it('returns a single text segment when there are no citations', () => {
    expect(parseCitations('just prose')).toEqual([{ type: 'text', value: 'just prose' }]);
  });

  it('lifts an inline citation into a chip and keeps surrounding text', () => {
    const out = parseCitations(
      'Use registerTool [v2] server > Tools — https://github.com/x/blob/abc/docs/server.md#tools. Done.',
    );
    expect(out[0]).toEqual({ type: 'text', value: 'Use registerTool ' });
    expect(out[1]).toEqual({
      type: 'citation',
      version: 'v2',
      label: 'server > Tools',
      url: 'https://github.com/x/blob/abc/docs/server.md#tools',
    });
    expect(out[2]).toEqual({ type: 'text', value: '. Done.' });
  });

  it('parses a date-tagged spec citation', () => {
    const out = parseCitations('Auth is optional [2025-11-25] Authorization — https://x/blob/2025-11-25/a.mdx#intro');
    const cite = out.find((s): s is Extract<Segment, { type: 'citation' }> => s.type === 'citation');
    expect(cite?.version).toBe('2025-11-25');
    expect(cite?.url).toBe('https://x/blob/2025-11-25/a.mdx#intro');
  });

  it('handles multiple citations in one answer', () => {
    const text =
      '[v1] A — https://x/a.md and [v2] B — https://x/b.md';
    const cites = parseCitations(text).filter((s) => s.type === 'citation');
    expect(cites).toHaveLength(2);
  });
});
