// Builds troupe.run's /protocol/ from troupe-run/troupe's protocol/schemas/, one copy per path its spec names
// (spec: protocol-schemas): the latest release, each major version, next and each protocol-v* tag. Reads troupe through
// the same source as /docs (troupe-docs-lib.mjs's openSource), checks every schema, rewrites each copy's ids to its
// own URLs and writes the copies into public/protocol/ (design D1 to D6).

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { TroupeDocsError } from './troupe-error.mjs';

const PREFIX = 'protocol-v';
const RELEASE = /^protocol-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * The copies to publish (design D2, D3): the latest, each major (newest first), `next`, then each tag (newest
 * first). Each is `{ prefix, ref, rewrite }`: `prefix` the path under /protocol/ (`''` for the latest), `ref` the git
 * ref to read, and `rewrite` whether its ids move under `prefix`. `releases` lists the releases' versions, newest first.
 * @param {string[]} tags
 */
export function chooseCopies(tags) {
  const releases = [];
  for (const tag of tags) {
    if (!tag.startsWith(PREFIX)) continue;
    const m = RELEASE.exec(tag);
    if (!m) throw new TroupeDocsError(`${tag} isn't a protocol release tag troupe.run can build: use protocol-vMAJOR.MINOR.PATCH`);
    releases.push({ tag, version: tag.slice(PREFIX.length), n: m.slice(1, 4).map(Number) });
  }
  releases.sort((a, b) => b.n[0] - a.n[0] || b.n[1] - a.n[1] || b.n[2] - a.n[2]);
  const next = { prefix: 'next/', ref: 'main', rewrite: true };
  if (releases.length === 0) {
    // Before the first release, 0/ serves main too, so the URL troupe writes into config files resolves (owner,
    // 2026-10-24).
    return { copies: [{ prefix: '', ref: 'main', rewrite: false }, { prefix: '0/', ref: 'main', rewrite: true }, next], releases: [] };
  }
  const majors = new Map();
  for (const r of releases) if (!majors.has(r.n[0])) majors.set(r.n[0], r);
  return {
    copies: [
      { prefix: '', ref: releases[0].tag, rewrite: false },
      ...[...majors].map(([major, r]) => ({ prefix: `${major}/`, ref: r.tag, rewrite: true })),
      next,
      ...releases.map((r) => ({ prefix: `${r.version}/`, ref: r.tag, rewrite: true })),
    ],
    releases: releases.map((r) => r.version),
  };
}

// Checking a ref's schemas (design D5) and rewriting a copy's ids (design D4).

export const BASE = 'https://troupe.run/protocol/';
const KEYWORDS = ['$id', '$ref', '$dynamicRef'];
// Keywords whose values are data, not schemas: an $id or $ref inside them is a value like any other.
const DATA = new Set(['const', 'enum', 'examples', 'default']);
// A folder at the top of protocol/schemas/ with one of these names would be served at another copy's URLs.
const COPY_NAME = /^(next|\d+|\d+\.\d+\.\d+)$/;

/** Calls `fn(key, value, pointer)` for every string-valued $id, $ref and $dynamicRef in a schema, outside data. */
export function eachKeyword(node, fn, pointer = '') {
  if (Array.isArray(node)) {
    node.forEach((item, i) => eachKeyword(item, fn, `${pointer}/${i}`));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (KEYWORDS.includes(key) && typeof value === 'string') fn(key, value, pointer);
      else if (!DATA.has(key)) eachKeyword(value, fn, `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`);
    }
  }
}

const refName = (ref) => (ref === 'main' ? "troupe's main" : ref);

/**
 * Checks one ref's files under protocol/schemas/ (`{ path, text }`, paths relative to it), and returns them parsed as
 * `{ path, value }`, in path order. Refuses the ref with every problem it has, each naming the file and the fix.
 */
