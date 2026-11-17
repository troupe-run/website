import { describe, it, expect } from 'vitest';
import { EXTERNAL_SKIPS, skipProblems } from '../../scripts/external-skips.mjs';

describe('external link skips', () => {
  it('the real skip list has a pattern and a reason on every entry, and every pattern compiles', () => {
    expect(skipProblems(EXTERNAL_SKIPS)).toEqual([]);
  });

  it('skipProblems reports an entry with no reason, one with no pattern, and one whose pattern will not compile', () => {
    expect(
      skipProblems([
        { pattern: 'example\\.com', reason: ' ' },
        { reason: 'blocks bots' },
        { pattern: '(', reason: 'broken regex' },
      ]),
    ).toEqual(['entry 0: no reason', 'entry 1: no pattern', 'entry 2: pattern is not a valid regex']);
  });

  it('no skip matches the product repository, https://github.com/troupe-run/troupe', () => {
    const url = 'https://github.com/troupe-run/troupe';
    expect(EXTERNAL_SKIPS.filter((s) => new RegExp(s.pattern).test(url))).toEqual([]);
  });
});
