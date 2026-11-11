import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { sync } from '../../scripts/troupe-docs-lib.mjs';
import { makeRepo, page, SCHEMAS, type Repo } from './support/git-repo';

// What the sync writes for each version (spec: versioned-docs; design D4, D7, D8), from a throwaway troupe:
//   troupe-run-v0.1.0  a, gone      troupe-run-v0.2.0  a, removed      main  a, added
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));

function troupe(): Repo {
  const r = makeRepo();
  cleanup.push(r.remove);
  r.commit({ ...SCHEMAS, 'docs/programme/a.md': page('A'), 'docs/programme/gone.md': page('Gone') }, '2026-01-01T00:00:00Z', ['troupe-run-v0.1.0']);
  r.commit({ 'docs/programme/gone.md': null, 'docs/backstage/removed.md': page('Removed') }, '2026-02-01T00:00:00Z', ['troupe-run-v0.2.0']);
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
  it('writes each version where its URL is: the latest at the root, then next/ and vX.Y/', async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    for (const p of ['programme/a.md', 'backstage/removed.md', 'next/stagecraft/added.md', 'v0.1/programme/gone.md']) {
      expect(existsSync(join(root, 'src/content/docs/docs', p)), p).toBe(true);
    }
    expect(existsSync(join(root, 'src/content/docs/docs/v0.2'))).toBe(false);
  });

  it("keeps troupe's fields as they were, and adds only slug, editUrl, lastUpdated and pagefind", async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    const { front, body } = docs(root, 'next/programme/a.md');
    expect(Object.keys(front)).toEqual(['title', 'description', 'status', 'prerelease', 'slug', 'editUrl', 'lastUpdated', 'pagefind']);
    expect(front).toMatchObject({ title: 'A', description: 'About A.', status: 'written', prerelease: false });
    expect(body).toContain("A's text.");
  });

  it('a page of the latest release, still on main: an edit link to main, a date, and in search', async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'programme/a.md');
    expect(front.editUrl).toBe(`${EDIT}programme/a.md`);
    expect(front.lastUpdated).toBe('2026-01-01T00:00:00Z');
    expect(front.pagefind).toBeUndefined();
  });

  it('a page of the latest release that main no longer has: no edit link', async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'backstage/removed.md').front.editUrl).toBe(false);
  });

  it('a page of next: an edit link to main, and out of search', async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'next/stagecraft/added.md');
    expect(front.editUrl).toBe(`${EDIT}stagecraft/added.md`);
    expect(front.pagefind).toBe(false);
  });

  it("names each page's URL path in its slug, keeping the dot in v0.1, which Astro's own slugs drop", async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'v0.1/programme/gone.md').front.slug).toBe('docs/v0.1/programme/gone');
    expect(docs(root, 'next/stagecraft/added.md').front.slug).toBe('docs/next/stagecraft/added');
    expect(docs(root, 'programme/a.md').front.slug).toBe('docs/programme/a');
  });

  it('a page of an archived version: no edit link, and out of search', async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    const { front } = docs(root, 'v0.1/programme/gone.md');
    expect(front.editUrl).toBe(false);
    expect(front.pagefind).toBe(false);
  });

  it('before any release, main is at the root, editable and in search', async () => {
    const r = makeRepo();
    cleanup.push(r.remove);
    r.commit({ ...SCHEMAS, 'docs/programme/a.md': page('A') }, '2026-01-01T00:00:00Z');
    const root = site();
    const manifest = await sync({ env: {}, root, remote: r.path });
    expect(manifest.versions.map((v: { role: string }) => v.role)).toEqual(['current']);
    expect(docs(root, 'programme/a.md').front).toMatchObject({ editUrl: `${EDIT}programme/a.md` });
    expect(docs(root, 'programme/a.md').front.pagefind).toBeUndefined();
  });

  it("says where each page came from, and to edit it there, in a comment Markdown doesn't render", async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    expect(docs(root, 'v0.1/programme/gone.md').body).toMatch(
      /^<!-- Generated from troupe-run\/troupe troupe-run-v0\.1\.0:docs\/programme\/gone\.md by npm run docs:sync\. Edit it there, not here\. -->/,
    );
  });

  it("writes a manifest of the versions, their refs and pages, and main's glossary path", async () => {
    const root = site();
    await sync({ env: {}, root, remote: troupe().path });
    const manifest = JSON.parse(readFileSync(join(root, 'src/generated/troupe-docs.json'), 'utf8'));
    expect(manifest.versions.map((v: { role: string; ref: string; pages: { path: string }[] }) => [v.role, v.ref, v.pages.map((p) => p.path)])).toEqual([
      ['next', 'main', ['programme/a.md', 'stagecraft/added.md']],
      ['current', 'troupe-run-v0.2.0', ['backstage/removed.md', 'programme/a.md']],
      ['archived', 'troupe-run-v0.1.0', ['programme/a.md', 'programme/gone.md']],
    ]);
    expect(manifest.glossary).toBe(join(root, 'src/content/docs/docs/next/prompt-book/glossary.md'));
  });

  it("records in the manifest the release tags the versions were chosen from, each with its date, and no other tag (spec: roadmap)", async () => {
    const root = site();
    const r = troupe();
    r.git('tag', 'not-a-release');
    r.git('tag', 'troupe-v0.3.0'); // core's tag, on main: another component's, so not a release
    const manifest = await sync({ env: {}, root, remote: r.path });
    expect(manifest.releases).toEqual([
      { tag: 'troupe-run-v0.1.0', date: '2026-01-01T00:00:00Z' },
      { tag: 'troupe-run-v0.2.0', date: '2026-02-01T00:00:00Z' },
    ]);
    expect(JSON.parse(readFileSync(join(root, 'src/generated/troupe-docs.json'), 'utf8')).releases).toEqual(manifest.releases);
  });

  it('removes pages that troupe no longer has on the next run', async () => {
    const r = troupe();
    const root = site();
    await sync({ env: {}, root, remote: r.path });
    r.commit({ 'docs/stagecraft/added.md': null }, '2026-04-01T00:00:00Z');
    await sync({ env: {}, root, remote: r.path });
    expect(existsSync(join(root, 'src/content/docs/docs/next/stagecraft/added.md'))).toBe(false);
  });

  it("refuses a version with a bad page, naming the version, the page and the problem, and writes nothing", async () => {
    const r = troupe();
    r.commit({ 'docs/programme/a.md': page('A').replace('status: written', 'staus: written') }, '2026-05-01T00:00:00Z', ['troupe-run-v0.3.0']);
    r.commit({ 'docs/programme/a.md': page('A') }, '2026-05-02T00:00:00Z');
    const root = site();
    await expect(sync({ env: {}, root, remote: r.path })).rejects.toThrow(
      /^troupe-run-v0\.3\.0 can't be built into \/docs:\n {2}- docs\/programme\/a\.md: `staus` isn't a front-matter key/,
    );
    expect(existsSync(join(root, 'src/content/docs/docs'))).toBe(false);
  });

  it("refuses to clear a docs folder it didn't write", async () => {
    const root = site();
    mkdirSync(join(root, 'src/content/docs/docs'), { recursive: true });
    writeFileSync(join(root, 'src/content/docs/docs/mine.md'), 'hand-written');
    await expect(sync({ env: {}, root, remote: troupe().path })).rejects.toThrow(/holds files the docs sync didn't write/);
    expect(readFileSync(join(root, 'src/content/docs/docs/mine.md'), 'utf8')).toBe('hand-written');
  });
});

