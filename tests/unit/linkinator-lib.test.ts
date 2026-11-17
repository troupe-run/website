import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { summarise } from '../../scripts/linkinator-lib.mjs';

// Both fixtures are real `linkinator --format json` output: one from the built site (cut to six entries), one from
// a page holding a 404, a link to an unresolvable host and a working link.
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8'));
const ok = fixture('linkinator-external-ok.json');
const broken = fixture('linkinator-broken.json');

describe('summarise', () => {
  it('counts every reported link as scanned and none as broken when all are OK', () => {
    const s = summarise(ok);
    expect(s.scanned).toHaveLength(6);
    expect(s.broken).toEqual([]);
  });

  it('counts only http(s) links as external, not the dist/ paths of local files', () => {
    expect(summarise(ok).external).toBe(3);
  });

  it('returns the 404 and the unreachable host as broken, and not the working link', () => {
    expect(
      summarise(broken)
        .broken.map((l: { url: string }) => l.url)
        .sort(),
    ).toEqual(['https://no-such-host.invalid/', 'https://troupe.run/definitely-not-here-404']);
  });

  // Hand-written: linkinator 8 omits skipped links from its JSON, so no real run has produced this entry. It guards
  // the filter in case a later linkinator reports them again.
  it('leaves a SKIPPED link out of scanned and external', () => {
    const s = summarise({ links: [{ url: 'https://gc.zgo.at/count.js', state: 'SKIPPED' }] });
    expect(s.scanned).toEqual([]);
    expect(s.external).toBe(0);
  });

  it('gives zero scanned for a result with no links field', () => {
    expect(summarise({}).scanned).toEqual([]);
    expect(summarise(undefined).external).toBe(0);
  });
});
