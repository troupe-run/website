import { describe, it, expect } from 'vitest';
import { locate, sidebar, pagination, samePageIn, label, shortLabel, versionNotice, sourceUrl, type Manifest, type Version } from '../../src/lib/docs-versions';
import { ordered, firstPage } from '../../src/lib/docs-nav';

// Each version's sidebar, pagination and menu links come from that version's own pages (spec: versioned-docs;
// design D6).
const v = (role: Version['role'], dir: string, paths: string[]): Version => ({
  role, version: dir.startsWith('v') ? dir.slice(1) : null, dir, ref: dir || 'troupe-v0.2.0',
  base: dir ? `/docs/${dir}/` : '/docs/',
  pages: paths.map((path) => ({ path, title: path.split('/')[1].replace('.md', '') })),
});
const current = { ...v('current', '', ['programme/what-is-troupe.md', 'programme/principles.md', 'stagecraft/build-a-flow.md', 'stagecraft/new-guide.md', 'stagecraft/another.md']), version: '0.2' };
const archived = v('archived', 'v0.1', ['programme/what-is-troupe.md', 'stagecraft/build-a-flow.md']);
const manifest: Manifest = { versions: [v('next', 'next', ['programme/what-is-troupe.md']), current, archived], glossary: '' };

describe('ordered', () => {
  it("lists a section's named pages in the website's order, then pages it doesn't name, by title", () => {
    const stagecraft = ordered(current.pages).find((s) => s.section.dir === 'stagecraft')!;
    expect(stagecraft.pages.map((p) => p.path)).toEqual(['stagecraft/build-a-flow.md', 'stagecraft/another.md', 'stagecraft/new-guide.md']);
  });

  it('leaves out a named page the version lacks', () => {
    const programme = ordered(archived.pages).find((s) => s.section.dir === 'programme')!;
    expect(programme.pages.map((p) => p.path)).toEqual(['programme/what-is-troupe.md']);
  });

  it("starts each version at its first page in sidebar order", () => {
    expect(firstPage(archived.pages)?.path).toBe('programme/what-is-troupe.md');
  });
});

describe('sidebar', () => {
  it('keeps every page link in the version, marks the current page, and ends Programme and Backstage with the kept pages', () => {
    const groups = sidebar(archived, 'stagecraft/build-a-flow.md');
    const pageLinks = groups.flatMap((g) => g.entries).filter((e) => e.href.startsWith('/docs'));
    expect(pageLinks.map((e) => e.href)).toEqual(['/docs/v0.1/programme/what-is-troupe/', '/docs/v0.1/stagecraft/build-a-flow/']);
    expect(pageLinks.filter((e) => e.isCurrent).map((e) => e.href)).toEqual(['/docs/v0.1/stagecraft/build-a-flow/']);
    expect(groups.find((g) => g.label === 'Programme')!.entries.at(-1)).toMatchObject({ label: 'Status and roadmap', href: '/status/' });
    expect(groups.find((g) => g.label === 'Backstage')!.entries.at(-1)).toMatchObject({
      label: 'Contributing', href: 'https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md',
    });
  });

  it('shows the six sections in the site order, leaving out a section with no pages and no kept link', () => {
    expect(sidebar(archived, '').map((g) => g.label)).toEqual(['Programme', 'Stagecraft', 'Backstage']);
  });

  const currentLabels = (groups: ReturnType<typeof sidebar>) => groups.flatMap((g) => g.entries).filter((e) => e.isCurrent).map((e) => e.label);

  it('on /status/, marks Status and roadmap current and nothing else (troupe-run/website#28)', () => {
    expect(currentLabels(sidebar(current, '/status/'))).toEqual(['Status and roadmap']);
  });

  it('on a docs page, marks only that page current, and neither kept link', () => {
    expect(currentLabels(sidebar(current, 'programme/what-is-troupe.md'))).toEqual(['what-is-troupe']);
  });
});

describe('pagination', () => {
  it('links the neighbouring pages in the version, never the website-kept pages', () => {
    const { prev, next } = pagination(archived, 'programme/what-is-troupe.md');
    expect(prev).toBeUndefined();
    expect(next?.href).toBe('/docs/v0.1/stagecraft/build-a-flow/');
  });
});

