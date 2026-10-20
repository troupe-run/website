import { NAV } from './docs-nav';

/**
 * Which part of the site a Starlight route belongs to: the blog (`blog/…`), the docs (`docs/…`, and Starlight's 404
 * page), or the site's own pages outside both, such as Status and roadmap (`status`).
 */
export function siteSection(routeId: string): 'docs' | 'blog' | 'site' {
  if (routeId === 'blog' || routeId.startsWith('blog/')) return 'blog';
  if (routeId === 'docs' || routeId.startsWith('docs/') || routeId === '404') return 'docs';
  return 'site';
}

/**
 * The docs sidebar's link to a page the website keeps that `pathname` is, if any (`/status/`). Such a page outside
 * /docs shows the docs sidebar, so a reader who follows the link from the docs keeps it (troupe-run/website#28).
 */
export function keptPage(pathname: string): string | undefined {
  return NAV.flatMap((s) => (s.kept ? [s.kept.href] : [])).find((href) => href === pathname);
}

/**
 * A route's "Previous" and "Next", keeping only links within its own section: a docs page's as they are, a blog
 * post's to other posts, and none on a site page. Outside /docs, Starlight's own fall back to its order of every page,
 * which leads into /docs from nowhere in particular (troupe-run/website#28).
 */
export function ownPagination<T extends { href: string }>(
  section: ReturnType<typeof siteSection>, pagination: { prev: T | undefined; next: T | undefined },
): { prev: T | undefined; next: T | undefined } {
  if (section === 'docs') return pagination;
  const keep = (l: T | undefined) => (section === 'blog' && l?.href.startsWith('/blog/') ? l : undefined);
  return { prev: keep(pagination.prev), next: keep(pagination.next) };
}

/**
 * The section named after the wordmark in the header and tab title: a docs page's and a page the docs sidebar links to
 * are "docs" (so `/status/` reads as part of them, troupe-run/website#28), a blog page's "blog", and none on the site's
 * other pages.
 */
export function headerSection(routeId: string, pathname: string): 'docs' | 'blog' | undefined {
  const section = siteSection(routeId);
  if (section === 'site') return keptPage(pathname) ? 'docs' : undefined;
  return section;
}
