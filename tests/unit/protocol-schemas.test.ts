import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSchemas, renderSchema, rewriteIds } from '../../scripts/protocol-lib.mjs';

// What a ref's protocol/schemas/ must be before it's published, and how each copy's ids name its own URLs (spec:
// protocol-schemas; design D4, D5).
const BASE = 'https://troupe.run/protocol/';
const schema = (path: string, body: Record<string, unknown> = {}) =>
  JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', $id: `${BASE}${path}`, ...body });
const files = (entries: Record<string, string>) => Object.entries(entries).map(([path, text]) => ({ path, text }));
const check = (entries: Record<string, string>, ref = 'main') => checkSchemas(ref, files(entries));
const problems = (entries: Record<string, string>, ref = 'main') => {
  try {
    check(entries, ref);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('expected a refusal');
};

describe('checkSchemas', () => {
  it('accepts schemas whose ids are their own URLs and whose references stay at the ref, and returns them parsed', () => {
    const out = check({
      'lineage.schema.json': schema('lineage.schema.json', { $defs: { hash: { type: 'string' } } }),
      'runner/run-start.schema.json': schema('runner/run-start.schema.json', {
        properties: {
          a: { $ref: '../lineage.schema.json#/$defs/hash' },
          b: { $ref: `${BASE}lineage.schema.json#/$defs/hash` },
        },
      }),
    });
    expect(out.map((s: { path: string }) => s.path)).toEqual(['lineage.schema.json', 'runner/run-start.schema.json']);
    expect(out[0].value.$defs.hash).toEqual({ type: 'string' });
  });

  it("names troupe's main or the tag, and puts every problem of a ref in one refusal", () => {
    const message = problems({ 'a.txt': 'x', 'b.schema.json': '[1]' }, 'protocol-v0.2.0');
    expect(message).toMatch(/^protocol-v0\.2\.0 can't be built into \/protocol\/:\n {2}- /);
    expect(message).toContain('protocol/schemas/a.txt');
    expect(message).toContain('protocol/schemas/b.schema.json');
    expect(problems({ 'a.txt': 'x' })).toMatch(/^troupe's main can't be built into \/protocol\//);
  });

  const refusals: [string, Record<string, string>, string][] = [
    ['a file not named *.schema.json', { 'runner/notes.md': '# x' },
      'protocol/schemas/runner/notes.md: only .schema.json files are accepted'],
    ['a file that isn\'t JSON', { 'a.schema.json': '{"a": 1,}' }, 'protocol/schemas/a.schema.json: isn\'t JSON ('],
    ['JSON that isn\'t an object', { 'a.schema.json': '[]' }, 'protocol/schemas/a.schema.json: isn\'t a JSON object'],
    ['a folder named next', { 'next/a.schema.json': schema('next/a.schema.json') },
      'protocol/schemas/next/: a folder here can\'t be named next, a whole number or MAJOR.MINOR.PATCH'],
    ['a folder named as a major version', { '0/a.schema.json': schema('0/a.schema.json') }, 'protocol/schemas/0/: a folder here'],
    ['a folder named as a release', { '0.2.1/a.schema.json': schema('0.2.1/a.schema.json') }, 'protocol/schemas/0.2.1/: a folder here'],
    ['a missing $id', { 'a.schema.json': '{"type": "string"}' },
      `protocol/schemas/a.schema.json: has no $id; give it "$id": "${BASE}a.schema.json"`],
    ['another file\'s $id', { 'runner/shutdown.schema.json': schema('runner/run-cancel.schema.json') },
      `protocol/schemas/runner/shutdown.schema.json: its $id is "${BASE}runner/run-cancel.schema.json"; make it "${BASE}runner/shutdown.schema.json"`],
    ['a nested $id', { 'a.schema.json': schema('a.schema.json', { $defs: { x: { $id: 'x.json' } } }) },
      'protocol/schemas/a.schema.json: has an $id at /$defs/x, inside the schema; troupe.run serves one $id per file'],
    ['an absolute reference to a major version', {
      'lineage.schema.json': schema('lineage.schema.json'),
      'a.schema.json': schema('a.schema.json', { $ref: `${BASE}0/lineage.schema.json` }),
    }, `protocol/schemas/a.schema.json: $ref "${BASE}0/lineage.schema.json" names a copy of the schemas; use "${BASE}lineage.schema.json" or a relative reference`],
    ['an absolute reference to next', {
      'lineage.schema.json': schema('lineage.schema.json'),
      'a.schema.json': schema('a.schema.json', { $dynamicRef: `${BASE}next/lineage.schema.json#x` }),
    }, `$dynamicRef "${BASE}next/lineage.schema.json#x" names a copy of the schemas; use "${BASE}lineage.schema.json#x" or a relative reference`],
    ['an absolute reference to a file the ref lacks', { 'a.schema.json': schema('a.schema.json', { $ref: `${BASE}gone.schema.json` }) },
      `protocol/schemas/a.schema.json: $ref "${BASE}gone.schema.json" names no schema in troupe's main's protocol/schemas/; use a relative reference to one that is`],
    ['no schemas at all', {}, 'protocol/schemas/ is missing or empty'],
  ];
  it.each(refusals)('refuses %s, naming the path and the fix', (_, entries, message) => {
    expect(problems(entries)).toContain(message);
  });

  it("quotes the parser's error for a file that isn't JSON", () => {
    let parser = '';
    try {
      JSON.parse('{"a": 1,}');
    } catch (error) {
      parser = (error as Error).message;
    }
    expect(problems({ 'a.schema.json': '{"a": 1,}' })).toContain(parser);
  });
});

describe('rewriteIds', () => {
  const start = JSON.parse(schema('runner/run-start.schema.json', {
    description: `Named in config files as ${BASE}0/config/actor.schema.json.`,
    properties: {
      a: { $ref: `${BASE}lineage.schema.json#/$defs/hash` },
      b: { $ref: '../lineage.schema.json#/$defs/hash' },
      c: { $dynamicRef: '#runnerOptions' },
      d: { const: { $id: `${BASE}lineage.schema.json` } },
      e: { enum: [{ $ref: `${BASE}lineage.schema.json` }] },
      f: { type: 'object', examples: [{ $ref: `${BASE}lineage.schema.json` }], default: { $ref: `${BASE}lineage.schema.json` } },
    },
  }));

  it("moves the $id and an absolute reference, fragment kept, under the copy's prefix", () => {
    const out = rewriteIds(start, '0/');
    expect(out.$id).toBe(`${BASE}0/runner/run-start.schema.json`);
    expect(out.properties.a.$ref).toBe(`${BASE}0/lineage.schema.json#/$defs/hash`);
    expect(rewriteIds(start, 'next/').properties.a.$ref).toBe(`${BASE}next/lineage.schema.json#/$defs/hash`);
  });

  it('leaves relative references, the meta-schema, prose and data as written', () => {
    const out = rewriteIds(start, '0/');
    expect(out.$schema).toBe(start.$schema);
    expect(out.description).toBe(start.description);
    expect(out.properties.b).toEqual(start.properties.b);
    expect(out.properties.c).toEqual(start.properties.c);
    expect(out.properties.d).toEqual(start.properties.d);
    expect(out.properties.e).toEqual(start.properties.e);
    expect(out.properties.f).toEqual(start.properties.f);
  });

  it('leaves its input unchanged', () => {
    const before = structuredClone(start);
    rewriteIds(start, '0/');
    expect(start).toEqual(before);
  });

  it('writes the latest copy unchanged, as two-space JSON with a final newline', () => {
    expect(renderSchema(start, '')).toBe(`${JSON.stringify(start, null, 2)}\n`);
  });

  // Every real schema, from troupe's main at 30402fa (the fixture troupe's main): a copy differs from troupe's file
  // only in the values the rewrite owns, and moving them back gives troupe's file.
  const REAL = fileURLToPath(new URL('../fixtures/troupe-docs/4-main/protocol/schemas/', import.meta.url));
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  // pinned.schema.json is the fixture's own, not troupe's (the fixture troupe's readme says so).
  const real = walk(REAL)
    .map((p) => ({ path: relative(REAL, p).split(sep).join('/'), text: readFileSync(p, 'utf8') }))
    .filter((f) => f.path !== 'pinned.schema.json');

  it('accepts every real schema, all 46 of them', () => {
    expect(checkSchemas('main', real)).toHaveLength(46);
  });

  it.each(['0/', 'next/', '0.2.1/'])('changes nothing in a real schema but the values it owns, in %s', (prefix) => {
    const differences: string[] = [];
    const compare = (a: unknown, b: unknown, at: string): void => {
      if (typeof a === 'string' && typeof b === 'string' && a !== b) {
        const key = at.split('/').pop();
        const owned = ['$id', '$ref', '$dynamicRef'].includes(key!) && a.startsWith(BASE) && b === a.replace(BASE, BASE + prefix);
        if (!owned) differences.push(at);
      } else if (a && typeof a === 'object') {
        expect(Object.keys(b as object)).toEqual(Object.keys(a));
        for (const k of Object.keys(a)) compare((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${at}/${k}`);
      } else expect(b).toEqual(a);
    };
    for (const { path, value } of checkSchemas('main', real)) {
      const out = JSON.parse(renderSchema(value, prefix));
      compare(value, out, path);
      expect(out.$id).toBe(`${BASE}${prefix}${path}`);
    }
    expect(differences).toEqual([]);
  });
});
