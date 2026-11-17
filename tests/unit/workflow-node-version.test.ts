import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// .nvmrc is the only place the Node version is written (troupe-run/website#4). setup-node reads it
// directly; withastro/action can't, so it takes the output of a step that runs the reader. Omitting
// withastro/action's node-version is as wrong as hard-coding it: the action then defaults to 24.
const READER = 'node scripts/node-version.mjs';
const FROM_READER = /^\$\{\{\s*steps\.([\w-]+)\.outputs\.version\s*\}\}$/;

type Step = { id?: string; uses?: string; run?: string; with?: Record<string, unknown> };
type Workflow = { jobs?: Record<string, { steps?: Step[] }> };

function nodeVersionProblems(file: string, workflow: Workflow): string[] {
  const problems: string[] = [];
  for (const [job, { steps = [] }] of Object.entries(workflow.jobs ?? {})) {
    steps.forEach((step, i) => {
      const where = `${file}, job "${job}", step ${i + 1} (${step.uses ?? step.id ?? 'run'})`;
      const inputs = step.with ?? {};
      const action = step.uses?.split('@')[0];
      if (action === 'actions/setup-node') {
        if (inputs['node-version-file'] !== '.nvmrc')
          problems.push(`${where}: setup-node must have node-version-file: .nvmrc`);
        if ('node-version' in inputs)
          problems.push(
            `${where}: setup-node must not have node-version (found ${JSON.stringify(inputs['node-version'])})`,
          );
      } else if (action === 'withastro/action') {
        const value = inputs['node-version'];
        const id = typeof value === 'string' ? FROM_READER.exec(value)?.[1] : undefined;
        const reader = steps.slice(0, i).find((s) => s.id === id && s.run?.includes(READER));
        if (value === undefined)
          problems.push(
            `${where}: withastro/action has no node-version, so it would default to its own (24 in v6); take it from a step that runs "${READER}"`,
          );
        else if (!reader)
          problems.push(
            `${where}: withastro/action's node-version must be \${{ steps.<id>.outputs.version }} from an earlier step that runs "${READER}" (found ${JSON.stringify(value)})`,
          );
      } else if ('node-version' in inputs) {
        problems.push(
          `${where}: names its own node-version (found ${JSON.stringify(inputs['node-version'])}); take it from .nvmrc`,
        );
      }
    });
  }
  return problems;
}

const check = (yaml: string) => nodeVersionProblems('fixture.yml', parse(yaml));
const DIR = '.github/workflows';

describe('every workflow takes its Node version from .nvmrc', () => {
  it('no workflow in .github/workflows names a Node version of its own or sets up Node without one from .nvmrc', () => {
    const files = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    const problems = files.flatMap((f) => nodeVersionProblems(f, parse(readFileSync(join(DIR, f), 'utf8'))));
    expect(problems).toEqual([]);
  });
});

describe('the wiring check itself', () => {
  const reader = `
      - id: node-version
        run: ${READER}`;

  it('accepts withastro/action fed from an earlier reader step', () => {
    expect(
      check(
        `jobs:\n  build:\n    steps:${reader}\n      - uses: withastro/action@v6\n        with:\n          node-version: \${{ steps.node-version.outputs.version }}`,
      ),
    ).toEqual([]);
  });

  it('refuses withastro/action with a literal node-version, naming the file, job and step', () => {
    expect(
      check(
        `jobs:\n  build:\n    steps:\n      - uses: actions/checkout@v7\n      - uses: withastro/action@v6\n        with:\n          node-version: 22`,
      ),
    ).toEqual([expect.stringContaining('fixture.yml, job "build", step 2 (withastro/action@v6)')]);
  });

  it('refuses withastro/action with no node-version input (it would build on its default, 24)', () => {
    expect(check(`jobs:\n  build:\n    steps:\n      - uses: withastro/action@v6`)).toEqual([
      expect.stringContaining('has no node-version'),
    ]);
  });

  it('refuses withastro/action fed from a reader step that runs after it', () => {
    expect(
      check(
        `jobs:\n  build:\n    steps:\n      - uses: withastro/action@v6\n        with:\n          node-version: \${{ steps.node-version.outputs.version }}${reader}`,
      ),
    ).toEqual([expect.stringContaining('from an earlier step')]);
  });

  it('refuses withastro/action fed from a step output that is not the reader', () => {
    expect(
      check(
        `jobs:\n  build:\n    steps:\n      - id: node-version\n        run: echo version=22 >> $GITHUB_OUTPUT\n      - uses: withastro/action@v6\n        with:\n          node-version: \${{ steps.node-version.outputs.version }}`,
      ),
    ).toEqual([expect.stringContaining('from an earlier step')]);
  });

  it('refuses setup-node with node-version instead of node-version-file: .nvmrc', () => {
    expect(
      check(
        `jobs:\n  test:\n    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 22`,
      ),
    ).toEqual([
      expect.stringContaining('must have node-version-file: .nvmrc'),
      expect.stringContaining('must not have node-version'),
    ]);
  });

  it('refuses a node-version input on any other step', () => {
    expect(
      check(`jobs:\n  x:\n    steps:\n      - uses: some/other-action@v1\n        with:\n          node-version: '24'`),
    ).toEqual([expect.stringContaining('names its own node-version')]);
  });
});
