import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { LIMIT, PARTS, pageDescription, readSet, setProblems, type DescriptionSet } from './support/descriptions';

// The brand guide's §7 records how troupe is described; every place on this site that describes troupe is held to it
// here (troupe-run/website#26, spec: descriptions). GitHub's side is held to the same text in troupe-run/infrastructure.
const BRAND_GUIDE = 'docs/brand-guide.md';
const HERO = 'src/content/copy/hero.md';
const INDEX = 'src/pages/index.astro';
const BANNER = 'brand/templates/readme-banner.html';

const set = () => readSet(readFileSync(BRAND_GUIDE, 'utf8'));

/** A brand guide holding only §7's table, with `rows` as its rows. */
const guideWith = (rows: [string, string][]) =>
  `# guide\n\n## 7. Voice\n\nText.\n\n### How troupe is described\n\n| Part | Text |\n|---|---|\n` +
  rows.map(([p, t]) => `| ${p} | ${t} |`).join('\n') + '\n\n## 8. Assets\n';

const AGREED: DescriptionSet = {
  Tagline: 'Your agents need a director.',
  Sentence: 'troupe runs your development process with a team of agents, asking only when it needs you.',
  Paragraph: 'troupe runs your development process with a team of agents, asking only when it needs you. ' +
    'Work branches and loops, decisions go to whoever owns them, and every decision records who made it.',
  'Status line': "Pre-alpha: there's nothing to install yet.",
  'One-line description': 'Your agents need a director. ' +
    'troupe runs your development process with a team of agents, asking only when it needs you.',
  'Page title': 'troupe: your agents need a director',
};
const rows = (s: DescriptionSet) => PARTS.map((p) => [p, s[p]] as [string, string]);

describe("the brand guide's record of how troupe is described", () => {
  it('holds the text agreed on 2026-10-20 (troupe-run/infrastructure#108), part for part', () => {
    expect(set()).toEqual(AGREED);
  });

  it('agrees with itself: the paragraph opens with the sentence, and the one-line description is the tagline, then the sentence, within 160 characters', () => {
    expect(setProblems(set())).toEqual([]);
  });
});

describe('reading and checking the set', () => {
  it('a table missing a part is refused, naming the part', () => {
    const guide = guideWith(rows(AGREED).filter(([p]) => p !== 'Status line'));
    expect(() => readSet(guide)).toThrow('missing ["Status line"]');
  });

  it('a table with a part it doesn\'t know is refused, naming the part', () => {
    const guide = guideWith([...rows(AGREED), ['Slogan', 'x']]);
    expect(() => readSet(guide)).toThrow('unknown ["Slogan"]');
  });

  it('a guide with no "How troupe is described" subsection in §7 is refused, naming the subsection', () => {
    expect(() => readSet('# guide\n\n## 7. Voice\n\nText.\n')).toThrow('has no "### How troupe is described" subsection');
  });

  it('reading a table built from the agreed set gives the agreed set back', () => {
    expect(readSet(guideWith(rows(AGREED)))).toEqual(AGREED);
  });

  it("a paragraph that doesn't open with the sentence is named, with the sentence it should open with", () => {
    expect(setProblems({ ...AGREED, Sentence: 'troupe runs your process.' })).toContain(
      'the paragraph doesn\'t open with the sentence "troupe runs your process."');
  });

  it("a one-line description that isn't the tagline, then the sentence, is named, with the text it should be", () => {
    expect(setProblems({ ...AGREED, 'One-line description': AGREED.Sentence })).toEqual([
      `the one-line description isn't the tagline, then the sentence: it should be "${AGREED['One-line description']}"`,
    ]);
  });

  it(`a one-line description of ${LIMIT + 1} characters is named, with its length and the limit`, () => {
    const sentence = 'x'.repeat(LIMIT - AGREED.Tagline.length);
    const long = { ...AGREED, Sentence: sentence, Paragraph: sentence, 'One-line description': `${AGREED.Tagline} ${sentence}` };
    expect(setProblems(long)).toEqual([`the one-line description is ${LIMIT + 1} characters, over the limit of ${LIMIT}`]);
  });

  it(`a one-line description of exactly ${LIMIT} characters passes`, () => {
    const sentence = 'x'.repeat(LIMIT - 1 - AGREED.Tagline.length);
    const edge = { ...AGREED, Sentence: sentence, Paragraph: sentence, 'One-line description': `${AGREED.Tagline} ${sentence}` };
    expect(setProblems(edge)).toEqual([]);
  });
});

describe('the site describes troupe as the brand guide does', () => {
  const hero = () => parse(readFileSync(HERO, 'utf8').split(/^---$/m)[1]);
  /** A string prop passed to <Landing> in the landing page. */
  const landingProp = (name: string) => {
    const m = readFileSync(INDEX, 'utf8').match(new RegExp(`<Landing[^>]*\\s${name}="([^"]*)"`));
    if (!m) throw new Error(`${INDEX} passes no ${name}="..." to <Landing>`);
    return m[1];
  };

  it("the hero's title is the tagline", () => {
    expect(hero().title, `${HERO}: title should be the tagline`).toBe(set().Tagline);
  });

  it("the hero's subtitle is the paragraph", () => {
    expect(hero().subtitle, `${HERO}: subtitle should be the paragraph`).toBe(set().Paragraph);
  });

  it("the landing page's title is the page title", () => {
    expect(landingProp('title'), `${INDEX}: title should be the page title`).toBe(set()['Page title']);
  });

  it("the landing page's description is the one-line description, then the status line", () => {
    expect(landingProp('description'), `${INDEX}: description should be the one-line description, then the status line`)
      .toBe(pageDescription(set()));
  });

  it("the README banner's line under the wordmark is the tagline", () => {
    const m = readFileSync(BANNER, 'utf8').match(/<p class="sub">([^<]*)<\/p>/);
    expect(m?.[1], `${BANNER}: the .sub line should be the tagline`).toBe(set().Tagline);
  });
});
