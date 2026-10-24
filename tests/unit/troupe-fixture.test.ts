import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { MILESTONES_FIXTURE, makeFixtureRepo, withFixtureMilestones, withFixtureRepo } from '../../scripts/troupe-fixture.mjs';

// The fixture troupe the fixture build runs against (spec: quality-check; design D9).
const git = (path: string, ...args: string[]) => execFileSync('git', args, { cwd: path, encoding: 'utf8' }).trim();

describe('the fixture troupe', () => {
  it('has the three release tags and three protocol tags of two majors, commits after the last ones, and no remote', () => {
    const repo = makeFixtureRepo();
    try {
      expect(git(repo.path, 'tag', '--list').split('\n')).toEqual([
        'protocol-v0.1.0', 'protocol-v0.2.0', 'protocol-v1.0.0', 'troupe-v0.1.0', 'troupe-v0.1.1', 'troupe-v0.2.0',
      ]);
      expect(Number(git(repo.path, 'rev-list', '--count', 'troupe-v0.2.0..main'))).toBeGreaterThan(0);
      expect(Number(git(repo.path, 'rev-list', '--count', 'protocol-v1.0.0..main'))).toBeGreaterThan(0);
      expect(git(repo.path, 'diff', '--stat', 'protocol-v1.0.0', 'main', '--', 'protocol/')).not.toBe('');
      expect(git(repo.path, 'remote')).toBe('');
    } finally {
      repo.remove();
    }
  });

  it('tags one commit with both a docs release and a protocol release, holding both docs/ and protocol/', () => {
    const repo = makeFixtureRepo();
    try {
      const show = (ref: string, path: string) => git(repo.path, 'show', `${ref}:${path}`);
      expect(show('troupe-v0.1.0', 'protocol/schemas/pinned.schema.json')).toContain('protocol-v0.1.0');
      expect(git(repo.path, 'ls-tree', '-r', '--name-only', 'troupe-v0.1.0', '--', 'docs/')).not.toBe('');
      expect(git(repo.path, 'rev-parse', 'troupe-v0.1.0^{commit}')).toBe(git(repo.path, 'rev-parse', 'protocol-v0.1.0^{commit}'));
    } finally {
      repo.remove();
    }
  });

  it('commits a step with only docs/ or only protocol/ and keeps the other from the step before', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fixture-steps-'));
    try {
      const put = (path: string, text: string) => { mkdirSync(dirname(join(dir, path)), { recursive: true }); writeFileSync(join(dir, path), text); };
      put('1-troupe-v0.1.0+protocol-v0.1.0/docs/programme/a.md', 'one');
      put('1-troupe-v0.1.0+protocol-v0.1.0/protocol/schemas/a.schema.json', '{}');
      put('2-troupe-v0.2.0/docs/programme/a.md', 'two');
      put('3-main/protocol/schemas/a.schema.json', '{"main": true}');
      const repo = makeFixtureRepo(dir);
      try {
        const show = (ref: string, path: string) => git(repo.path, 'show', `${ref}:${path}`);
        expect(show('troupe-v0.2.0', 'protocol/schemas/a.schema.json')).toBe('{}');
        expect(show('main', 'docs/programme/a.md')).toBe('two');
        expect(show('main', 'protocol/schemas/a.schema.json')).toBe('{"main": true}');
        expect(git(repo.path, 'tag', '--list', '--points-at', 'HEAD~2').split('\n')).toEqual(['protocol-v0.1.0', 'troupe-v0.1.0']);
      } finally {
        repo.remove();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is deleted after the build, when it passes', () => {
    const path = withFixtureRepo((p: string) => p);
    expect(existsSync(path)).toBe(false);
  });

  it('is deleted after the build, when it fails', () => {
    let seen = '';
    expect(() => withFixtureRepo((p: string) => { seen = p; throw new Error('build failed'); })).toThrow('build failed');
    expect(seen).not.toBe('');
    expect(existsSync(seen)).toBe(false);
  });
});

// The fixture milestones the fixture build reads instead of troupe-run/infrastructure's (spec: quality-check, roadmap;
// design D9).
describe('the fixture milestones', () => {
  it("are a folder shaped like an infrastructure checkout, holding tests/fixtures/milestones.json as tofu/milestones.json", () => {
    const text = withFixtureMilestones((p: string) => readFileSync(join(p, 'tofu', 'milestones.json'), 'utf8'));
    expect(text).toBe(readFileSync(MILESTONES_FIXTURE, 'utf8'));
  });

  it('are deleted after the build, when it passes and when it fails', () => {
    const path = withFixtureMilestones((p: string) => p);
    expect(existsSync(path)).toBe(false);
    let seen = '';
    expect(() => withFixtureMilestones((p: string) => { seen = p; throw new Error('build failed'); })).toThrow('build failed');
    expect(existsSync(seen)).toBe(false);
  });
});
