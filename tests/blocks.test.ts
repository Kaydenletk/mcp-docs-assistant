import { describe, it, expect } from 'vitest';
import { splitCodeBlocks } from '../lib/ui/blocks';

describe('splitCodeBlocks', () => {
  it('returns one prose block when there is no code', () => {
    expect(splitCodeBlocks('hello world')).toEqual([{ type: 'prose', value: 'hello world' }]);
  });

  it('splits prose and a fenced code block, capturing the language', () => {
    const out = splitCodeBlocks('Intro:\n```ts\nconst x = 1;\n```\nOutro.');
    expect(out).toEqual([
      { type: 'prose', value: 'Intro:\n' },
      { type: 'code', lang: 'ts', value: 'const x = 1;' },
      { type: 'prose', value: '\nOutro.' },
    ]);
  });

  it('defaults the language to text when the fence has none', () => {
    const out = splitCodeBlocks('```\nplain\n```');
    expect(out).toEqual([{ type: 'code', lang: 'text', value: 'plain' }]);
  });
});
