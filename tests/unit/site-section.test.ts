import { describe, it, expect } from 'vitest';
import { headerSection, keptPage, ownPagination, siteSection } from '../../src/lib/site-section';

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

// troupe-run/website#28: a page outside /docs that the docs sidebar links to keeps the sidebar, and no page outside
// /docs links into it through "Previous" or "Next".
describe('keptPage', () => {
  it.each([
    ['/status/', '/status/'], ['/blog/', undefined], ['/blog/2026-10-10-methodology-bake-off/', undefined], ['/about/', undefined],
  ])('the docs sidebar link that %s answers to is %s', (pathname, href) => {
    expect(keptPage(pathname)).toBe(href);
  });
});

describe('ownPagination', () => {
  const docs = { href: '/docs/backstage/changelog/' };
  const post = { href: '/blog/2026-10-01-older/' };

  it('leaves a site page with no Previous or Next', () => {
    expect(ownPagination('site', { prev: docs, next: post })).toEqual({ prev: undefined, next: undefined });
  });

  it("keeps a blog page's links to other posts and drops its links into the docs", () => {
    expect(ownPagination('blog', { prev: post, next: docs })).toEqual({ prev: post, next: undefined });
  });

  it("leaves a docs page's links as they are", () => {
    expect(ownPagination('docs', { prev: docs, next: docs })).toEqual({ prev: docs, next: docs });
  });
});

describe('headerSection', () => {
  it.each([
    ['docs/programme/what-is-troupe', '/docs/programme/what-is-troupe/', 'docs'],
    ['status', '/status/', 'docs'],
    ['blog', '/blog/', 'blog'],
    ['about', '/about/', undefined],
  ])('names %s (%s) "%s" after the wordmark', (id, pathname, section) => {
    expect(headerSection(id, pathname)).toBe(section);
  });
});
