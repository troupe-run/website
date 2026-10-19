import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openSource, parseFrontMatter, frontMatterProblems, renderPage, FRONT_MATTER_KEYS, SITE_KEYS,
} from '../../scripts/troupe-docs-lib.mjs';

// The site's reading of a page is troupe's (spec: versioned-docs; design D4). These tests read troupe's main
// (TROUPE_DOCS's checkout when it's set, otherwise the clone that `npm run docs:sync` keeps in .cache/), so a
// change to troupe's contract fails here, naming what changed.
const USERDOCS = 'packages/troupe/tests/userdocs.py';
let source: ReturnType<typeof openSource>;
let userdocs: string;
let work: string;
beforeAll(() => {
  source = openSource(process.env, { cacheDir: '.cache/troupe.git' });
  userdocs = source.kind === 'local' ? readFileSync(join(process.env.TROUPE_DOCS!, USERDOCS), 'utf8') : source.readRepo('main', USERDOCS);
  work = mkdtempSync(join(tmpdir(), 'troupe-userdocs-'));
  // userdocs.py finds the repository three folders up from itself, so give it three.
  mkdirSync(join(work, 'a/b/c'), { recursive: true });
  writeFileSync(join(work, 'a/b/c/userdocs.py'), userdocs);
});
afterAll(() => rmSync(work, { recursive: true, force: true }));

/** Runs troupe's own parse and problems over each text, as a JSON list of results. */
function troupeReads(texts: string[]): unknown[] {
  const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(join(work, 'a/b/c'))})
from userdocs import FrontMatterError, Page, parse, problems
out = []
for text in json.load(sys.stdin):
    try:
        front, body = parse(text)
        out.append({"front": front, "body": body, "problems": problems(Page(name="p", front=front, body=body))})
    except FrontMatterError as error:
        out.append({"error": str(error)})
print(json.dumps(out))`;
  const r = spawnSync('python3', ['-I', '-c', script], { input: JSON.stringify(texts), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`python3 failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}
function siteReads(texts: string[]): unknown[] {
  return texts.map((text) => {
    try {
      const { front, body } = parseFrontMatter(text);
      return { front, body, problems: frontMatterProblems(front, body) };
    } catch (error) {
      return { error: (error as Error).message };
    }
  });
}

describe("troupe's page contract", () => {
  it("allows exactly the keys troupe's FRONT_MATTER_KEYS allows, with the same types", () => {
    const block = /^FRONT_MATTER_KEYS = \{\n([\s\S]*?)\n\}/m.exec(userdocs)?.[1];
    expect(block, `no FRONT_MATTER_KEYS in troupe's ${USERDOCS}`).toBeDefined();
    const theirs = Object.fromEntries(
      [...block!.matchAll(/^\s*"(\w+)": (str|bool),$/gm)].map(([, k, t]) => [k, t === 'bool' ? 'boolean' : 'string']),
    );
    expect(FRONT_MATTER_KEYS).toEqual(theirs);
  });

  it("adds only the site's keys to a page: slug, editUrl, lastUpdated and pagefind", () => {
    const front = { title: 'T', description: 'D.', status: 'written', prerelease: false };
    const text = renderPage({ ref: 'troupe-v0.1.0', dir: 'v0.1' }, { path: 'programme/t.md', front, body: 'B', editUrl: false, date: '2026-01-01T00:00:00Z', pagefind: false });
    const keys = [...text.split('\n---\n')[0].matchAll(/^(\w+):/gm)].map(([, k]) => k);
    expect(keys.filter((k) => !(k in FRONT_MATTER_KEYS))).toEqual(SITE_KEYS);
    expect(SITE_KEYS).toEqual(['slug', 'editUrl', 'lastUpdated', 'pagefind']);
  });

  it("the content schema adds to Starlight's exactly troupe's keys that Starlight lacks: status, prerelease, purpose", () => {
    const config = readFileSync('src/content.config.ts', 'utf8');
    const extend = /blogSchema\(context\)\.extend\(\{([\s\S]*?)\}\),\n/.exec(config)?.[1] ?? '';
    const keys = [...extend.matchAll(/^\s*(\w+):/gm)].map(([, k]) => k);
    expect(keys).toEqual(Object.keys(FRONT_MATTER_KEYS).filter((k) => !['title', 'description'].includes(k)));
  });
});

// Every input both readers see, and must agree on: troupe's real pages, and generated front matter around the
// edges of the YAML subset (quoting, reserved words, numbers, indicators, comments, keys).
const VALUES = [
  'Theatres', '"Flows: fork, join"', 'Flows: fork, join', "'it''s'", "'it's'", 'yes', 'No', 'null', '~', '12', '-1.5',
  '+3', 'a # comment', 'a#b', '[a, b]', '{a: 1}', '- item', '?q', '&anchor', '*alias', '!tag', '|', '>', '%x', '@at',
  '`tick`', '"bad \\q escape"', '"ok \\"quoted\\""', 'true', 'false', 'True', 'ends:', 'a: b', ' lead', 'trail ', '٣',
  'é accents', '"\\u00e9"', "''", '""', 'C:\\path', 'tab\there', ' \t', "it's \"both\"",
];
const KEYS = ['title', 'description', 'status', 'prerelease', 'purpose', 'staus', 'Title', 'with_underscore', '9lives'];
function generated(): string[] {
  const out: string[] = [];
  for (const key of KEYS) for (const value of VALUES) out.push(`---\n${key}: ${value}\n---\n`);
  for (const status of ['written', 'planned', 'draft']) {
    for (const body of ['', '\n\nText.\n', '\n   \n']) {
      for (const extra of ['', 'prerelease: true\n', 'purpose: P.\n', 'prerelease: "no"\n']) {
        out.push(`---\ntitle: T\ndescription: D.\nstatus: ${status}\n${extra}---${body}`);
      }
    }
  }
  out.push('# no front matter\n', '---\ntitle: T\n', '---\ntitle: A\ntitle: B\n---\n', '---\nno separator\n---\n', '---\r\ntitle: T\r\n---\r\n');
  return out;
}

describe('the site reads front matter as troupe does', () => {
  it("agrees with troupe's userdocs.py on every page of troupe's main", () => {
    const texts = source.list('main').map((p: string) => source.read('main', p));
    expect(texts.length).toBeGreaterThan(0);
    expect(siteReads(texts)).toEqual(troupeReads(texts));
  });

  it(`agrees with troupe's userdocs.py on ${generated().length} generated pages around the subset's edges`, () => {
    const texts = generated();
    const site = siteReads(texts);
    const theirs = troupeReads(texts);
    const differ = texts.flatMap((t, i) => (JSON.stringify(site[i]) === JSON.stringify(theirs[i]) ? [] : [{ text: t, site: site[i], troupe: theirs[i] }]));
    expect(differ).toEqual([]);
  });
});
