import { describe, it, expect } from 'vitest';
import { chooseCopies } from '../../scripts/protocol-lib.mjs';

// Which copies of troupe's protocol schemas /protocol/ publishes, from which refs (spec: protocol-schemas; design D2,
// D3). Each copy is `{ prefix, ref, rewrite }`, and `releases` the protocol releases, newest first.
const copies = (tags: string[]) => chooseCopies(tags).copies.map((c) => [c.prefix, c.ref, c.rewrite]);

describe('chooseCopies', () => {
  it("serves main at the latest, 0/ and next/ before the first protocol release (owner, 2026-10-24)", () => {
    expect(copies([])).toEqual([
      ['', 'main', false],
      ['0/', 'main', true],
      ['next/', 'main', true],
    ]);
  });

  it('takes the latest and each major by semver, not by text, and gives each tag its own copy', () => {
    expect(copies(['protocol-v0.2.1', 'protocol-v0.10.0'])).toEqual([
      ['', 'protocol-v0.10.0', false],
      ['0/', 'protocol-v0.10.0', true],
      ['next/', 'main', true],
      ['0.10.0/', 'protocol-v0.10.0', true],
      ['0.2.1/', 'protocol-v0.2.1', true],
    ]);
  });

  it("gives each major its own highest release", () => {
    expect(copies(['protocol-v0.3.0', 'protocol-v1.0.0', 'protocol-v0.4.2'])).toEqual([
      ['', 'protocol-v1.0.0', false],
      ['1/', 'protocol-v1.0.0', true],
      ['0/', 'protocol-v0.4.2', true],
      ['next/', 'main', true],
      ['1.0.0/', 'protocol-v1.0.0', true],
      ['0.4.2/', 'protocol-v0.4.2', true],
      ['0.3.0/', 'protocol-v0.3.0', true],
    ]);
  });

  it("ignores troupe's other components' tags", () => {
    expect(copies(['troupe-v0.1.0', 'troupe-runner-scripted-v0.1.0'])).toEqual(copies([]));
  });

  it.each(['protocol-v1.0.0-rc.1', 'protocol-v01.0.0', 'protocol-v1.0', 'protocol-vnext'])(
    'refuses %s, naming it and the accepted form', (tag) => {
      expect(() => chooseCopies([tag])).toThrow(`${tag} isn't a protocol release tag troupe.run can build: use protocol-vMAJOR.MINOR.PATCH`);
    },
  );

  it('lists the releases newest first, with the latest first', () => {
    expect(chooseCopies(['protocol-v0.2.1', 'protocol-v0.10.0']).releases).toEqual(['0.10.0', '0.2.1']);
    expect(chooseCopies([]).releases).toEqual([]);
  });
});
