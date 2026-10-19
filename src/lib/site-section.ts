/**
 * Which part of the site a Starlight route belongs to: the blog (`blog/…`), the docs (`docs/…`, and Starlight's 404
 * page), or the site's own pages outside both, such as Status and roadmap (`status`).
 */
export function siteSection(routeId: string): 'docs' | 'blog' | 'site' {
  if (routeId === 'blog' || routeId.startsWith('blog/')) return 'blog';
  if (routeId === 'docs' || routeId.startsWith('docs/') || routeId === '404') return 'docs';
  return 'site';
}