export function checkSchemas(ref, files) {
  const found = [];
  const parsed = [];
  if (files.length === 0) found.push(`protocol/schemas/ is missing or empty at ${ref}`);
  const paths = new Set(files.map((f) => f.path));
  const folders = new Set();
  for (const { path, text } of [...files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const at = `protocol/schemas/${path}`;
    const top = path.split('/');
    if (top.length > 1 && COPY_NAME.test(top[0]) && !folders.has(top[0])) {
      folders.add(top[0]);
      found.push(`protocol/schemas/${top[0]}/: a folder here can't be named next, a whole number or MAJOR.MINOR.PATCH, ` +
        "since its files would be served at another copy's URLs; rename it");
    }
    if (!path.endsWith('.schema.json')) {
      found.push(`${at}: only .schema.json files are accepted`);
      continue;
    }
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      found.push(`${at}: isn't JSON (${error.message})`);
      continue;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      found.push(`${at}: isn't a JSON object`);
      continue;
    }
    const own = `${BASE}${path}`;
    if (typeof value.$id !== 'string') found.push(`${at}: has no $id; give it "$id": "${own}"`);
    else if (value.$id !== own) found.push(`${at}: its $id is "${value.$id}"; make it "${own}"`);
    eachKeyword(value, (key, v, pointer) => {
      if (key === '$id') {
        if (pointer !== '') found.push(`${at}: has an $id at ${pointer}, inside the schema; troupe.run serves one $id per file`);
        return;
      }
      if (!v.startsWith(BASE)) return;
      const [target, ...fragment] = v.slice(BASE.length).split('#');
      const hash = fragment.length ? `#${fragment.join('#')}` : '';
      const first = target.split('/')[0];
      const unversioned = target.split('/').slice(1).join('/');
      if (target.includes('/') && COPY_NAME.test(first) && paths.has(unversioned)) {
        found.push(`${at}: ${key} "${v}" names a copy of the schemas; use "${BASE}${unversioned}${hash}" or a relative reference`);
      } else if (!paths.has(target)) {
        found.push(`${at}: ${key} "${v}" names no schema in ${refName(ref)}'s protocol/schemas/; use a relative reference to one that is`);
      }
    });
    parsed.push({ path, value });
  }
  if (found.length) {
    throw new TroupeDocsError(`${refName(ref)} can't be built into /protocol/:\n${found.map((p) => `  - ${p}`).join('\n')}`);
  }
  return parsed;
}

/** A copy of `schema` whose $id and absolute references to troupe's schemas sit under `prefix` (design D4). */
export function rewriteIds(schema, prefix) {
  const copy = structuredClone(schema);
  const move = (node) => {
    if (Array.isArray(node)) node.forEach(move);
    else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (KEYWORDS.includes(key) && typeof value === 'string') {
          if (value.startsWith(BASE)) node[key] = BASE + prefix + value.slice(BASE.length);
        } else if (!DATA.has(key)) move(value);
      }
    }
  };
  move(copy);
  return copy;
}

/** A schema as it's published in the copy at `prefix`: rewritten unless it's the latest, as two-space JSON. */
export function renderSchema(schema, prefix) {
  return `${JSON.stringify(prefix ? rewriteIds(schema, prefix) : schema, null, 2)}\n`;
}

// Reading and writing the copies (design D1, D6).

/**
 * Chooses the copies from the source's tags and checks each ref's schemas, once per ref. Writes nothing.
 * @param {import('./troupe-docs-lib.mjs').Source} source
 */
export function buildProtocol(source) {
  const { copies, releases } = chooseCopies(source.tags());
  const byRef = new Map();
  for (const { ref } of copies) {
    if (byRef.has(ref)) continue;
    const files = source.listTree(ref, 'protocol/schemas').map((path) => ({ path, text: source.readFile(ref, `protocol/schemas/${path}`) }));
    byRef.set(ref, checkSchemas(ref, files));
  }
  return { copies: copies.map((c) => ({ ...c, schemas: byRef.get(c.ref) })), releases };
}

/** The file that says the sync wrote public/protocol/. The build drops it from the site (astro.config.mjs). */
export const MARKER = '.troupe-protocol';

/**
 * Replaces `outDir` with every copy, and returns what was written: each copy's prefix, ref and file count, and the
 * releases. Refuses to clear a folder it didn't make.
 */
