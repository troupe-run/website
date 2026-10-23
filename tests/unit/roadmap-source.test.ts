import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readMilestones, syncRoadmap } from '../../scripts/roadmap-lib.mjs';
import { makeRepo, type Repo } from './support/git-repo';

// Where the milestones come from: troupe-run/infrastructure's main, fetched on every run, or the checkout
// TROUPE_MILESTONES names (spec: roadmap; design D1). Every repository here is a throwaway one; nothing touches GitHub.
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));
function infrastructure(text = '{"milestones": []}'): Repo {
  const r = makeRepo();
  cleanup.push(r.remove);
  r.commit({ 'tofu/milestones.json': text }, '2026-01-02T03:04:05Z');
  return r;
}
function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'roadmap-cache-'));
  cleanup.push(() => rmSync(d, { recursive: true, force: true }));
  return d;
}

describe('readMilestones with TROUPE_MILESTONES unset', () => {
  it("clones the remote and reads tofu/milestones.json from its main", () => {
    const r = infrastructure('{"milestones": [1]}');
    expect(readMilestones({}, { cacheDir: join(tempDir(), 'infrastructure.git'), remote: r.path })).toBe('{"milestones": [1]}');
  });

  it("fetches main again on the next run, so a changed file is read", () => {
    const r = infrastructure('{"milestones": [1]}');
    const cacheDir = join(tempDir(), 'infrastructure.git');
    readMilestones({}, { cacheDir, remote: r.path });
    r.commit({ 'tofu/milestones.json': '{"milestones": [2]}' }, '2026-02-01T00:00:00Z');
    expect(readMilestones({}, { cacheDir, remote: r.path })).toBe('{"milestones": [2]}');
  });

  it("refuses a failed fetch, naming troupe-run/infrastructure and TROUPE_MILESTONES, and doesn't read the earlier clone", () => {
    const r = infrastructure();
    const cacheDir = join(tempDir(), 'infrastructure.git');
    readMilestones({}, { cacheDir, remote: r.path });
    const gone = join(tempDir(), 'gone');
    expect(() => readMilestones({}, { cacheDir, remote: gone })).toThrow(
      new RegExp(`^couldn't fetch troupe-run/infrastructure \\(${gone}\\): .+\\nFix: .*set TROUPE_MILESTONES to a local infrastructure checkout`, 's'),
    );
  });

  it('leaves no half-made clone when the first clone fails', () => {
    const cacheDir = join(tempDir(), 'infrastructure.git');
    expect(() => readMilestones({}, { cacheDir, remote: join(tempDir(), 'gone') })).toThrow(/couldn't fetch/);
    expect(readMilestones({}, { cacheDir, remote: infrastructure().path })).toBe('{"milestones": []}');
  });

  it("refuses a main with no tofu/milestones.json, naming the file", () => {
    const r = makeRepo();
    cleanup.push(r.remove);
    r.commit({ 'notes.txt': 'x' }, '2026-01-02T03:04:05Z');
    expect(() => readMilestones({}, { cacheDir: join(tempDir(), 'infrastructure.git'), remote: r.path })).toThrow(
      /^troupe-run\/infrastructure's main has no tofu\/milestones\.json\./,
    );
  });
});

describe('readMilestones with TROUPE_MILESTONES set', () => {
  it("reads the checkout's working tree, uncommitted edits included", () => {
    const r = infrastructure('{"milestones": [1]}');
    writeFileSync(join(r.path, 'tofu/milestones.json'), '{"milestones": ["edited"]}');
    expect(readMilestones({ TROUPE_MILESTONES: r.path }, { cacheDir: 'unused' })).toBe('{"milestones": ["edited"]}');
  });

  it("reads a folder that isn't a git checkout, as the fixture build's is", () => {
    const d = tempDir();
    mkdirSync(join(d, 'tofu'));
    writeFileSync(join(d, 'tofu/milestones.json'), '{"milestones": []}');
    expect(readMilestones({ TROUPE_MILESTONES: d }, { cacheDir: 'unused' })).toBe('{"milestones": []}');
  });

  const refusals: [string, () => string, RegExp][] = [
    ['empty', () => '', /^TROUPE_MILESTONES is set to "", which is empty\. Fix: set it to an infrastructure checkout/],
    ['missing', () => join(tempDir(), 'nope'), /which isn't a folder\. Fix:/],
    ['without tofu/milestones.json', () => tempDir(), /which has no tofu\/milestones\.json\. Fix:/],
  ];
  it.each(refusals)('refuses a TROUPE_MILESTONES that is %s, naming the variable and its value', (_, value, message) => {
    const v = value();
    expect(() => readMilestones({ TROUPE_MILESTONES: v }, { cacheDir: 'unused' })).toThrow(message);
    expect(() => readMilestones({ TROUPE_MILESTONES: v }, { cacheDir: 'unused' })).toThrow(`TROUPE_MILESTONES is set to ${JSON.stringify(v)}`);
  });
});

describe('syncRoadmap', () => {
  it('writes src/generated/roadmap.json from the milestones and the release tags, and returns it', () => {
    const root = tempDir();
    const r = infrastructure(JSON.stringify({ milestones: [{ title: '0.2.0', description: 'b' }, { title: '0.1.0', description: 'a' }] }));
    const roadmap = syncRoadmap({ env: {}, root, remote: r.path, tags: [{ tag: 'troupe-v0.1.0', date: '2026-11-05T10:00:00+10:00' }] });
    expect(roadmap).toEqual({
      releases: [
        { version: '0.1.0', description: 'a', released: '2026-11-05' },
        { version: '0.2.0', description: 'b', released: null },
      ],
      latest: '0.1.0',
    });
    expect(JSON.parse(readFileSync(join(root, 'src/generated/roadmap.json'), 'utf8'))).toEqual(roadmap);
  });

  it('keeps its clone in .cache/infrastructure.git, beside troupe\'s', () => {
    const root = tempDir();
    syncRoadmap({ env: {}, root, remote: infrastructure().path, tags: [] });
    expect(readFileSync(join(root, '.cache/infrastructure.git/HEAD'), 'utf8')).toMatch(/main/);
  });
});