describe('samePageIn', () => {
  it('goes to the same page when the version has it', () => {
    expect(samePageIn(current, 'stagecraft/build-a-flow.md')).toBe('/docs/stagecraft/build-a-flow/');
  });

  it("goes to the version's first page when it doesn't", () => {
    expect(samePageIn(archived, 'stagecraft/new-guide.md')).toBe('/docs/v0.1/programme/what-is-troupe/');
  });
});

describe('locate', () => {
  it.each([
    ['docs/v0.1/stagecraft/build-a-flow', 'archived', 'stagecraft/build-a-flow.md'],
    ['docs/next/programme/what-is-troupe', 'next', 'programme/what-is-troupe.md'],
    ['docs/stagecraft/new-guide', 'current', 'stagecraft/new-guide.md'],
  ])('finds %s in the %s version', (id, role, path) => {
    expect(locate(manifest, id)).toMatchObject({ version: { role }, path });
  });

  it('finds nothing for a route outside the docs, or a page no version has', () => {
    expect(locate(manifest, 'status')).toBeUndefined();
    expect(locate(manifest, 'blog/post')).toBeUndefined();
    expect(locate(manifest, 'docs/v0.1/stagecraft/new-guide')).toBeUndefined();
  });
});

describe('label', () => {
  const copy = { latest: 'latest', unreleased: 'unreleased', next: 'next' };
  it.each([
    [current, 'v0.2 (latest)'],
    [archived, 'v0.1'],
    [manifest.versions[0], 'next (unreleased)'],
    [{ ...current, version: null, ref: 'main' }, 'unreleased'],
  ] as [Version, string][])('names a %s version as the menu shows it', (version, expected) => {
    expect(label(version, copy)).toBe(expected);
  });
});

describe('versionNotice', () => {
  it('lists every version with the same page, or its first page, marking the one being read', () => {
    const { entries } = versionNotice(manifest, archived, 'stagecraft/build-a-flow.md');
    expect(entries.map((e) => [e.version.role, e.href, e.current])).toEqual([
      ['next', '/docs/next/programme/what-is-troupe/', false],
      ['current', '/docs/stagecraft/build-a-flow/', false],
      ['archived', '/docs/v0.1/stagecraft/build-a-flow/', true],
    ]);
  });

  it('gives an archived page a banner linking the same page in the latest release', () => {
    expect(versionNotice(manifest, archived, 'stagecraft/build-a-flow.md').banner).toEqual({
      kind: 'archived', latest: 'v0.2', href: '/docs/stagecraft/build-a-flow/', samePage: true,
    });
  });

  it("links the latest release's first page when it doesn't have the page", () => {
    const only = v('archived', 'v0.1', ['programme/what-is-troupe.md', 'stagecraft/old-guide.md']);
    expect(versionNotice({ ...manifest, versions: [...manifest.versions, only] }, only, 'stagecraft/old-guide.md').banner)
      .toMatchObject({ href: '/docs/programme/what-is-troupe/', samePage: false });
  });

  it('gives the current version no banner', () => {
    expect(versionNotice(manifest, current, 'programme/what-is-troupe.md').banner).toBeUndefined();
  });
});

describe('sourceUrl', () => {
  it("links the page's source at its version's tag", () => {
    expect(sourceUrl({ ...archived, ref: 'troupe-v0.1.1' }, 'stagecraft/build-a-flow.md'))
      .toBe('https://github.com/troupe-run/troupe/blob/troupe-v0.1.1/docs/stagecraft/build-a-flow.md');
  });
});

describe('shortLabel', () => {
  const copy = { latest: 'latest', unreleased: 'unreleased', next: 'next' };
  it.each([
    [current, 'v0.2'], [archived, 'v0.1'], [manifest.versions[0], 'next'], [{ ...current, version: null, ref: 'main' }, 'unreleased'],
  ] as [Version, string][])('names a %s version briefly, for the closed picker', (version, expected) => {
    expect(shortLabel(version, copy)).toBe(expected);
  });
});
