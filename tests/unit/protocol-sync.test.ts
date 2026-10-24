import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSource, sync } from '../../scripts/troupe-docs-lib.mjs';
import { writeProtocol } from '../../scripts/protocol-lib.mjs';
import { makeRepo, page, type Repo } from './support/git-repo';

// sync writes /protocol/'s copies beside /docs's pages, from the same source (spec: protocol-schemas; design D1, D6).
// Every repository here is a throwaway one; nothing touches GitHub.
const BASE = 'https://troupe.run/protocol/';
const schema = (path: string, extra: Record<string, unknown> = {}) => `${JSON.stringify({ $id: `${BASE}${path}`, ...extra })}\n`;
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));
function temp(): string {
  const d = mkdtempSync(join(tmpdir(), 'protocol-sync-'));
  cleanup.push(() => rmSync(d, { recursive: true, force: true }));
  return d;
}
function troupe(): Repo {
  const r = makeRepo();
  cleanup.push(r.remove);
  r.commit({ 'docs/programme/a.md': page('A'), 'protocol/schemas/a.schema.json': schema('a.schema.json', { v: 1 }) },
    '2026-01-01T00:00:00Z', ['troupe-v0.1.0', 'protocol-v0.1.0']);
  r.commit({ 'protocol/schemas/a.schema.json': schema('a.schema.json', { v: 2 }) }, '2026-02-01T00:00:00Z', ['protocol-v0.2.0']);
  r.commit({ 'protocol/schemas/a.schema.json': schema('a.schema.json', { v: 3 }) }, '2026-03-01T00:00:00Z');
  return r;
}
const read = (root: string, path: string) => JSON.parse(readFileSync(join(root, 'public', 'protocol', path), 'utf8'));
const list = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).sort() : []);

describe('sync and /protocol/', () => {
  it('writes every copy under public/protocol/, each with its own ids', () => {
    const r = troupe();
    const root = temp();
    sync({ env: { TROUPE_DOCS: r.path }, root });
    expect(list(join(root, 'public', 'protocol'))).toEqual(['.troupe-protocol', '0', '0.1.0', '0.2.0', 'a.schema.json', 'next']);
    expect(read(root, 'a.schema.json')).toEqual({ $id: `${BASE}a.schema.json`, v: 2 });
    expect(read(root, '0/a.schema.json')).toEqual({ $id: `${BASE}0/a.schema.json`, v: 2 });
    expect(read(root, 'next/a.schema.json')).toEqual({ $id: `${BASE}next/a.schema.json`, v: 3 });
    expect(read(root, '0.1.0/a.schema.json')).toEqual({ $id: `${BASE}0.1.0/a.schema.json`, v: 1 });
  });

  it("leaves no copy for a tag that's gone on the next run", () => {
    const r = troupe();
    const root = temp();
    sync({ env: { TROUPE_DOCS: r.path }, root });
    r.git('tag', '-d', 'protocol-v0.2.0');
    sync({ env: { TROUPE_DOCS: r.path }, root });
    expect(existsSync(join(root, 'public', 'protocol', '0.2.0'))).toBe(false);
    expect(read(root, 'a.schema.json').v).toBe(1);
  });

  it("refuses to clear a public/protocol/ it didn't write, naming the folder", () => {
    const r = troupe();
    const root = temp();
    mkdirSync(join(root, 'public', 'protocol'), { recursive: true });
    writeFileSync(join(root, 'public', 'protocol', 'mine.json'), '{}');
    expect(() => sync({ env: { TROUPE_DOCS: r.path }, root })).toThrow(
      `${join(root, 'public', 'protocol')} holds files the docs sync didn't write, so it won't replace them`,
    );
    expect(existsSync(join(root, 'public', 'protocol', 'mine.json'))).toBe(true);
  });

  it('writes nothing when a ref refuses, /docs included', () => {
    const r = troupe();
    r.commit({ 'protocol/schemas/b.txt': 'x' }, '2026-04-01T00:00:00Z');
    const root = temp();
    expect(() => sync({ env: { TROUPE_DOCS: r.path }, root })).toThrow(/troupe's main can't be built into \/protocol\/:\n.*b\.txt/s);
    expect(existsSync(join(root, 'public', 'protocol'))).toBe(false);
    expect(existsSync(join(root, 'src', 'content', 'docs', 'docs'))).toBe(false);
  });

  it("records the copies and the releases, newest first, in the manifest", () => {
    const r = troupe();
    const root = temp();
    const manifest = sync({ env: { TROUPE_DOCS: r.path }, root });
    const written = JSON.parse(readFileSync(join(root, 'src', 'generated', 'troupe-docs.json'), 'utf8'));
    expect(written.protocol).toEqual(manifest.protocol);
    expect(manifest.protocol.releases).toEqual(['0.2.0', '0.1.0']);
    expect(manifest.protocol.copies.map((c: { prefix: string; ref: string; files: number }) => [c.prefix, c.ref, c.files])).toEqual([
      ['', 'protocol-v0.2.0', 1], ['0/', 'protocol-v0.2.0', 1], ['next/', 'main', 1], ['0.2.0/', 'protocol-v0.2.0', 1], ['0.1.0/', 'protocol-v0.1.0', 1],
    ]);
  });

  it('opens one source for /docs and /protocol/, so a clone is fetched once per run', () => {
    const r = troupe();
    const root = temp();
    let opened = 0;
    const counting: typeof openSource = (...args) => { opened += 1; return openSource(...args); };
    sync({ env: {}, root, remote: r.path, open: counting });
    expect(opened).toBe(1);
    expect(read(root, 'next/a.schema.json').v).toBe(3);
  });

  it("moves a copy's ids exactly when the copy says to, whatever its prefix", () => {
    const out = join(temp(), 'protocol');
    const schemas = [{ path: 'a.schema.json', value: { $id: `${BASE}a.schema.json` } }];
    writeProtocol({ copies: [
      { prefix: 'moved/', ref: 'main', rewrite: true, schemas },
      { prefix: 'kept/', ref: 'main', rewrite: false, schemas },
    ], releases: [] }, out);
    expect(JSON.parse(readFileSync(join(out, 'moved', 'a.schema.json'), 'utf8')).$id).toBe(`${BASE}moved/a.schema.json`);
    expect(JSON.parse(readFileSync(join(out, 'kept', 'a.schema.json'), 'utf8')).$id).toBe(`${BASE}a.schema.json`);
  });
});