// Links from troupe's main into troupe's repository lead somewhere, checked against the source before anything is
// written (spec: versioned-docs; design D1 to D5). troupe-run/website#112: the changelog page linked three changelogs
// that a first release hadn't written yet.
describe("links from troupe's main into troupe's repository", () => {
  const REPO = 'https://github.com/troupe-run/troupe';
  //   troupe-run-v0.1.0  docs/programme/a.md, packages/troupe/CHANGELOG.md     main  + protocol/CHANGELOG.md, plugins/
  function linking(mainPages: Record<string, string>, releasePages: Record<string, string> = {}): Repo {
    const r = makeRepo();
    cleanup.push(r.remove);
    r.commit(
      { ...SCHEMAS, 'docs/programme/a.md': page('A'), 'packages/troupe/CHANGELOG.md': 'c\n', ...releasePages },
      '2026-01-01T00:00:00Z',
      ['troupe-run-v0.1.0'],
    );
    r.commit({ 'protocol/CHANGELOG.md': 'p\n', 'plugins/runner/README.md': 'r\n', ...mainPages }, '2026-02-01T00:00:00Z');
    return r;
  }
  const changelog = (body: string) => ({ 'docs/backstage/changelog.md': page('Changelog', body) });

  it('refuses a link to a changelog main lacks, naming the version, the page, the link and the fix', async () => {
    const url = `${REPO}/blob/main/plugins/runner-ollama/CHANGELOG.md`;
    await expect(sync({ env: {}, root: site(), remote: linking(changelog(`- [ollama](${url})`)).path })).rejects.toThrow(
      "troupe's main can't be built into /docs:\n" +
        `  - docs/backstage/changelog.md: the link ${url} names plugins/runner-ollama/CHANGELOG.md, which isn't at main: ` +
        'link it once it exists, or link a path that does',
    );
  });

  it('writes nothing when a link fails', async () => {
    const root = site();
    const r = linking(changelog(`[x](${REPO}/blob/main/missing.md)`));
    await expect(sync({ env: {}, root, remote: r.path })).rejects.toThrow(/missing\.md, which isn't at main/);
    expect(existsSync(join(root, 'src/content/docs/docs'))).toBe(false);
    expect(existsSync(join(root, 'public/protocol'))).toBe(false);
  });

  it('accepts links to a file, a folder, the root, and a path with an anchor or a query, and leaves them as written', async () => {
    const root = site();
    const links = [
      `${REPO}/blob/main/protocol/CHANGELOG.md`,
      `${REPO}/tree/main/plugins`,
      `${REPO}/tree/main`,
      `${REPO}/blob/main/plugins/runner/README.md#setup`,
      `${REPO}/blob/main/protocol/CHANGELOG.md?plain=1`,
    ];
    await sync({ env: {}, root, remote: linking(changelog(links.map((l) => `- [x](${l})`).join('\n'))).path });
    const written = readFileSync(join(root, 'src/content/docs/docs/next/backstage/changelog.md'), 'utf8');
    for (const l of links) expect(written).toContain(`(${l})`);
  });

  it('checks a link at the tag it names, not at main', async () => {
    const atTag = `${REPO}/blob/troupe-run-v0.1.0/packages/troupe/CHANGELOG.md`;
    await sync({ env: {}, root: site(), remote: linking(changelog(`[c](${atTag})`)).path });
    const gone = `${REPO}/blob/troupe-run-v0.1.0/protocol/CHANGELOG.md`;
    await expect(sync({ env: {}, root: site(), remote: linking(changelog(`[p](${gone})`)).path })).rejects.toThrow(
      `the link ${gone} names protocol/CHANGELOG.md, which isn't at troupe-run-v0.1.0`,
    );
  });

  it("refuses a link at a ref the source doesn't have, naming the ref and saying to link main, a tag or a commit", async () => {
    const url = `${REPO}/blob/some-branch/README.md`;
    await expect(sync({ env: {}, root: site(), remote: linking(changelog(`[r](${url})`)).path })).rejects.toThrow(
      `docs/backstage/changelog.md: the link ${url} names some-branch, which isn't main, a tag or a commit in ` +
        'troupe-run/troupe: link main, a tag or a commit',
    );
  });

  // The URL parser resolves %2e%2e itself, as a browser does, but an encoded slash only becomes one after decoding.
  it('refuses a link whose path climbs out once its encoded slashes are decoded', async () => {
    const url = `${REPO}/blob/main/docs%2F..%2F..%2Fetc/passwd`;
    await expect(sync({ env: {}, root: site(), remote: linking(changelog(`[x](${url})`)).path })).rejects.toThrow(
      `docs/backstage/changelog.md: the link ${url}: "docs/../../etc/passwd" isn't a path in troupe's repository`,
    );
  });

  it('names every broken link on every page in one failure', async () => {
    const r = linking({
      'docs/backstage/changelog.md': page('Changelog', `[a](${REPO}/blob/main/plugins/runner-openai/CHANGELOG.md)`),
      'docs/stagecraft/notes.md': page('Notes', `See ${REPO}/blob/main/packages/troupe-plugin-sdk/CHANGELOG.md for it.`),
    });
    const failure = sync({ env: {}, root: site(), remote: r.path });
    await expect(failure).rejects.toThrow(/docs\/backstage\/changelog\.md: .*runner-openai\/CHANGELOG\.md, which isn't at main/);
    await expect(failure).rejects.toThrow(/docs\/stagecraft\/notes\.md: .*troupe-plugin-sdk\/CHANGELOG\.md, which isn't at main/);
  });

  it("doesn't check a link in a code block, and leaves it as written", async () => {
    const root = site();
    const body = '```md\n[x](https://github.com/troupe-run/troupe/blob/main/missing.md)\n```\n\nAnd `' + REPO + '/blob/main/gone.md`.';
    await sync({ env: {}, root, remote: linking(changelog(body)).path });
    expect(readFileSync(join(root, 'src/content/docs/docs/next/backstage/changelog.md'), 'utf8')).toContain(
      '[x](https://github.com/troupe-run/troupe/blob/main/missing.md)',
    );
  });

  it("doesn't check a page from a release tag, which can't be fixed", async () => {
    const tagged = { 'docs/backstage/old.md': page('Old', `[g](${REPO}/blob/main/gone.md)`) };
    // main drops the page, so only the tag has the broken link.
    const r = linking({ 'docs/backstage/old.md': null } as unknown as Record<string, string>, tagged);
    const manifest = await sync({ env: {}, root: site(), remote: r.path });
    expect(manifest.versions.find((v: { ref: string }) => v.ref === 'troupe-run-v0.1.0').pages.map((p: { path: string }) => p.path)).toContain('backstage/old.md');
  });

  it('checks main when no release exists yet, as /docs/ is read from main then', async () => {
    const r = makeRepo();
    cleanup.push(r.remove);
    r.commit({ ...SCHEMAS, 'docs/programme/a.md': page('A', `[x](${REPO}/blob/main/missing.md)`) }, '2026-01-01T00:00:00Z');
    await expect(sync({ env: {}, root: site(), remote: r.path })).rejects.toThrow(/missing\.md, which isn't at main/);
  });

  it("counts a file in a local checkout's working tree that isn't committed yet", async () => {
    const r = linking(changelog(`[n](${REPO}/blob/main/NEW.md)`));
    await expect(sync({ env: { TROUPE_DOCS: r.path }, root: site() })).rejects.toThrow(/NEW\.md, which isn't at main/);
    writeFileSync(join(r.path, 'NEW.md'), 'n\n');
    await sync({ env: { TROUPE_DOCS: r.path }, root: site() });
  });

  it("doesn't check other links to GitHub, such as an issue, a release or the front page", async () => {
    const body = [`${REPO}/issues/366`, `${REPO}/releases`, REPO, 'https://github.com/troupe-run/website/blob/main/gone.md']
      .map((l) => `- [x](${l})`).join('\n');
    await sync({ env: {}, root: site(), remote: linking(changelog(body)).path });
  });
});
