import { describe, it, expect } from 'vitest';
import { chooseVersions } from '../../scripts/troupe-docs-lib.mjs';

// Which troupe refs become which /docs versions (spec: versioned-docs; design D3). Menu order: next, latest, then
// archived minors newest first.
const summary = (tags: string[]) =>
  chooseVersions(tags).map((v: { role: string; version: string | null; base: string; ref: string }) =>
    [v.role, v.version ?? '', v.base, v.ref].join(' '));

describe('chooseVersions', () => {
  it('with no tags, publishes main at /docs/ as the only version, with no next', () => {
    expect(summary([])).toEqual(['current  /docs/ main']);
  });

  it('with one release, publishes it at /docs/ and main at /docs/next/', () => {
    expect(summary(['troupe-v0.1.0'])).toEqual(['next  /docs/next/ main', 'current 0.1 /docs/ troupe-v0.1.0']);
  });

  it("publishes the latest minor's highest patch at /docs/, and no /docs/vX.Y/ for that minor", () => {
    expect(summary(['troupe-v0.2.0', 'troupe-v0.2.1'])).toEqual([
      'next  /docs/next/ main',
      'current 0.2 /docs/ troupe-v0.2.1',
    ]);
  });

  it("publishes an earlier minor at /docs/vX.Y/ from its highest patch tag only", () => {
    expect(summary(['troupe-v0.1.0', 'troupe-v0.1.1', 'troupe-v0.2.0'])).toEqual([
      'next  /docs/next/ main',
      'current 0.2 /docs/ troupe-v0.2.0',
      'archived 0.1 /docs/v0.1/ troupe-v0.1.1',
    ]);
  });

  it('compares versions as numbers, not text, and lists archived minors newest first, across majors', () => {
    expect(summary(['troupe-v0.9.0', 'troupe-v0.10.0', 'troupe-v1.0.0', 'troupe-v0.2.3'])).toEqual([
      'next  /docs/next/ main',
      'current 1.0 /docs/ troupe-v1.0.0',
      'archived 0.10 /docs/v0.10/ troupe-v0.10.0',
      'archived 0.9 /docs/v0.9/ troupe-v0.9.0',
      'archived 0.2 /docs/v0.2/ troupe-v0.2.3',
    ]);
  });

  it("ignores the other components' tags", () => {
    expect(summary(['protocol-v0.1.0', 'troupe-store-text-v0.1.0'])).toEqual(['current  /docs/ main']);
  });

  it.each(['troupe-v1.0.0-rc.1', 'troupe-v1.2', 'troupe-v01.2.3', 'troupe-vx'])(
    'refuses %s, naming it and the form that is accepted',
    (tag) => {
      expect(() => chooseVersions([tag])).toThrow(`${tag} isn't a release tag troupe.run can build: use troupe-vMAJOR.MINOR.PATCH`);
    },
  );
});
