import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkReferences, referenceProblems } from '../../scripts/protocol-lib.mjs';

// The reference check over a built site's /protocol/: every $ref and $dynamicRef in every published copy resolves,
// fragment included, and stays in its copy (spec: protocol-schemas; design D7).
const BASE = 'https://troupe.run/protocol/';
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));
function site(files: Record<string, object>): string {
  const dir = mkdtempSync(join(tmpdir(), 'schema-refs-'));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  for (const [path, value] of Object.entries(files)) {
    const at = join(dir, 'protocol', path);
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, JSON.stringify({ $id: `${BASE}${path}`, ...value }));
  }
  return dir;
}
const LINEAGE = { $defs: { hash: { type: 'string' }, 'a/b': { type: 'string' }, 'with space': { type: 'string' } } };

describe('checkReferences', () => {
  it('passes references that resolve: a pointer into another file, #, a dynamic anchor, an anchor, ~1 and %20', () => {
    const result = checkReferences(site({
      '0/lineage.schema.json': LINEAGE,
      '0/runner/run-start.schema.json': {
        properties: {
          a: { $ref: '../lineage.schema.json#/$defs/hash' },
          b: { $ref: '#' },
          c: { $dynamicRef: '#runnerOptions' },
          d: { $ref: '#named' },
          e: { $ref: '../lineage.schema.json#/$defs/a~1b' },
          f: { $ref: `${BASE}0/lineage.schema.json#/$defs/with%20space` },
        },
        $defs: { options: { $dynamicAnchor: 'runnerOptions' }, n: { $anchor: 'named' } },
      },
    }));
    expect(result.broken).toEqual([]);
    expect(result.checked).toBe(6);
  });

  const broken: [string, Record<string, object>, string, string][] = [
    ['a missing file', { 'a.schema.json': { $ref: 'gone.schema.json' } }, 'gone.schema.json', 'protocol/gone.schema.json isn\'t published'],
    ['a pointer that leads nowhere', { 'lineage.schema.json': LINEAGE, 'a.schema.json': { $ref: 'lineage.schema.json#/$defs/summary' } },
      'lineage.schema.json#/$defs/summary', '/$defs/summary isn\'t in protocol/lineage.schema.json'],
    ['an undeclared anchor', { 'a.schema.json': { $dynamicRef: '#runnerErrors' } }, '#runnerErrors',
      'no $anchor or $dynamicAnchor in protocol/a.schema.json is named runnerErrors'],
    ['a reference into another copy', { 'lineage.schema.json': LINEAGE, '0/a.schema.json': { $ref: `${BASE}lineage.schema.json` } },
      `${BASE}lineage.schema.json`, 'it leaves the copy at /protocol/0/ for the one at /protocol/'],
  ];
  it.each(broken)('fails %s, naming the file, where in it, the reference and why', (_, files, ref, reason) => {
    const result = checkReferences(site(files));
    expect(result.broken).toHaveLength(1);
    const key = ref.startsWith('#runner') ? '$dynamicRef' : '$ref';
    expect(result.broken[0]).toMatchObject({ at: `/${key}`, ref, reason });
    expect(referenceProblems(result)[0]).toBe(`protocol/${Object.keys(files).at(-1)} at /${key}: ${ref}: ${reason}`);
  });

  it('skips and counts a reference outside troupe.run, such as the meta-schema', () => {
    const result = checkReferences(site({ 'a.schema.json': { $ref: 'https://json-schema.org/draft/2020-12/schema' } }));
    expect(result).toMatchObject({ checked: 0, skipped: 1, broken: [] });
  });

  it("doesn't read $ref inside data, such as const and examples", () => {
    const result = checkReferences(site({ 'a.schema.json': { const: { $ref: 'gone.schema.json' }, examples: [{ $ref: '#/nope' }] } }));
    expect(result).toMatchObject({ checked: 0, broken: [] });
  });

  it('fails when it checked no reference, or found no schema', () => {
    expect(referenceProblems(checkReferences(site({ 'a.schema.json': {} })))).toEqual([
      'checked no schema reference under protocol/: the reference check is not checking anything',
    ]);
    const empty = mkdtempSync(join(tmpdir(), 'schema-refs-'));
    cleanup.push(() => rmSync(empty, { recursive: true, force: true }));
    expect(referenceProblems(checkReferences(empty))).toEqual([
      'checked no schema reference under protocol/: the reference check is not checking anything',
    ]);
  });
});
