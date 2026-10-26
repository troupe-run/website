import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseNvmrc } from '../../scripts/node-version.mjs';

// .nvmrc is what every workflow runs on (workflow-node-version.test.ts). Two places repeat the version for people:
// engines.node's floor and README.md's set-up steps. They must name the same major, so moving .nvmrc can't
// leave either behind (troupe-run/website#8). Each reads one closed shape, and anything else is refused, not guessed.
const ENGINES = /^>=\s*(\d+)(?:\.\d+){0,2}$/;
const README = /Node (\d+) or later/g;

type Texts = { nvmrc: string; packageJson: string; readme: string };

function copyProblems({ nvmrc, packageJson, readme }: Texts): string[] {
  const major = parseNvmrc(nvmrc).split('.')[0];
  const problems: string[] = [];

  const engines = JSON.parse(packageJson).engines?.node;
  const floor = typeof engines === 'string' ? ENGINES.exec(engines.trim())?.[1] : undefined;
  if (floor === undefined) {
    problems.push(`package.json: engines.node must be ">=N" or ">=N.N.N" (found ${JSON.stringify(engines)}); .nvmrc holds ${major}`);
  } else if (floor !== major) {
    problems.push(`package.json: engines.node is "${engines}", whose major is ${floor}, but .nvmrc holds ${major}`);
  }

  const named = [...readme.matchAll(README)].map((m) => m[1]);
  if (named.length === 0) problems.push(`README.md names no Node version ("Node N or later"); .nvmrc holds ${major}`);
  else if (named.length > 1) problems.push(`README.md names a Node version ${named.length} times (${named.join(', ')}); it should say "Node ${major} or later" once`);
  else if (named[0] !== major) problems.push(`README.md says "Node ${named[0]} or later", but .nvmrc holds ${major}`);

  return problems;
}

const pkg = (node?: string) => JSON.stringify(node === undefined ? {} : { engines: { node } });
const texts = (nvmrc: string, node: string | undefined, readme: string): Texts =>
  ({ nvmrc, packageJson: pkg(node), readme });

describe('the Node version written for people agrees with .nvmrc', () => {
  it('engines.node and README.md name the same major as .nvmrc in this repository', () => {
    const read = (f: string) => readFileSync(f, 'utf8');
    expect(copyProblems({ nvmrc: read('.nvmrc'), packageJson: read('package.json'), readme: read('README.md') }))
      .toEqual([]);
  });
});

describe('the agreement check itself', () => {
  it('passes when .nvmrc, engines.node and README.md all say 26', () => {
    expect(copyProblems(texts('26\n', '>=26.0.0', '- Node 26 or later (the version in `.nvmrc`)'))).toEqual([]);
  });

  it('fails naming package.json, its range and .nvmrc\'s version when .nvmrc moves and engines.node does not', () => {
    expect(copyProblems(texts('28', '>=26.0.0', 'Node 28 or later')))
      .toEqual([expect.stringMatching(/^package\.json: .*">=26\.0\.0".* \.nvmrc holds 28$/)]);
  });

  it('fails naming README.md, its version and .nvmrc\'s version when .nvmrc moves and README.md does not', () => {
    expect(copyProblems(texts('28', '>=28.0.0', 'Node 26 or later')))
      .toEqual(['README.md says "Node 26 or later", but .nvmrc holds 28']);
  });

  it('fails saying README.md names no Node version when it has no "Node N or later"', () => {
    expect(copyProblems(texts('26', '>=26.0.0', 'Install Node, then npm ci.')))
      .toEqual([expect.stringContaining('README.md names no Node version')]);
  });

  it('fails when README.md names a Node version more than once', () => {
    expect(copyProblems(texts('26', '>=26.0.0', 'Node 26 or later. Node 22 or later also works.')))
      .toEqual([expect.stringContaining('names a Node version 2 times (26, 22)')]);
  });

  it('reads the major from a full version in .nvmrc', () => {
    expect(copyProblems(texts('v26.12.1', '>=26', 'Node 26 or later'))).toEqual([]);
  });

  it.each([['^26'], ['26.x'], ['>=22 || >=26'], ['>26'], [undefined]])(
    'refuses engines.node %j, saying the shape it expects, rather than reading a floor from it',
    (node) => {
      expect(copyProblems(texts('26', node, 'Node 26 or later')))
        .toEqual([expect.stringContaining(`engines.node must be ">=N" or ">=N.N.N" (found ${JSON.stringify(node)})`)]);
    },
  );
});
