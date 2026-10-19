import { describe, it, expect } from 'vitest';
import { siteSection } from '../../src/lib/site-section';

// Which part of the site a route is in decides its header label and whether it has the docs sidebar.
describe('siteSection', () => {
  it.each([
    ['blog', 'blog'], ['blog/2026-10-10-methodology-bake-off', 'blog'],
    ['docs/programme/what-is-troupe', 'docs'], ['docs/v0.1/the-company/flows', 'docs'], ['404', 'docs'],
    ['status', 'site'],
  ])('puts %s in %s', (id, section) => {
    expect(siteSection(id)).toBe(section);
  });
});
