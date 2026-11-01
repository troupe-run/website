import { describe, it, expect } from 'vitest';
import { releaseVersion } from '../../scripts/release-tag.mjs';

// Which of troupe's tags is a release: the bundle's, troupe-run-vMAJOR.MINOR.PATCH (spec: versioned-docs, roadmap;
// bundle-tag-is-the-release design D1, D2). The names are troupe's real tags on 2026-11-01.
describe('releaseVersion', () => {
  it("reads the bundle's tag as the release, with its version's three numbers", () => {
    expect(releaseVersion('troupe-run-v0.1.0')).toEqual([0, 1, 0]);
    expect(releaseVersion('troupe-run-v1.10.2')).toEqual([1, 10, 2]);
  });

  it.each([
    'troupe-v0.1.0',
    'troupe-v1.0.0-rc.1',
    'troupe-runner-scripted-v0.1.0',
    'troupe-runner-claude-code-v0.1.0',
    'troupe-vcs-git-v0.1.0',
    'protocol-v0.1.0',
  ])("reads %s as another component's tag, not a release", (tag) => {
    expect(releaseVersion(tag)).toBeNull();
  });

  it.each(['troupe-run-v1.0.0-rc.1', 'troupe-run-v01.0.0', 'troupe-run-v1.2', 'troupe-run-vx'])(
    'refuses %s, naming it and the form that is accepted',
    (tag) => {
      expect(() => releaseVersion(tag)).toThrow(`${tag} isn't a release tag troupe.run can build: use troupe-run-vMAJOR.MINOR.PATCH`);
    },
  );
});
