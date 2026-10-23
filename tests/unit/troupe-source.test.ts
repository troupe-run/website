import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSource } from '../../scripts/troupe-docs-lib.mjs';
import { makeRepo, page, type Repo } from './support/git-repo';

// Where the pages come from: a clone fetched on every run, or the checkout TROUPE_DOCS names (spec: versioned-docs;
// design D2). Every repository here is a throwaway one; nothing touches GitHub.
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));
function repo(): Repo {
  const r = makeRepo();
  cleanup.push(r.remove);
  r.commit({ 'docs/programme/a.md': page('A') }, '2026-01-02T03:04:05Z', ['troupe-v0.1.0']);
  return r;
}
function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'troupe-docs-cache-'));
  cleanup.push(() => rmSync(d, { recursive: true, force: true }));
  return d;
}

describe('openSource with TROUPE_DOCS unset', () => {
  it("clones the remote, and reads main's pages, the tags and each page's last commit date", () => {
    const r = repo();
    const source = openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: r.path });
    expect(source.kind).toBe('remote');
    expect(source.list('main')).toEqual(['programme/a.md']);
    expect(source.read('troupe-v0.1.0', 'programme/a.md')).toContain('title: A');
    expect(source.tags()).toEqual(['troupe-v0.1.0']);
    expect(new Date(source.date('main', 'programme/a.md')!).toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it("dates a lightweight tag by its commit, and an annotated one by its tagger date (spec: roadmap)", () => {
    const r = repo();
    execFileSync('git', ['tag', '-a', '-m', 'release', 'troupe-v0.2.0'], {
      cwd: r.path,
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_COMMITTER_NAME: 'F', GIT_COMMITTER_EMAIL: 'f@example.com', GIT_COMMITTER_DATE: '2026-03-04T05:06:07+10:00' },
    });
    const source = openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: r.path });
    expect(source.tagDates()).toEqual({
      'troupe-v0.1.0': '2026-01-02T03:04:05Z',
      'troupe-v0.2.0': '2026-03-04T05:06:07+10:00',
    });
  });

  it('fetches new commits and tags on the next run', () => {
    const r = repo();
    const cacheDir = join(tempDir(), 'troupe.git');
    openSource({}, { cacheDir, remote: r.path });
    r.commit({ 'docs/programme/b.md': page('B') }, '2026-02-01T00:00:00Z', ['troupe-v0.2.0']);
    const source = openSource({}, { cacheDir, remote: r.path });
    expect(source.list('main')).toEqual(['programme/a.md', 'programme/b.md']);
    expect(source.tags()).toEqual(['troupe-v0.1.0', 'troupe-v0.2.0']);
  });

  it("refuses a failed fetch, naming the remote and TROUPE_DOCS, and doesn't build from the earlier clone", () => {
    const r = repo();
    const cacheDir = join(tempDir(), 'troupe.git');
    openSource({}, { cacheDir, remote: r.path });
    const gone = join(tempDir(), 'gone');
    expect(() => openSource({}, { cacheDir, remote: gone })).toThrow(
      new RegExp(`^couldn't fetch troupe-run/troupe \\(${gone}\\): .+\\nFix: .*set TROUPE_DOCS to a local troupe checkout`, 's'),
    );
  });

  it('leaves no half-made clone when the first clone fails', () => {
    const cacheDir = join(tempDir(), 'troupe.git');
    expect(() => openSource({}, { cacheDir, remote: join(tempDir(), 'gone') })).toThrow(/couldn't fetch/);
    const r = repo();
    expect(openSource({}, { cacheDir, remote: r.path }).list('main')).toEqual(['programme/a.md']);
  });
});

describe('openSource with TROUPE_DOCS set', () => {
  it("takes main from the checkout's working tree, uncommitted edits included, with no date for an edited page", () => {
    const r = repo();
    writeFileSync(join(r.path, 'docs/programme/a.md'), page('A', 'An unpushed edit.'));
    const source = openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' });
    expect(source.kind).toBe('local');
    expect(source.read('main', 'programme/a.md')).toContain('An unpushed edit.');
    expect(source.date('main', 'programme/a.md')).toBeNull();
    expect(source.read('troupe-v0.1.0', 'programme/a.md')).toContain("A's text.");
  });

  it("takes the tags from the checkout", () => {
    const r = repo();
    expect(openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' }).tags()).toEqual(['troupe-v0.1.0']);
  });

  const refusals: [string, () => string, RegExp][] = [
    ['empty', () => '', /^TROUPE_DOCS is set to "", which is empty\. Fix: set it to a troupe checkout/],
    ['missing', () => join(tempDir(), 'nope'), /which isn't a folder\. Fix:/],
    ['without docs/', () => tempDir(), /which has no docs\/ folder\. Fix:/],
    ['not a git working tree', () => { const d = tempDir(); mkdirSync(join(d, 'docs')); return d; }, /which isn't a git working tree\. Fix:/],
    ['inside a working tree', () => { const r = repo(); mkdirSync(join(r.path, 'docs/programme/docs'), { recursive: true }); return join(r.path, 'docs/programme'); }, /which is inside the git working tree .*, not its top\. Fix:/],
  ];
  it.each(refusals)('refuses a TROUPE_DOCS that is %s, naming the variable and its value', (_, value, message) => {
    const v = value();
    expect(() => openSource({ TROUPE_DOCS: v }, { cacheDir: 'unused' })).toThrow(message);
    expect(() => openSource({ TROUPE_DOCS: v }, { cacheDir: 'unused' })).toThrow(`TROUPE_DOCS is set to ${JSON.stringify(v)}`);
  });
});
