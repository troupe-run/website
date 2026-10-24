import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { GENERATED_PAGES, rerenderGeneratedPages } from '../../scripts/generated-pages.mjs';

// A page rendered from generated data is dropped from the content store when that data changes, so the glob loader
// renders it again, and kept when it doesn't (troupe-run/website#35; status-milestones-refresh design D1, D2). The
// loader context is a fake with the Content Loader API's store, meta, config.root and generateDigest.
const STATUS = 'src/content/docs/status.md';
const PROTOCOL = 'src/content/docs/protocol.md';
const OTHER = 'src/content/docs/docs/next/index.md';

let root: string;
const write = (path: string, text: string) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), text);
};
const roadmap = (latest: string | null) => JSON.stringify({ releases: [{ version: '0.1.0', description: 'One', released: null }], latest });
const manifest = (releases: string[], ref = 'main') => JSON.stringify({ versions: [{ ref }], protocol: { releases } });
const copy = (section: string, words: string) => `---\nsection: ${section}\nwords: ${words}\n---\n`;

function context() {
  const entries = new Map<string, { id: string; filePath?: string }>(
    [['status', STATUS], ['protocol', PROTOCOL], ['docs/next', OTHER]].map(([id, filePath]) => [id, { id, filePath }]),
  );
  const meta = new Map<string, string>();
  const calls: string[] = [];
  const ctx = {
    config: { root: pathToFileURL(`${root}/`) },
    generateDigest: (data: string) => createHash('sha1').update(data).digest('hex'),
    store: {
      entries: () => [...entries.entries()],
      delete: (id: string) => { calls.push(`delete ${id}`); entries.delete(id); },
    },
    meta: { get: (k: string) => meta.get(k), set: (k: string, v: string) => meta.set(k, v) },
  };
  // Put the entries back, as the glob loader would after rendering them.
  const reload = () => {
    for (const [id, filePath] of [['status', STATUS], ['protocol', PROTOCOL], ['docs/next', OTHER]]) entries.set(id, { id, filePath });
    calls.length = 0;
  };
  return { ctx, entries, meta, calls, reload };
}
function wrapped(calls: string[]) {
  return rerenderGeneratedPages({ name: 'inner', load: async () => { calls.push('load'); } });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'generated-pages-'));
  write('src/generated/roadmap.json', roadmap(null));
  write('src/generated/troupe-docs.json', manifest([]));
  write('src/content/copy/roadmap.md', copy('roadmap', 'nothing yet'));
  write('src/content/copy/protocol.md', copy('protocol', 'none yet'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('rerenderGeneratedPages', () => {
  it('keeps every stored entry on a second load with unchanged inputs, and still calls the wrapped loader', async () => {
    const { ctx, entries, calls, reload } = context();
    const loader = wrapped(calls);
    await loader.load(ctx);
    reload();
    await loader.load(ctx);
    expect(calls).toEqual(['load']);
    expect([...entries.keys()].sort()).toEqual(['docs/next', 'protocol', 'status']);
  });

  it('deletes only /status/ when roadmap.json changes, and only /protocol/ when the protocol releases change', async () => {
    const { ctx, calls, reload } = context();
    const loader = wrapped(calls);
    await loader.load(ctx);
    reload();
    write('src/generated/roadmap.json', roadmap('0.1.0'));
    await loader.load(ctx);
    expect(calls).toEqual(['delete status', 'load']);
    reload();
    write('src/generated/troupe-docs.json', manifest(['0.1.0']));
    await loader.load(ctx);
    expect(calls).toEqual(['delete protocol', 'load']);
  });

  it('deletes only the page whose copy file changed', async () => {
    const { ctx, calls, reload } = context();
    const loader = wrapped(calls);
    await loader.load(ctx);
    reload();
    write('src/content/copy/roadmap.md', copy('roadmap', 'reworded'));
    await loader.load(ctx);
    expect(calls).toEqual(['delete status', 'load']);
    reload();
    write('src/content/copy/protocol.md', copy('protocol', 'reworded'));
    await loader.load(ctx);
    expect(calls).toEqual(['delete protocol', 'load']);
  });

  it('keeps /protocol/ when troupe-docs.json changes outside its protocol releases', async () => {
    const { ctx, calls, reload } = context();
    const loader = wrapped(calls);
    await loader.load(ctx);
    reload();
    write('src/generated/troupe-docs.json', manifest([], 'a-later-main'));
    await loader.load(ctx);
    expect(calls).toEqual(['load']);
  });

  it('deletes nothing for a page with no stored entry, and records its digest', async () => {
    const { ctx, entries, meta, calls } = context();
    entries.delete('status');
    await wrapped(calls).load(ctx);
    expect(calls).toEqual(['delete protocol', 'load']);
    expect(meta.get(`generated-inputs:${STATUS}`)).toMatch(/^[0-9a-f]{40}$/);
  });

  it('records the new digest, so the page is deleted once per change and not again', async () => {
    const { ctx, meta, calls, reload } = context();
    const loader = wrapped(calls);
    await loader.load(ctx);
    const first = meta.get(`generated-inputs:${STATUS}`);
    reload();
    write('src/generated/roadmap.json', roadmap('0.1.0'));
    await loader.load(ctx);
    expect(meta.get(`generated-inputs:${STATUS}`)).not.toBe(first);
    reload();
    await loader.load(ctx);
    expect(calls).toEqual(['load']);
  });

  it('on a first load, deletes both pages and then calls the wrapped loader, so the glob loader finds neither stored', async () => {
    const { ctx, calls } = context();
    await wrapped(calls).load(ctx);
    expect(calls).toEqual(['delete status', 'delete protocol', 'load']);
  });

  it('stops the load, naming the file, when a generated input is missing', async () => {
    const { ctx, calls } = context();
    rmSync(join(root, 'src/generated/roadmap.json'));
    await expect(wrapped(calls).load(ctx)).rejects.toThrow(/src\/generated\/roadmap\.json/);
    expect(calls).toEqual([]);
  });

  it('keeps the wrapped loader’s name', () => {
    expect(wrapped([]).name).toBe('inner');
  });
});

describe('GENERATED_PAGES', () => {
  it('names /status/ and /protocol/, each a page in the repository', () => {
    expect(GENERATED_PAGES.map((p) => p.page)).toEqual([STATUS, PROTOCOL]);
    for (const { page } of GENERATED_PAGES) expect(existsSync(page), page).toBe(true);
  });
});
