import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The glossary is the single source of each term's meaning; the brand guide holds each term's status
// (troupe-run/troupe#15, spec: vocabulary). When the docs move to troupe (#23), GLOSSARY changes here.
const GLOSSARY = 'src/content/docs/docs/prompt-book/glossary.md';
const BRAND_GUIDE = 'docs/brand-guide.md';
const HOUSE_PAGE = 'src/content/docs/docs/the-company/the-house.md';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** The text of a `## ` section whose heading starts with `prefix`, up to the next `## ` heading. */
function section(text: string, prefix: string): string {
  const start = text.indexOf(`\n## ${prefix}`);
  if (start < 0) throw new Error(`no section "## ${prefix}"`);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
}

/** The first Markdown table in `text`: its header cells and its rows. Backticks are stripped from cells. */
function table(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split('\n');
  const first = lines.findIndex((l) => l.trimStart().startsWith('|'));
  if (first < 0) throw new Error('no table');
  const block: string[] = [];
  for (const l of lines.slice(first)) {
    if (!l.trimStart().startsWith('|')) break;
    block.push(l);
  }
  const cells = (l: string) =>
    l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, ''));
  return { header: cells(block[0]), rows: block.slice(2).map(cells) };
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

  it("the brand guide's §6 links to the glossary's source and its published page", () => {
    const s6 = section(readFileSync(BRAND_GUIDE, 'utf8'), '6.');
    expect(s6).toContain(`](../${GLOSSARY})`);
    expect(s6).toContain('https://troupe.run/docs/prompt-book/glossary/');
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
  it('the glossary, the house page and the brand guide say neither "TBC" nor "isn\'t final"', () => {
    const found = [GLOSSARY, HOUSE_PAGE, BRAND_GUIDE].flatMap((f) =>
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

// Every place the docs and landing copy say "project", with why it isn't a theatre (spec: vocabulary). `text` is a
// fragment of the line, so an edit elsewhere in the file doesn't break the match. A new "project" fails until it's
// recorded here. The blog isn't scanned: its posts are dated and talk about other projects (owner, 2026-10-19).
const SCANNED = ['src/content/docs/docs', 'src/content/copy'];
const PROJECT_USES: { file: string; text: string; reason: string }[] = [
  { file: GLOSSARY, text: 'A project directory with troupe config', reason: 'explains what a theatre is' },
  {
    file: 'src/content/docs/docs/programme/what-is-troupe.md',
    text: 'the project directory troupe works in',
    reason: 'explains what a theatre is',
  },
  {
    file: 'src/content/docs/docs/programme/principles.md',
    text: 'A theatre is your project directory.',
    reason: 'explains what a theatre is',
  },
  {
    file: 'src/content/copy/principles.md',
    text: 'A theatre is your project directory:',
    reason: 'explains what a theatre is, the first time the landing page says it',
  },
  { file: 'src/content/copy/footer.md', text: 'a project by hps.gd', reason: 'troupe itself, the fixed attribution' },
  {
    file: 'src/content/docs/docs/backstage/contributing.md',
    text: "under the project's licence",
    reason: 'troupe itself',
  },
];

describe('site copy says "theatre" for a theatre', () => {
  const scanned = SCANNED.flatMap((d) => files(d));
  const uses = scanned.flatMap((f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .map((l, i) => ({ f, line: i + 1, l }))
      .filter(({ l }) => /\bprojects?\b/i.test(l)),
  );
  const recorded = (f: string, l: string) => PROJECT_USES.some((u) => u.file === f && l.includes(u.text));

  it('the scan reads the docs and landing copy, and no blog post', () => {
    expect(scanned).toContain(GLOSSARY);
    expect(scanned).toContain('src/content/copy/principles.md');
    expect(scanned.filter((f) => f.startsWith('src/content/docs/blog/'))).toEqual([]);
  });

  it('every "project" in the docs and landing copy is recorded with a reason', () => {
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
