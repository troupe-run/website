import { describe, it, expect } from 'vitest';
import { SITE_PATH_MESSAGE, sitePath } from '../../src/lib/site-path';

// The hero's install link must go to a page on this site, so the build's internal link check holds it to one that
// exists (spec: landing-calls-to-action; troupe-run/website#83).
describe('sitePath', () => {
  it('accepts the install page, /docs/opening-night/install/', () => {
    expect(sitePath.parse('/docs/opening-night/install/')).toBe('/docs/opening-night/install/');
  });

  it('refuses a missing link', () => {
    const result = sitePath.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it.each([
    ['a full URL', 'https://troupe.run/docs/opening-night/install/'],
    ['a protocol-relative URL, which a browser reads as another host', '//troupe.run/docs/'],
    ['a relative path', 'docs/opening-night/install/'],
    ['an empty string', ''],
  ])('refuses %s, saying the link must be a path on this site', (_, value) => {
    const result = sitePath.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([SITE_PATH_MESSAGE]);
  });

  it('says what a path on this site looks like, with the install page as the example', () => {
    expect(SITE_PATH_MESSAGE).toBe('must be a path on this site, starting with one "/", such as /docs/opening-night/install/');
  });
});
