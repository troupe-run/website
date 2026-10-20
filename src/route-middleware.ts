import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { headerSection, keptPage, ownPagination, siteSection } from './lib/site-section';
import { latest, locate, pagination, sidebar, type Manifest } from './lib/docs-versions';
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
  // Blog pages and the site's own pages (/status/): no empty "On this page" column (the blog's index and tag pages
  // have no headings), and the tab title and og:site_name name the section the header does: "troupe blog", "troupe
  // docs" for a page the docs sidebar links to, or "troupe".
  const section = siteSection(route.id);
  if (section === 'docs') return;
  // "Previous" and "Next" stay in the page's own section: Starlight's own lead into /docs from nowhere in particular.
  route.pagination = ownPagination(section, route.pagination);
  // A page the docs sidebar links to (/status/) keeps the sidebar, with itself marked current, so a reader who follows
  // it from the docs keeps the navigation. It's the version at /docs/: a static page can't know which one they came
  // from (troupe-run/website#28). Every other page outside /docs has no left-hand sidebar.
  const kept = keptPage(context.url.pathname);
  if (kept) route.sidebar = sidebar(latest(manifest), kept);
  else route.hasSidebar = false;
  // Starlight always lists the page top ("Overview"); with nothing else, the column would sit empty.
  if (route.toc && route.toc.items.length <= 1) route.toc = undefined;
  const named = headerSection(route.id, context.url.pathname);
  const name = named ? `troupe ${named}` : 'troupe';
  for (const entry of route.head) {
    if (entry.tag === 'title' && entry.content) entry.content = entry.content.replace(/troupe docs$/, name);
    if (entry.tag === 'meta' && entry.attrs?.property === 'og:site_name') entry.attrs.content = name;
  }
});
