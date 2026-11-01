import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { pngSize } from '../../scripts/assets-lib.mjs';
import { readAppTable, checkSource, checkAppSet } from '../../scripts/app-avatars-lib.mjs';
import { APPS, ASSETS } from '../../scripts/assets.config.mjs';

// Each GitHub App that acts for troupe-run has an avatar (troupe-run/website#81, spec: app-avatars). The brand guide's
// §5 table is the list of Apps and says each one's kind; this holds the sources in brand/apps/ and the render config to
// it, and each source to its kind's colours. Whether a prop reads at 20 and 40px can't be tested: the owner judges it
// by eye (tasks.md, group 4).
const GUIDE = readFileSync('docs/brand-guide.md', 'utf8');

const guide = (rows: string) =>
  `## 5. Characters\n\n### GitHub Apps\n\n| App | Kind | Prop |\n|---|---|---|\n${rows}\n\n## 6. The theatre metaphor\n`;
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n${body}\n</svg>\n`;
const TRIANGLE = '<path d="M50 20 L80 72 L20 72 Z" fill="#FF5A3C" stroke="#FF5A3C" stroke-width="10" stroke-linejoin="round"/>';
const EYES = '<circle cx="42" cy="56" r="4" fill="#FFFFFF"/><circle cx="58" cy="56" r="4" fill="#FFFFFF"/>';
const SQUARE = '<rect x="20" y="20" width="56" height="56" rx="15.7" fill="#14857D"/>';

describe("the brand guide's App table", () => {
  it('reads each row as the App, its kind and its prop', () => {
    expect(readAppTable(guide('| `troupe-run-docs` | system | a book |\n| `troupe-run-review` | agent | a tick |'))).toEqual([
      { app: 'troupe-run-docs', kind: 'system', prop: 'a book' },
      { app: 'troupe-run-review', kind: 'agent', prop: 'a tick' },
    ]);
  });

  it('refuses a kind other than system or agent, naming the App and the kind', () => {
    expect(() => readAppTable(guide('| `troupe-run-docs` | crew | a book |'))).toThrow(
      'docs/brand-guide.md §5 "GitHub Apps": troupe-run-docs has kind "crew"; the kind is system or agent',
    );
  });

  it('refuses a guide with no "GitHub Apps" subsection in §5', () => {
    expect(() => readAppTable('## 5. Characters\n\nNo Apps here.\n\n## 6. The theatre metaphor\n')).toThrow(
      'docs/brand-guide.md §5 has no "### GitHub Apps" subsection',
    );
  });

  it('refuses a table whose columns are not App, Kind and Prop', () => {
    expect(() => readAppTable(guide('').replace('| App | Kind | Prop |', '| App | Prop |'))).toThrow(
      'docs/brand-guide.md §5 "GitHub Apps": the table\'s columns are App | Prop, expected App | Kind | Prop',
    );
  });
});

describe('every App in the guide has a source and an avatar, and nothing else does', () => {
  const all = ['troupe-run-docs', 'troupe-run-review'];

  it('reports nothing when the guide, the sources and the render list agree', () => {
    expect(checkAppSet({ guide: all, sources: all, apps: all })).toEqual([]);
  });

  it('names a guide App with no source', () => {
    expect(checkAppSet({ guide: all, sources: ['troupe-run-docs'], apps: all })).toEqual([
      'troupe-run-review is in the brand guide but has no source: draw brand/apps/troupe-run-review.svg',
    ]);
  });

  it('names a guide App with no render entry', () => {
    expect(checkAppSet({ guide: all, sources: all, apps: ['troupe-run-review'] })).toEqual([
      'troupe-run-docs is in the brand guide but not in APPS in scripts/assets.config.mjs, so it has no avatar',
    ]);
  });

  it("names a source and a render entry for an App the guide doesn't list", () => {
    expect(checkAppSet({ guide: ['troupe-run-docs'], sources: all, apps: all })).toEqual([
      "brand/apps/troupe-run-review.svg is for an App the brand guide's §5 doesn't list",
      "APPS in scripts/assets.config.mjs lists troupe-run-review, which the brand guide's §5 doesn't list",
    ]);
  });
});

describe("each App's source uses only its kind's colours", () => {
  const name = 'brand/apps/troupe-run-docs.svg';

  it('passes a system triangle with white eyes and an ink and sunflower prop', () => {
    const prop = '<rect x="60" y="60" width="30" height="24" rx="3" fill="#1D1B2F"/><rect x="64" y="64" width="22" height="4" fill="#FFC93C"/>';
    expect(checkSource(name, 'system', svg(TRIANGLE + EYES + prop))).toEqual([]);
  });

  it('passes an agent square, and a line drawn as a stroke with no fill', () => {
    const tick = '<path d="M60 70 L68 78 L84 60" fill="none" stroke="#1D1B2F" stroke-width="6" stroke-linecap="round"/>';
    expect(checkSource(name, 'agent', svg(SQUARE + EYES + tick))).toEqual([]);
  });

  it('names teal in a system source', () => {
    expect(checkSource(name, 'system', svg(TRIANGLE + EYES + '<circle cx="80" cy="80" r="8" fill="#14857D"/>'))).toEqual([
      `${name} uses #14857D, which isn't in a system App's colours (#FF5A3C, #FFFFFF, #1D1B2F, #FFC93C)`,
    ]);
  });

  it('names tomato in an agent source', () => {
    expect(checkSource(name, 'agent', svg(SQUARE + EYES + '<circle cx="80" cy="80" r="8" fill="#ff5a3c"/>'))).toEqual([
      `${name} uses #FF5A3C, which isn't in an agent App's colours (#14857D, #FFFFFF, #1D1B2F, #FFC93C)`,
    ]);
  });

  it('names a colour outside every palette', () => {
    expect(checkSource(name, 'system', svg(TRIANGLE + EYES + '<circle cx="80" cy="80" r="8" fill="#000000"/>'))).toEqual([
      `${name} uses #000000, which isn't in a system App's colours (#FF5A3C, #FFFFFF, #1D1B2F, #FFC93C)`,
    ]);
  });

  it('names a gradient', () => {
    const grad = '<defs><linearGradient id="g"><stop offset="0" stop-color="#FFFFFF"/></linearGradient></defs>';
    expect(checkSource(name, 'system', svg(grad + TRIANGLE + EYES))).toEqual([
      `${name} has a <linearGradient>: an App avatar is flat, with no gradient, filter, mask or opacity`,
    ]);
  });

  it('names a filter and an opacity', () => {
    const body = '<filter id="f"/>' + TRIANGLE + '<circle cx="42" cy="56" r="4" fill="#FFFFFF" opacity="0.5"/>';
    expect(checkSource(name, 'system', svg(body))).toEqual([
      `${name} has a <filter>: an App avatar is flat, with no gradient, filter, mask or opacity`,
      `${name} has opacity="0.5": an App avatar is flat, with no gradient, filter, mask or opacity`,
    ]);
  });

  it('names a stroke that differs from its own fill, which would be an outline', () => {
    const outlined = '<circle cx="80" cy="80" r="8" fill="#FFC93C" stroke="#1D1B2F" stroke-width="2"/>';
    expect(checkSource(name, 'system', svg(TRIANGLE + EYES + outlined))).toEqual([
      `${name} has a <circle> with stroke #1D1B2F on fill #FFC93C, an outline: give the stroke its fill's colour, or fill="none" for a line`,
    ]);
  });

  it('names a shape with no fill of its own, which SVG would draw black', () => {
    expect(checkSource(name, 'system', svg(TRIANGLE + EYES + '<circle cx="80" cy="80" r="8"/>'))).toEqual([
      `${name} has a <circle> with no fill, which draws black: give every shape its own fill`,
    ]);
  });

  it("refuses an rgb() colour, a named colour and a style attribute, as colours it can't read", () => {
    const body = TRIANGLE + '<circle cx="42" cy="56" r="4" fill="rgb(255,255,255)"/>' +
      '<circle cx="58" cy="56" r="4" fill="white"/>' + '<rect x="70" y="70" width="8" height="8" fill="#1D1B2F" style="fill:#000"/>';
    expect(checkSource(name, 'system', svg(body))).toEqual([
      `${name} gives a colour as fill="rgb(255,255,255)", which the check can't read: use a six-digit hex`,
      `${name} gives a colour as fill="white", which the check can't read: use a six-digit hex`,
      `${name} has a style attribute (style="fill:#000"), which the check can't read: use fill and stroke attributes`,
    ]);
  });
});

