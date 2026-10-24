import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { sync } from '../../scripts/troupe-docs-lib.mjs';
import { makeRepo, page, SCHEMAS, type Repo } from './support/git-repo';

// What the sync writes for each version (spec: versioned-docs; design D4, D7, D8), from a throwaway troupe:
//   troupe-v0.1.0  a, gone      troupe-v0.2.0  a, removed      main  a, added
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));

function troupe(): Repo {
  const r = makeRepo();
  cleanup.push(r.remove);
  r.commit({ ...SCHEMAS, 'docs/programme/a.md': page('A'), 'docs/programme/gone.md': page('Gone') }, '2026-01-01T00:00:00Z', ['troupe-v0.1.0']);
  r.commit({ 'docs/programme/gone.md': null, 'docs/backstage/removed.md': page('Removed') }, '2026-02-01T00:00:00Z', ['troupe-v0.2.0']);
  r.commit({ 'docs/backstage/removed.md': null, 'docs/stagecraft/added.md': page('Added') }, '2026-03-01T00:00:00Z');
  return r;
}
function site(): string {
  const root = mkdtempSync(join(tmpdir(), 'troupe-docs-site-'));
  cleanup.push(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
// Read back as YAML, as Astro reads it (the yaml package's 1.2 schema leaves the date a string).
function docs(root: string, path: string) {
  const [, head, body] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(readFileSync(join(root, 'src/content/docs/docs', path), 'utf8'))!;
  return { front: parse(head), body };
}
const EDIT = 'https://github.com/troupe-run/troupe/edit/main/docs/';

describe('sync', () => {
  it('writes each version where its URL is: the latest at the root, then next/ and vX.Y/', () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    for (const p of ['programme/a.md', 'backstage/removed.md', 'next/stagecraft/added.md', 'v0.1/programme/gone.md']) {
      expect(existsSync(join(root, 'src/content/docs/docs', p)), p).toBe(true);
    }
    expect(existsSync(join(root, 'src/content/docs/docs/v0.2'))).toBe(false);
  });

  it("keeps troupe's fields as they were, and adds only slug, editUrl, lastUpdated and pagefind", () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    const { front, body } = docs(root, 'next/programme/a.md');
    expect(Object.keys(front)).toEqual(['title', 'description', 'status', 'prerelease', 'slug', 'editUrl', 'lastUpdated', 'pagefind']);
    expect(front).toMatchObject({ title: 'A', description: 'About A.', status: 'written', prerelease: false });
    expect(body).toContain("A's text.");
  });

  it('a page of the latest release, still on main: an edit link to main, a date, and in search', () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'programme/a.md');
    expect(front.editUrl).toBe(`${EDIT}programme/a.md`);
    expect(front.lastUpdated).toBe('2026-01-01T00:00:00Z');
    expect(front.pagefind).toBeUndefined();
  });

  it('a page of the latest release that main no longer has: no edit link', () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'backstage/removed.md').front.editUrl).toBe(false);
  });

  it('a page of next: an edit link to main, and out of search', () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'next/stagecraft/added.md');
    expect(front.editUrl).toBe(`${EDIT}stagecraft/added.md`);
    expect(front.pagefind).toBe(false);
  });

  it("names each page's URL path in its slug, keeping the dot in v0.1, which Astro's own slugs drop", () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'v0.1/programme/gone.md').front.slug).toBe('docs/v0.1/programme/gone');
    expect(docs(root, 'next/stagecraft/added.md').front.slug).toBe('docs/next/stagecraft/added');
    expect(docs(root, 'programme/a.md').front.slug).toBe('docs/programme/a');
  });

  it('a page of an archived version: no edit link, and out of search', () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'v0.1/programme/gone.md');
    expect(front.editUrl).toBe(false);
    expect(front.pagefind).toBe(false);
  });

  it('before any release, main is at the root, editable and in search', () => {
    const r = makeRepo();
    cleanup.push(r.remove);
    r.commit({ ...SCHEMAS, 'docs/programme/a.md': page('A') }, '2026-01-01T00:00:00Z');
    const root = site();
    const manifest = sync({ env: {}, root, remote: r.path });
    expect(manifest.versions.map((v: { role: string }) => v.role)).toEqual(['current']);
    expect(docs(root, 'programme/a.md').front).toMatchObject({ editUrl: `${EDIT}programme/a.md` });
    expect(docs(root, 'programme/a.md').front.pagefind).toBeUndefined();
  });

  it("says where each page came from, and to edit it there, in a comment Markdown doesn't render", () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'v0.1/programme/gone.md').body).toMatch(
      /^<!-- Generated from troupe-run\/troupe troupe-v0\.1\.0:docs\/programme\/gone\.md by npm run docs:sync\. Edit it there, not here\. -->/,
    );
  });

  it("writes a manifest of the versions, their refs and pages, and main's glossary path", () => {
    const root = site();
    sync({ env: {}, root, remote: troupe().path });
    const manifest = JSON.parse(readFileSync(join(root, 'src/generated/troupe-docs.json'), 'utf8'));
    expect(manifest.versions.map((v: { role: string; ref: string; pages: { path: string }[] }) => [v.role, v.ref, v.pages.map((p) => p.path)])).toEqual([
      ['next', 'main', ['programme/a.md', 'stagecraft/added.md']],
      ['current', 'troupe-v0.2.0', ['backstage/removed.md', 'programme/a.md']],
      ['archived', 'troupe-v0.1.0', ['programme/a.md', 'programme/gone.md']],
    ]);
    expect(manifest.glossary).toBe(join(root, 'src/content/docs/docs/next/prompt-book/glossary.md'));
  });

  it("records in the manifest the release tags the versions were chosen from, each with its date, and no other tag (spec: roadmap)", () => {
    const root = site();
    const r = troupe();
    r.git('tag', 'not-a-release');
    const manifest = sync({ env: {}, root, remote: r.path });
    expect(manifest.releases).toEqual([
      { tag: 'troupe-v0.1.0', date: '2026-01-01T00:00:00Z' },
      { tag: 'troupe-v0.2.0', date: '2026-02-01T00:00:00Z' },
    ]);
    expect(JSON.parse(readFileSync(join(root, 'src/generated/troupe-docs.json'), 'utf8')).releases).toEqual(manifest.releases);
  });

  it('removes pages that troupe no longer has on the next run', () => {
    const r = troupe();
    const root = site();
    sync({ env: {}, root, remote: r.path });
    r.commit({ 'docs/stagecraft/added.md': null }, '2026-04-01T00:00:00Z');
    sync({ env: {}, root, remote: r.path });
    expect(existsSync(join(root, 'src/content/docs/docs/next/stagecraft/added.md'))).toBe(false);
  });

  it("refuses a version with a bad page, naming the version, the page and the problem, and writes nothing", () => {
    const r = troupe();
    r.commit({ 'docs/programme/a.md': page('A').replace('status: written', 'staus: written') }, '2026-05-01T00:00:00Z', ['troupe-v0.3.0']);
    r.commit({ 'docs/programme/a.md': page('A') }, '2026-05-02T00:00:00Z');
    const root = site();
    expect(() => sync({ env: {}, root, remote: r.path })).toThrow(
      /^troupe-v0\.3\.0 can't be built into \/docs:\n {2}- docs\/programme\/a\.md: `staus` isn't a front-matter key/,
    );
    expect(existsSync(join(root, 'src/content/docs/docs'))).toBe(false);
  });

  it("refuses to clear a docs folder it didn't write", () => {
    const root = site();
    mkdirSync(join(root, 'src/content/docs/docs'), { recursive: true });
    writeFileSync(join(root, 'src/content/docs/docs/mine.md'), 'hand-written');
    expect(() => sync({ env: {}, root, remote: troupe().path })).toThrow(/holds files the docs sync didn't write/);
    expect(readFileSync(join(root, 'src/content/docs/docs/mine.md'), 'utf8')).toBe('hand-written');
  });
});
