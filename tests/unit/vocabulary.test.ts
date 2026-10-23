import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { section, table } from './support/markdown';

// The glossary is the single source of each term's meaning; the brand guide holds each term's status
// (troupe-run/troupe#15, spec: vocabulary). The glossary is troupe's docs/prompt-book/glossary.md on main, read as
// `npm run docs:sync` fetched it (troupe-run/website#23). troupe's own docs check holds the docs pages to the rules
// for "TBC" and "project"; this one holds the brand guide, the landing copy and the site's own pages.
const MANIFEST = 'src/generated/troupe-docs.json';
if (!existsSync(MANIFEST)) throw new Error(`${MANIFEST} is missing: run npm run docs:sync first, which fetches troupe's docs`);
const GLOSSARY: string = JSON.parse(readFileSync(MANIFEST, 'utf8')).glossary;
const BRAND_GUIDE = 'docs/brand-guide.md';
const GLOSSARY_SOURCE = 'https://github.com/troupe-run/troupe/blob/main/docs/prompt-book/glossary.md';

/** The site's own pages: every Starlight page outside the blog and the docs fetched from troupe. */
const SITE_PAGES = readdirSync('src/content/docs').filter((n) => n.endsWith('.md')).map((n) => `src/content/docs/${n}`);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const glossaryTerms = () => table(readFileSync(GLOSSARY, 'utf8')).rows.map((r) => r[0]);
const vocabulary = () => table(section(readFileSync(BRAND_GUIDE, 'utf8'), '6.'));
const isRejected = (status: string) => /^rejected\b/i.test(status);

describe('the glossary and the brand guide list the same terms', () => {
  it("every term the brand guide's §6 keeps has a glossary row, and every glossary row has a status there", () => {
    const kept = vocabulary().rows.filter((r) => !isRejected(r[1])).map((r) => r[0]);
    const glossary = glossaryTerms();
    expect({
      'kept in the guide, missing from the glossary': kept.filter((t) => !glossary.includes(t)),
      'in the glossary, with no status in the guide': glossary.filter((t) => !kept.includes(t)),
    }).toEqual({
      'kept in the guide, missing from the glossary': [],
      'in the glossary, with no status in the guide': [],
    });
  });

  it("no word the brand guide's §6 rejects has a glossary row", () => {
    const rejected = vocabulary().rows.filter((r) => isRejected(r[1])).map((r) => r[0]);
    expect(glossaryTerms().filter((t) => rejected.includes(t))).toEqual([]);
  });

  it("the brand guide's §6 table has only Term and Status columns", () => {
    expect(vocabulary().header).toEqual(['Term', 'Status']);
  });

  it("the brand guide's §6 links to the glossary's source in troupe and its published page", () => {
    const s6 = section(readFileSync(BRAND_GUIDE, 'utf8'), '6.');
    expect(s6).toContain(`](${GLOSSARY_SOURCE})`);
    expect(s6).toContain('https://troupe.run/docs/prompt-book/glossary/');
  });

  it("the brand guide's §6 writes each term plainly, with no code font, as troupe's glossary does", () => {
    const raw = section(readFileSync(BRAND_GUIDE, 'utf8'), '6.').split('\n').filter((l) => l.startsWith('| ') && !/^\| (Term|---)/.test(l));
    expect(raw.filter((l) => l.split('|')[1].includes('`'))).toEqual([]);
  });

  it("the brand guide's §6 rejects part and house rules", () => {
    const status = Object.fromEntries(vocabulary().rows.map((r) => [r[0], r[1]]));
    expect(isRejected(status['part'] ?? '')).toBe(true);
    expect(isRejected(status['house rules'] ?? '')).toBe(true);
  });

  it('the glossary has rows for stage, rehearsal, system and cue', () => {
    const glossary = glossaryTerms();
    expect(['stage', 'rehearsal', 'system', 'cue'].filter((t) => !glossary.includes(t))).toEqual([]);
  });

  it('the glossary marks cue as provisional', () => {
    const cue = table(readFileSync(GLOSSARY, 'utf8')).rows.find((r) => r[0] === 'cue');
    expect(cue?.[1]).toMatch(/provisional/i);
  });
});

describe('"the house" is an agreed name', () => {
  it('the brand guide, the landing copy and the site\'s own pages say neither "TBC" nor "isn\'t final"', () => {
    const found = [BRAND_GUIDE, ...files('src/content/copy'), ...SITE_PAGES].flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((l, i) => ({ f, line: i + 1, l }))
        .filter(({ l }) => /\bTBC\b|isn['’]t final/i.test(l))
        .map(({ f, line, l }) => `${f}:${line}: ${l.trim()}`),
    );
    expect(found).toEqual([]);
  });

  it("the brand guide's §10 has no open point on the house", () => {
    expect(section(readFileSync(BRAND_GUIDE, 'utf8'), '10.')).not.toMatch(/the house|house rules/i);
  });
});

// Every place the landing copy and the site's own pages say "project", with why it isn't a theatre (spec:
// vocabulary). `text` is a fragment of the line, so an edit elsewhere in the file doesn't break the match. A new
// "project" fails until it's recorded here. The blog isn't scanned: its posts are dated and talk about other projects
// (owner, 2026-10-19). The docs pages aren't either: troupe's docs check records theirs.
const SCANNED = ['src/content/copy', ...SITE_PAGES];
const PROJECT_USES: { file: string; text: string; reason: string }[] = [
  {
    file: 'src/content/copy/principles.md',
    text: 'A theatre is your project directory:',
    reason: 'explains what a theatre is, the first time the landing page says it',
  },
  { file: 'src/content/copy/footer.md', text: 'a project by hps.gd', reason: 'troupe itself, the fixed attribution' },
  {
    file: 'src/content/docs/status.md',
    text: '(https://github.com/orgs/troupe-run/projects/1)',
    reason: "the roadmap board's URL on GitHub, which GitHub names; the link's text says \"roadmap board\"",
  },
];

describe('site copy says "theatre" for a theatre', () => {
  const scanned = SCANNED.flatMap((d) => (statSync(d).isDirectory() ? files(d) : [d]));
  const uses = scanned.flatMap((f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .map((l, i) => ({ f, line: i + 1, l }))
      .filter(({ l }) => /\bprojects?\b/i.test(l)),
  );
  const recorded = (f: string, l: string) => PROJECT_USES.some((u) => u.file === f && l.includes(u.text));

  it("the scan reads the landing copy and the site's own pages, and no blog post or page fetched from troupe", () => {
    expect(scanned).toContain('src/content/copy/principles.md');
    expect(scanned).toContain('src/content/docs/status.md');
    expect(scanned.filter((f) => f.startsWith('src/content/docs/blog/') || f.startsWith('src/content/docs/docs/'))).toEqual([]);
  });

  it('every "project" in the landing copy and the site\'s own pages is recorded with a reason', () => {
    expect(
      uses.filter(({ f, l }) => !recorded(f, l)).map(({ f, line, l }) => `${f}:${line}: ${l.trim()}`),
      'Where "project" means a theatre, say "theatre" (brand guide §7). Otherwise add the line to PROJECT_USES in ' +
        'tests/unit/vocabulary.test.ts, with why it is not a theatre.',
    ).toEqual([]);
  });

  it('every recorded "project" is still in the copy', () => {
    const stale = PROJECT_USES.filter((u) => !uses.some(({ f, l }) => f === u.file && l.includes(u.text)));
    expect(stale.map((u) => `${u.file}: "${u.text}"`)).toEqual([]);
  });
});
