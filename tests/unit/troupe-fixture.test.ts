import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { makeFixtureRepo, withFixtureRepo } from '../../scripts/troupe-fixture.mjs';

// The fixture troupe the fixture build runs against (spec: quality-check; design D9).
const git = (path: string, ...args: string[]) => execFileSync('git', args, { cwd: path, encoding: 'utf8' }).trim();

describe('the fixture troupe', () => {
  it('has the three release tags, commits after the last one, and no remote', () => {
    const repo = makeFixtureRepo();
    try {
      expect(git(repo.path, 'tag', '--list').split('\n')).toEqual(['troupe-v0.1.0', 'troupe-v0.1.1', 'troupe-v0.2.0']);
      expect(Number(git(repo.path, 'rev-list', '--count', 'troupe-v0.2.0..main'))).toBeGreaterThan(0);
      expect(git(repo.path, 'remote')).toBe('');
    } finally {
      repo.remove();
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