describe('the real guide, sources and render config', () => {
  const rows = readAppTable(GUIDE);
  const sources = existsSync('brand/apps') ? readdirSync('brand/apps').filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)) : [];

  it("the guide's §5 lists troupe-run's seven Apps, and not dco", () => {
    expect(rows.map((r) => r.app).sort()).toEqual([
      'troupe-run-board', 'troupe-run-dependabot', 'troupe-run-dispatch', 'troupe-run-docs',
      'troupe-run-infrastructure', 'troupe-run-release', 'troupe-run-review',
    ]);
  });

  it('the guide, brand/apps/ and APPS list the same Apps', () => {
    expect(checkAppSet({ guide: rows.map((r) => r.app), sources, apps: APPS })).toEqual([]);
  });

  it("each App's source uses only its kind's colours", () => {
    expect(rows.filter((r) => sources.includes(r.app)).flatMap((r) =>
      checkSource(`brand/apps/${r.app}.svg`, r.kind, readFileSync(`brand/apps/${r.app}.svg`, 'utf8')))).toEqual([]);
  });

  it('each App renders to brand/out/app-<app>.png at 500×500 from the app-avatar template', () => {
    for (const app of APPS) {
      const entry = ASSETS.find((a) => a.out === `brand/out/app-${app}.png`);
      expect(entry, app).toMatchObject({ template: 'app-avatar.html', query: `app=${app}`, width: 500, height: 500 });
      expect(pngSize(readFileSync(entry!.out)), app).toEqual({ width: 500, height: 500 });
    }
  });
});
