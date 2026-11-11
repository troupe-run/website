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
  r.commit({ 'docs/programme/a.md': page('A') }, '2026-01-02T03:04:05Z', ['troupe-run-v0.1.0']);
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
    expect(source.read('troupe-run-v0.1.0', 'programme/a.md')).toContain('title: A');
    expect(source.tags()).toEqual(['troupe-run-v0.1.0']);
    expect(new Date(source.date('main', 'programme/a.md')!).toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it("dates a lightweight tag by its commit, and an annotated one by its tagger date (spec: roadmap)", () => {
    const r = repo();
    execFileSync('git', ['tag', '-a', '-m', 'release', 'troupe-run-v0.2.0'], {
      cwd: r.path,
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_COMMITTER_NAME: 'F', GIT_COMMITTER_EMAIL: 'f@example.com', GIT_COMMITTER_DATE: '2026-03-04T05:06:07+10:00' },
    });
    const source = openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: r.path });
    expect(source.tagDates()).toEqual({
      'troupe-run-v0.1.0': '2026-01-02T03:04:05Z',
      'troupe-run-v0.2.0': '2026-03-04T05:06:07+10:00',
    });
  });

  it('fetches new commits and tags on the next run', () => {
    const r = repo();
    const cacheDir = join(tempDir(), 'troupe.git');
    openSource({}, { cacheDir, remote: r.path });
    r.commit({ 'docs/programme/b.md': page('B') }, '2026-02-01T00:00:00Z', ['troupe-run-v0.2.0']);
    const source = openSource({}, { cacheDir, remote: r.path });
    expect(source.list('main')).toEqual(['programme/a.md', 'programme/b.md']);
    expect(source.tags()).toEqual(['troupe-run-v0.1.0', 'troupe-run-v0.2.0']);
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

describe("the source reads any folder at a ref, as /protocol/ needs (protocol-schemas design D1)", () => {
  const SCHEMA = '{"$id": "https://troupe.run/protocol/a.schema.json"}\n';
  function withSchemas(): Repo {
    const r = repo();
    r.commit({ 'protocol/schemas/a.schema.json': SCHEMA, 'protocol/schemas/runner/b.schema.json': SCHEMA }, '2026-02-01T00:00:00Z', ['protocol-v0.1.0']);
    return r;
  }

  it('lists and reads protocol/schemas/ at a tag and at main, from a clone', () => {
    const r = withSchemas();
    const source = openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: r.path });
    expect(source.listTree('protocol-v0.1.0', 'protocol/schemas')).toEqual(['a.schema.json', 'runner/b.schema.json']);
    expect(source.listTree('main', 'protocol/schemas')).toEqual(['a.schema.json', 'runner/b.schema.json']);
    expect(source.readFile('main', 'protocol/schemas/runner/b.schema.json')).toBe(SCHEMA);
  });

  it('lists nothing for a folder a ref lacks', () => {
    const source = openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: repo().path });
    expect(source.listTree('troupe-run-v0.1.0', 'protocol/schemas')).toEqual([]);
  });

  it("takes main's protocol/schemas/ from a TROUPE_DOCS checkout's working tree, an uncommitted edit and a new file included", () => {
    const r = withSchemas();
    writeFileSync(join(r.path, 'protocol/schemas/a.schema.json'), '{"edited": true}\n');
    writeFileSync(join(r.path, 'protocol/schemas/c.schema.json'), SCHEMA);
    const source = openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' });
    expect(source.listTree('main', 'protocol/schemas')).toEqual(['a.schema.json', 'c.schema.json', 'runner/b.schema.json']);
    expect(source.readFile('main', 'protocol/schemas/a.schema.json')).toBe('{"edited": true}\n');
    expect(source.readFile('protocol-v0.1.0', 'protocol/schemas/a.schema.json')).toBe(SCHEMA);
    expect(source.listTree('protocol-v0.1.0', 'protocol/schemas')).toEqual(['a.schema.json', 'runner/b.schema.json']);
  });

  it("lists nothing for a folder a TROUPE_DOCS checkout's working tree lacks", () => {
    expect(openSource({ TROUPE_DOCS: repo().path }, { cacheDir: 'unused' }).listTree('main', 'protocol/schemas')).toEqual([]);
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
    expect(source.read('troupe-run-v0.1.0', 'programme/a.md')).toContain("A's text.");
  });

  it("takes the tags from the checkout", () => {
    const r = repo();
    expect(openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' }).tags()).toEqual(['troupe-run-v0.1.0']);
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

// Whether a link into troupe's repository leads somewhere: the ref it names and the path at that ref (spec:
// versioned-docs; design D3, D4). Both sources answer the same, except that a local checkout's main is its working tree.
describe('the source says whether a ref and a path exist, for links into the repository', () => {
  //   troupe-run-v0.1.0  docs/programme/a.md                 main  + plugins/runner/README.md, CHANGELOG.md
  function linked(): Repo {
    const r = repo();
    r.commit({ 'plugins/runner/README.md': 'r\n', 'CHANGELOG.md': 'c\n' }, '2026-02-01T00:00:00Z');
    return r;
  }
  const sources = [
    ['the clone', (r: Repo) => openSource({}, { cacheDir: join(tempDir(), 'troupe.git'), remote: r.path })],
    ['a local checkout', (r: Repo) => openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' })],
  ] as const;

  describe.each(sources)('from %s', (_, open) => {
    it('finds a file, a folder and the root at main, and not a missing path', () => {
      const source = open(linked());
      expect(
        source.exists([
          { ref: 'main', path: 'CHANGELOG.md' },
          { ref: 'main', path: 'plugins/runner' },
          { ref: 'main', path: '' },
          { ref: 'main', path: 'plugins/runner-ollama/CHANGELOG.md' },
        ]),
      ).toEqual([true, true, true, false]);
    });

    it('looks a path up at the tag a link names, not at main', () => {
      const source = open(linked());
      expect(
        source.exists([
          { ref: 'troupe-run-v0.1.0', path: 'docs/programme/a.md' },
          { ref: 'troupe-run-v0.1.0', path: 'CHANGELOG.md' },
        ]),
      ).toEqual([true, false]);
    });

    it('looks a path up at a commit a link names', () => {
      const r = linked();
      const first = r.git('rev-list', '--max-parents=0', 'main').trim();
      const source = open(r);
      expect(source.exists([{ ref: first, path: 'docs/programme/a.md' }, { ref: first, path: 'CHANGELOG.md' }])).toEqual([true, false]);
    });

    it('knows main, a tag and a commit, and not a branch it lacks or a made-up ref', () => {
      const r = linked();
      const source = open(r);
      expect(source.hasRef('main')).toBe(true);
      expect(source.hasRef('troupe-run-v0.1.0')).toBe(true);
      expect(source.hasRef(r.git('rev-parse', 'main').trim())).toBe(true);
      expect(source.hasRef(r.git('rev-parse', '--short', 'main').trim())).toBe(true);
      expect(source.hasRef('some-branch')).toBe(false);
      expect(source.hasRef('--all')).toBe(false);
    });

    // A clone has only main and the tags, so anything else git could resolve in a checkout would pass on a writer's
    // machine and fail in CI's clone (review of troupe-run/website#113).
    it("doesn't take HEAD, a local branch, or a branch spelled out in full, which CI's clone wouldn't have", () => {
      const r = linked();
      r.git('branch', 'my-local-branch');
      r.git('branch', 'cafe123');
      const source = open(r);
      expect(source.hasRef('HEAD')).toBe(false);
      expect(source.hasRef('my-local-branch')).toBe(false);
      expect(source.hasRef('refs/heads/main')).toBe(false);
      expect(source.hasRef('main~1')).toBe(false);
      // A branch named like a commit id is still a branch, not a commit.
      expect(source.hasRef('cafe123')).toBe(false);
    });

    it.each([
      ['a .. part that leaves the repository', '../outside.md', /an empty, \. or \.\. part/],
      ['a .. part inside it', 'plugins/../CHANGELOG.md', /an empty, \. or \.\. part/],
      ['an empty part', 'plugins//runner', /an empty, \. or \.\. part/],
      ['a newline', 'CHANGELOG.md\nmain:CHANGELOG.md', /a control character/],
    ])('refuses a path with %s, rather than answering', (_, path, message) => {
      const source = open(linked());
      expect(() => source.exists([{ ref: 'main', path }])).toThrow(message);
      expect(() => source.exists([{ ref: 'troupe-run-v0.1.0', path }])).toThrow(message);
    });
  });

  it("counts a file in a local checkout's working tree that isn't committed yet, as the pages do", () => {
    const r = linked();
    writeFileSync(join(r.path, 'NEW.md'), 'n\n');
    const source = openSource({ TROUPE_DOCS: r.path }, { cacheDir: 'unused' });
    expect(source.exists([{ ref: 'main', path: 'NEW.md' }])).toEqual([true]);
    // A tag is read from git, so the working tree doesn't count there.
    expect(source.exists([{ ref: 'troupe-run-v0.1.0', path: 'NEW.md' }])).toEqual([false]);
  });

  it("doesn't count a local checkout's .git folder, which is on disk but never in the repository", () => {
    const source = openSource({ TROUPE_DOCS: linked().path }, { cacheDir: 'unused' });
    expect(source.exists([{ ref: 'main', path: '.git/config' }])).toEqual([false]);
  });
});