export function writeProtocol({ copies, releases }, outDir) {
  if (existsSync(outDir) && readdirSync(outDir).length && !existsSync(join(outDir, MARKER))) {
    throw new TroupeDocsError(`${outDir} holds files the docs sync didn't write, so it won't replace them. Fix: move them, then run it again.`);
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, MARKER), 'Written by npm run docs:sync from troupe-run/troupe. Everything here is replaced on each run.\n');
  for (const { prefix, schemas } of copies) {
    for (const { path, value } of schemas) {
      const at = join(outDir, prefix, path);
      mkdirSync(dirname(at), { recursive: true });
      writeFileSync(at, renderSchema(value, prefix));
    }
  }
  return { copies: copies.map(({ prefix, ref, schemas }) => ({ prefix, ref, files: schemas.length })), releases };
}

// The reference check over a built site (design D7). linkinator reads HTML only, so scripts/linkcheck.mjs runs this
// on the same folder.

/** The copy a published path belongs to: its first folder when that is a copy's name, or '' for the latest. */
const copyOf = (path) => {
  const first = path.split('/')[0];
  return path.includes('/') && COPY_NAME.test(first) ? `${first}/` : '';
};

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const at = join(dir, name);
    return statSync(at).isDirectory() ? files(at) : name.endsWith('.schema.json') ? [at] : [];
  });
}

/** Whether `node` declares an $anchor or $dynamicAnchor named `name`, outside data. */
function hasAnchor(node, name) {
  if (Array.isArray(node)) return node.some((item) => hasAnchor(item, name));
  if (!node || typeof node !== 'object') return false;
  return Object.entries(node).some(([key, value]) =>
    ((key === '$anchor' || key === '$dynamicAnchor') && value === name) || (!DATA.has(key) && hasAnchor(value, name)));
}

/** Follows a JSON Pointer, already percent-decoded, into `node`. Returns whether it leads to a value. */
function follows(node, pointer) {
  let at = node;
  for (const raw of pointer.split('/').slice(1)) {
    const token = raw.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!at || typeof at !== 'object' || !Object.hasOwn(at, token)) return false;
    at = at[token];
  }
  return true;
}

/**
 * Resolves every $ref and $dynamicRef in every schema under `<dir>/protocol/` against the schema's own URL. Returns
 * how many it checked, how many it skipped (outside troupe.run), and each broken one as `{ file, at, ref, reason }`,
 * where `at` is the keyword's JSON Pointer in the file.
 */
export function checkReferences(dir) {
  const root = join(dir, 'protocol');
  const docs = new Map(files(root).map((f) => [relative(root, f).split(sep).join('/'), JSON.parse(readFileSync(f, 'utf8'))]));
  const result = { checked: 0, skipped: 0, broken: [] };
  for (const [path, schema] of [...docs].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const base = typeof schema.$id === 'string' ? schema.$id : `${BASE}${path}`;
    eachKeyword(schema, (key, ref, pointer) => {
      if (key === '$id') return;
      const url = new URL(ref, base);
      const target = `${url.origin}${url.pathname}`;
      if (!target.startsWith(BASE)) {
        result.skipped += 1;
        return;
      }
      result.checked += 1;
      const at = target.slice(BASE.length);
      const fragment = decodeURIComponent(url.hash.slice(1));
      const fail = (reason) => result.broken.push({ file: `protocol/${path}`, at: `${pointer}/${key}`, ref, reason });
      if (copyOf(at) !== copyOf(path)) return fail(`it leaves the copy at /protocol/${copyOf(path)} for the one at /protocol/${copyOf(at)}`);
      if (!docs.has(at)) return fail(`protocol/${at} isn't published`);
      if (fragment === '') return;
      if (fragment.startsWith('/')) {
        if (!follows(docs.get(at), fragment)) fail(`${fragment} isn't in protocol/${at}`);
      } else if (!hasAnchor(docs.get(at), fragment)) {
        fail(`no $anchor or $dynamicAnchor in protocol/${at} is named ${fragment}`);
      }
    });
  }
  return result;
}

/** What the link check prints for a reference check's result: each broken reference, or that it checked nothing. */
export function referenceProblems({ checked, broken }) {
  if (checked === 0) return ['checked no schema reference under protocol/: the reference check is not checking anything'];
  return broken.map((b) => `${b.file} at ${b.at}: ${b.ref}: ${b.reason}`);
}
