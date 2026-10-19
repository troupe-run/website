import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { siteSection } from './lib/site-section';
import { locate, pagination, sidebar, type Manifest } from './lib/docs-versions';
import manifestJson from './generated/troupe-docs.json';

const manifest = manifestJson as Manifest;

// Runs after starlight-blog's own middleware (await next()), which builds the blog sidebar.
export const onRequest = defineRouteMiddleware(async (context, next) => {
  await next();
  const route = context.locals.starlightRoute;
  // Docs pages: the sidebar and "Previous"/"Next" of the page's own version (spec: versioned-docs; design D6).
  const at = locate(manifest, route.id);
  if (at) {
    route.sidebar = sidebar(at.version, at.path);
    route.pagination = pagination(at.version, at.path);
    return;
  }
  // Blog pages and the site's own pages (/status/): no left-hand sidebar, no empty "On this page" column (the blog's
  // index and tag pages have no headings), and the tab title and og:site_name say "troupe blog" or "troupe" rather
  // than the Starlight-wide "troupe docs".
  const section = siteSection(route.id);
  if (section === 'docs') return;
  route.hasSidebar = false;
  // Starlight always lists the page top ("Overview"); with nothing else, the column would sit empty.
  if (route.toc && route.toc.items.length <= 1) route.toc = undefined;
  const name = section === 'blog' ? 'troupe blog' : 'troupe';
  for (const entry of route.head) {
    if (entry.tag === 'title' && entry.content) entry.content = entry.content.replace(/troupe docs$/, name);
    if (entry.tag === 'meta' && entry.attrs?.property === 'og:site_name') entry.attrs.content = name;
  }
});
