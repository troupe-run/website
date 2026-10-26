import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseNvmrc, readNvmrc } from '../../scripts/node-version.mjs';

// setup-node's rule for a plain version file, copied from getNodeVersionFromFile in
// https://github.com/actions/setup-node/blob/949feb2413d6458794dcd2491c4babbbce0c15c1/src/util.ts (v7)
const setupNode = (contents: string) =>
  contents.match(/^(?:node(js)?\s+)?v?(?<version>[^\s]+)$/m)?.groups?.version ?? contents.trim();

const ACCEPTED: [string, string][] = [
  ['22', '22'],
  ['22\n', '22'],
  ['  22.12.0  ', '22.12.0'],
  ['v22', '22'],
  ['node 22', '22'],
  ['nodejs 22', '22'],
  ['lts/jod', 'lts/jod'],
];

describe('parseNvmrc', () => {
  it.each(ACCEPTED)('reads %j as %j', (text, version) => {
    expect(parseNvmrc(text)).toBe(version);
  });

  it.each(ACCEPTED)('reads %j as setup-node does, so CI and the deploy get the same version', (text) => {
    expect(parseNvmrc(text)).toBe(setupNode(text));
  });

  it.each([
    ['', 'holds no version'],
    ['  \n\t\n', 'holds no version'],
    ['22\n24\n', 'holds more than one value: "22\\n24\\n"'],
    ['22 # comment', 'holds more than one value: "22 # comment"'],
    ['{"engines":{"node":"22"}}', 'is JSON: "{\\"engines\\":{\\"node\\":\\"22\\"}}"'],
  ])('refuses %j with the message ".nvmrc %s"', (text, problem) => {
    expect(() => parseNvmrc(text)).toThrow(`.nvmrc ${problem}`);
  });

  it('says what a valid .nvmrc looks like when it refuses one', () => {
    expect(() => parseNvmrc('')).toThrow('A valid .nvmrc is one line holding one Node version, such as 26.');
  });
});

describe('readNvmrc', () => {
  it('reads the version from the project root .nvmrc (26 today)', () => {
    expect(readNvmrc()).toBe('26');
  });

  it('refuses a missing .nvmrc, saying it is missing', () => {
    const missing = join(mkdtempSync(join(tmpdir(), 'nvmrc-')), '.nvmrc');
    expect(() => readNvmrc(missing)).toThrow(`.nvmrc is missing (looked for ${missing})`);
  });
});
