// What a docs route's version is, and what its sidebar, pagination and version menu link to (spec: versioned-docs;
// design D6, D7). Pure functions of the manifest that `npm run docs:sync` writes, so they're tested without Astro.
import { firstPage, ordered, pageUrl, type Page } from './docs-nav';

export interface Version {
  role: 'current' | 'next' | 'archived';
  /** `MAJOR.MINOR`, or null for troupe's main. */
  version: string | null;
  base: string;
  dir: string;
  ref: string;
  pages: Page[];
}
export interface Manifest { versions: Version[]; glossary: string }

/** The version a docs route id (`docs/v0.1/the-company/flows`) belongs to, and the page's path under docs/. */
export function locate(manifest: Manifest, id: string): { version: Version; path: string } | undefined {
  if (id !== 'docs' && !id.startsWith('docs/')) return undefined;
  const rest = id.slice('docs/'.length);
  const [first, ...tail] = rest.split('/');
  const named = manifest.versions.find((v) => v.dir !== '' && v.dir === first);
  const version = named ?? manifest.versions.find((v) => v.dir === '');
  if (!version) return undefined;
  const path = `${named ? tail.join('/') : rest}.md`;
  return version.pages.some((p) => p.path === path) ? { version, path } : undefined;
}

// Starlight's sidebar entry shapes (route data, `sidebar`).
export interface SidebarLink {
  type: 'link'; label: string; href: string; isCurrent: boolean; badge: undefined; attrs: Record<string, string>;
}
export interface SidebarGroup { type: 'group'; label: string; entries: SidebarLink[]; collapsed: boolean; badge: undefined }

const link = (label: string, href: string, isCurrent = false): SidebarLink =>
  ({ type: 'link', label, href, isCurrent, badge: undefined, attrs: {} });

/** The version's sidebar: its pages in each section's order, then the section's link to a page the website keeps. */
export function sidebar(version: Version, current: string): SidebarGroup[] {
  return ordered(version.pages)
    .filter(({ section, pages }) => pages.length > 0 || section.kept)
    .map(({ section, pages }) => ({
      type: 'group',
      label: section.label,
      collapsed: false,
      badge: undefined,
      entries: [
        ...pages.map((p) => link(p.title, pageUrl(version.base, p.path), p.path === current)),
        ...(section.kept ? [link(section.kept.label, section.kept.href)] : []),
      ],
    }));
}

/** "Previous" and "Next": the neighbouring pages in the version's sidebar order, never the website's own links. */
export function pagination(version: Version, current: string): { prev: SidebarLink | undefined; next: SidebarLink | undefined } {
  const pages = ordered(version.pages).flatMap((s) => s.pages);
  const at = pages.findIndex((p) => p.path === current);
  const to = (p: Page | undefined) => (p ? link(p.title, pageUrl(version.base, p.path)) : undefined);
  return { prev: to(pages[at - 1]), next: to(pages[at + 1]) };
}

/** Where the menu's entry for `version` goes from page `path`: the same page there, or the version's first page. */
export function samePageIn(version: Version, path: string): string {
  const page = version.pages.find((p) => p.path === path) ?? firstPage(version.pages);
  return page ? pageUrl(version.base, page.path) : version.base;
}

/** The latest release's version (or main's, before the first release): the one at /docs/. */
export const latest = (manifest: Manifest) => manifest.versions.find((v) => v.role === 'current')!;


/** The words the menu and banners use (src/content/copy/versions.md). */
export interface VersionCopy { latest: string; unreleased: string; next: string }

/** A version's name in the menu: "v0.2 (latest)", "next (unreleased)", "v0.1", or "unreleased" before any release. */
export function label(version: Version, copy: VersionCopy): string {
  if (version.role === 'next') return `${copy.next} (${copy.unreleased})`;
  if (version.version === null) return copy.unreleased;
  return version.role === 'current' ? `v${version.version} (${copy.latest})` : `v${version.version}`;
}

/** The page's source at its version's ref, for pages with no edit link (design D7). */
export const sourceUrl = (version: Version, path: string) => `https://github.com/troupe-run/troupe/blob/${version.ref}/docs/${path}`;

/** What a docs page shows about its version: the menu's entries, and the banner for an archived or next page. */
export function versionNotice(manifest: Manifest, version: Version, path: string) {
  const top = latest(manifest);
  const entries = manifest.versions.map((v) => ({ version: v, href: samePageIn(v, path), current: v === version }));
  const banner = version.role === 'current' ? undefined : {
    kind: version.role,
    latest: `v${top.version}`,
    href: samePageIn(top, path),
    samePage: top.pages.some((p) => p.path === path),
  };
  return { entries, banner };
}

/** A version's name in the closed picker, where there's little room: "v0.2", "next", "v0.1" or "unreleased". */
export function shortLabel(version: Version, copy: VersionCopy): string {
  if (version.role === 'next') return copy.next;
  return version.version === null ? copy.unreleased : `v${version.version}`;
}
