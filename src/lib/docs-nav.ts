// The docs sidebar's sections and page order (spec: versioned-docs; design D6). The order is the website's, from
// the sidebar this site had before /docs moved to troupe (troupe-run/website#23). Which pages exist is each
// version's: a listed page a version lacks is left out, and a page troupe adds that this list doesn't name follows
// the listed ones, so it appears without a change here.
export const CONTRIBUTING = 'https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md';

export interface Section {
  dir: string;
  label: string;
  pages: string[];
  /** A link to a page the website keeps outside /docs, at the end of the section. */
  kept?: { label: string; href: string };
}

export const NAV: Section[] = [
  { dir: 'programme', label: 'Programme', pages: ['what-is-troupe', 'principles'], kept: { label: 'Status and roadmap', href: '/status/' } },
  { dir: 'opening-night', label: 'Opening night', pages: ['install', 'first-theatre', 'first-performance'] },
  {
    dir: 'the-company', label: 'The company',
    pages: ['theatres', 'roles-and-actors', 'performances-and-runs', 'flows', 'gates-and-decisions', 'escalation', 'notes', 'lineage', 'guests', 'the-house'],
  },
  {
    dir: 'stagecraft', label: 'Stagecraft',
    pages: ['configure-roles', 'route-decisions', 'build-a-flow', 'bring-your-own-agent', 'hand-edit-config', 'write-a-guest', 'read-the-lineage'],
  },
  { dir: 'prompt-book', label: 'Prompt book', pages: ['cli', 'config-schema', 'events', 'guest-manifest', 'glossary'] },
  { dir: 'backstage', label: 'Backstage', pages: ['licensing', 'changelog'], kept: { label: 'Contributing', href: CONTRIBUTING } },
];

export interface Page { path: string; title: string }

/** A version's pages in sidebar order, section by section: listed pages first, then the rest by title. */
export function ordered(pages: Page[]): { section: Section; pages: Page[] }[] {
  return NAV.map((section) => {
    const here = pages.filter((p) => p.path.startsWith(`${section.dir}/`));
    const slug = (p: Page) => p.path.slice(section.dir.length + 1, -'.md'.length);
    const listed = section.pages.flatMap((s) => here.filter((p) => slug(p) === s));
    const rest = here.filter((p) => !section.pages.includes(slug(p))).sort((a, b) => a.title.localeCompare(b.title));
    return { section, pages: [...listed, ...rest] };
  });
}

/** A page's URL in a version: `programme/what-is-troupe.md` under `/docs/v0.1/` is `/docs/v0.1/programme/what-is-troupe/`. */
export const pageUrl = (base: string, path: string) => `${base}${path.replace(/\.md$/, '')}/`;

/** The version's first page in sidebar order, which its root redirects to. */
export function firstPage(pages: Page[]): Page | undefined {
  return ordered(pages).flatMap((s) => s.pages)[0];
}
