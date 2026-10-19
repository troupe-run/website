// Builds troupe.run's /docs from troupe-run/troupe's docs/, one version per release (spec: versioned-docs). Reads
// troupe's refs with git, checks every page against troupe's own page contract, and writes the pages where
// Starlight's content loader reads them (design D1 to D4). The Astro integration in astro.config.mjs and
// `npm run docs:sync` both call `sync`.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

/** An input from troupe, or the environment, that the build won't guess about. The message names it and the fix. */
export class TroupeDocsError extends Error {
  name = 'TroupeDocsError';
}

// Release tags. release-please tags each component, with linked versions, so troupe-vX.Y.Z stands for the release.
const RELEASE_PREFIX = 'troupe-v';
const RELEASE = /^troupe-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * The versions to publish, in menu order: `next`, `current`, then `archived` minors, newest first (design D3).
 * Each is `{ role, version, base, dir, ref }`: `version` is `MAJOR.MINOR` (null for main), `base` the URL prefix,
 * `dir` the folder under the generated docs (`''` for /docs/), and `ref` the git ref to read.
 */
export function chooseVersions(tags) {
  const releases = [];
  for (const tag of tags) {
    if (!tag.startsWith(RELEASE_PREFIX)) continue;
    const m = RELEASE.exec(tag);
    if (!m) throw new TroupeDocsError(`${tag} isn't a release tag troupe.run can build: use troupe-vMAJOR.MINOR.PATCH`);
    releases.push({ tag, n: m.slice(1, 4).map(Number) });
  }
  if (releases.length === 0) return [{ role: 'current', version: null, base: '/docs/', dir: '', ref: 'main' }];

  // The highest patch of each minor, newest minor first.
  const newest = new Map();
  for (const r of releases) {
    const key = `${r.n[0]}.${r.n[1]}`;
    if (!newest.has(key) || newest.get(key).n[2] < r.n[2]) newest.set(key, r);
  }
  const minors = [...newest.entries()].sort(([, a], [, b]) => b.n[0] - a.n[0] || b.n[1] - a.n[1]);
  const [[latest, top], ...earlier] = minors;
  return [
    { role: 'next', version: null, base: '/docs/next/', dir: 'next', ref: 'main' },
    { role: 'current', version: latest, base: '/docs/', dir: '', ref: top.tag },
    ...earlier.map(([version, r]) => ({
      role: 'archived', version, base: `/docs/v${version}/`, dir: `v${version}`, ref: r.tag,
    })),
  ];
}

// troupe's page contract: a port of packages/troupe/tests/userdocs.py's `parse` and `problems` on troupe's main
// (2026-10-19). Its messages are kept word for word, and tests/unit/troupe-front-matter.test.ts copies its cases.
// Front matter is a strict subset of YAML, so a page that parses here means the same to Astro's YAML loader.

/** Every key a troupe page may set, with its type. Must equal troupe's FRONT_MATTER_KEYS (checked by a test). */
export const FRONT_MATTER_KEYS = { title: 'string', description: 'string', status: 'string', prerelease: 'boolean', purpose: 'string' };
const STATUSES = ['written', 'planned'];

const KEY = /^[a-z][a-z0-9_]*$/;
// A plain scalar YAML reads as a string: no indicator first, and no ": " or " #" inside.
const PLAIN = /^[^\s\-?:,[\]{}#&*!|>'"%@`](?:(?!: | #)[^\n])*$/;
const RESERVED = new Set(['true', 'false', 'null', '~', 'yes', 'no', 'on', 'off']);

/** Python's repr of a value, so the messages that quote one say it as troupe's do. */
function repr(v) {
  if (v === undefined || v === null) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  const quote = v.includes("'") && !v.includes('"') ? '"' : "'";
  const escaped = [...v].map((c) => {
    if (c === '\\') return '\\\\';
    if (c === quote) return `\\${c}`;
    if (c === '\n') return '\\n';
    if (c === '\r') return '\\r';
    if (c === '\t') return '\\t';
    const code = c.codePointAt(0);
    return code < 0x20 || code === 0x7f ? `\\x${code.toString(16).padStart(2, '0')}` : c;
  });
  return quote + escaped.join('') + quote;
}

function scalar(raw) {
  if (raw === 'true' || raw === 'false') return raw === 'true';
  if (raw.startsWith('"')) {
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new TroupeDocsError(`${raw} isn't a double-quoted string with JSON's escapes`);
    }
    if (typeof value === 'string') return value;
  }
  if (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2) {
    const inner = raw.slice(1, -1);
    if (!inner.replaceAll("''", '').includes("'")) return inner.replaceAll("''", "'");
  }
  if (PLAIN.test(raw) && !RESERVED.has(raw.toLowerCase()) && !/^[-+.\p{Nd}]+$/u.test(raw)) return raw;
  throw new TroupeDocsError(
    `${raw} isn't a string, true or false; quote it with double quotes, as in "Flows: fork, join, swarm, loop"`,
  );
}

/**
 * A page's front matter and its body, refusing what troupe's subset doesn't allow.
 * @param {string} text
 * @returns {{ front: Record<string, string | boolean>, body: string }}
 */
export function parseFrontMatter(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  if (lines[0] !== '---') throw new TroupeDocsError("the page doesn't start with front matter: put `---` on its first line");
  const end = lines.indexOf('---', 1);
  if (end < 0) throw new TroupeDocsError('the front matter has no closing `---` line');
  /** @type {Record<string, string | boolean>} */
  const front = {};
  lines.slice(1, end).forEach((line, i) => {
    const number = i + 2;
    const at = line.indexOf(': ');
    const [key, raw] = at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at + 2)];
    if (at < 0 || !KEY.test(key) || raw !== raw.trim() || !raw) {
      throw new TroupeDocsError(`line ${number} isn't \`key: value\`: ${repr(line)}`);
    }
    if (Object.hasOwn(front, key)) throw new TroupeDocsError(`\`${key}\` is set twice; keep one`);
    try {
      front[key] = scalar(raw);
    } catch (error) {
      throw new TroupeDocsError(`\`${key}\` on line ${number}: ${error.message}`);
    }
  });
  return { front, body: lines.slice(end + 1).join('\n') };
}

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

/** What's wrong with a page's front matter against troupe's contract, in troupe's words and order. */
export function frontMatterProblems(front, body) {
  const found = [];
  for (const [key, value] of Object.entries(front)) {
    if (!Object.hasOwn(FRONT_MATTER_KEYS, key)) {
      found.push(`\`${key}\` isn't a front-matter key; the keys allowed are ${Object.keys(FRONT_MATTER_KEYS).join(', ')}`);
    } else if (typeof value !== FRONT_MATTER_KEYS[key]) {
      found.push(`\`${key}\` must be ${FRONT_MATTER_KEYS[key] === 'boolean' ? 'true or false' : 'a string'}`);
    }
  }
  for (const key of ['title', 'description']) {
    if (!nonEmpty(front[key])) found.push(`\`${key}\` is missing or empty; give the page a ${key}`);
  }
  const { status } = front;
  if (!STATUSES.includes(status)) found.push(`\`status\` must be \`written\` or \`planned\`, not ${repr(status)}`);
  const hasBody = body.trim() !== '';
  if (status === 'planned') {
    if (!nonEmpty(front.purpose)) found.push('a planned page needs a `purpose`: the line its placeholder shows');
    if (hasBody) found.push('a planned page has no body: set `status: written`, or remove the body');
  }
  if (status === 'written') {
    if (!hasBody) found.push('a written page needs a body, or `status: planned` and a `purpose`');
    if (!Object.hasOwn(front, 'prerelease')) {
      found.push(
        "a written page sets `prerelease`: `true` if it describes behaviour troupe doesn't have yet, `false` otherwise",
      );
    }
  }
  return found;
}

/** The six /docs sections, in sidebar order. troupe's user-docs spec lays docs/ out as these. */
export const SECTIONS = ['programme', 'opening-night', 'the-company', 'stagecraft', 'prompt-book', 'backstage'];

/** What's wrong with where a version's files sit, each named by its path under the repository (design D4). */
export function layoutProblems(paths) {
  return paths.flatMap((path) => {
    const parts = path.split('/');
    const at = `docs/${path}`;
    if (!path.endsWith('.md')) return [`${at}: only .md pages are accepted`];
    if (parts.length === 1 || !SECTIONS.includes(parts[0])) {
      return [`${at}: a page goes in one of the six sections: ${SECTIONS.join(', ')}`];
    }
    if (parts.length > 2) return [`${at}: a page sits directly in its section, not in a folder inside it`];
    return [];
  });
}

/** Refuses a version whose problems aren't empty, naming the version and each problem. */
export function refuse(version, problems) {
  if (problems.length === 0) return;
  const name = version.ref === 'main' ? "troupe's main" : version.ref;
  throw new TroupeDocsError(`${name} can't be built into /docs:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
}

// Where the pages come from (design D2): a bare clone of troupe-run/troupe, fetched on every run, or the local
// checkout TROUPE_DOCS names, whose main is its working tree.

export const TROUPE_REMOTE = 'https://github.com/troupe-run/troupe.git';

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}
const gitError = (error) => (error.stderr || error.message).trim();
const refName = (ref) => (ref === 'main' ? 'refs/heads/main' : `refs/tags/${ref}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Reads one ref's docs/ from a git directory: the paths under docs/, a page's text, and its last commit date. */
function fromGit(gitArgs) {
  return {
    list: (ref) =>
      git([...gitArgs, 'ls-tree', '-r', '--name-only', refName(ref), '--', 'docs/'])
        .split('\n').filter(Boolean).map((p) => p.slice('docs/'.length)),
    read: (ref, path) => git([...gitArgs, 'show', `${refName(ref)}:docs/${path}`]),
    /** Any file in the repository at `ref`, such as troupe's own page-contract module, for the drift tests. */
    readRepo: (ref, path) => git([...gitArgs, 'show', `${refName(ref)}:${path}`]),
    date: (ref, path) => git([...gitArgs, 'log', '-1', '--format=%cI', refName(ref), '--', `docs/${path}`]).trim() || null,
    tags: () => git([...gitArgs, 'tag', '--list']).split('\n').filter(Boolean),
  };
}

function cloned(cacheDir, remote) {
  const gitDir = ['--git-dir', cacheDir];
  try {
    if (!existsSync(join(cacheDir, 'HEAD'))) {
      try {
        git(['clone', '--bare', '--quiet', remote, cacheDir]);
      } catch (error) {
        rmSync(cacheDir, { recursive: true, force: true });
        throw error;
      }
    } else {
      git([...gitDir, 'remote', 'set-url', 'origin', remote]);
      git([...gitDir, 'fetch', '--quiet', '--prune', 'origin', '+refs/heads/main:refs/heads/main', '+refs/tags/*:refs/tags/*']);
    }
  } catch (error) {
    throw new TroupeDocsError(
      `couldn't fetch troupe-run/troupe (${remote}): ${gitError(error)}\n` +
        'Fix: retry once the network is back, or set TROUPE_DOCS to a local troupe checkout to build from it.',
    );
  }
  return { kind: 'remote', ...fromGit(gitDir) };
}

function local(value) {
  const refuse = (why) =>
    new TroupeDocsError(
      `TROUPE_DOCS is set to ${JSON.stringify(value)}, ${why}. Fix: set it to a troupe checkout (the folder that holds ` +
        'docs/), or unset it to build from troupe-run/troupe.',
    );
  if (value.trim() === '') throw refuse('which is empty');
  const root = resolve(value);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw refuse("which isn't a folder");
  if (!existsSync(join(root, 'docs')) || !statSync(join(root, 'docs')).isDirectory()) throw refuse('which has no docs/ folder');
  let top;
  try {
    top = git(['-C', root, 'rev-parse', '--show-toplevel']).trim();
  } catch {
    throw refuse("which isn't a git working tree");
  }
  if (realpathSync(top) !== realpathSync(root)) throw refuse(`which is inside the git working tree ${top}, not its top`);
  const tagged = fromGit(['-C', root]);
  const docs = join(root, 'docs');
  return {
    kind: 'local',
    ...tagged,
    // main is the working tree, uncommitted edits included, so a writer can preview them.
    list: (ref) => (ref === 'main' ? walk(docs).map((p) => relative(docs, p).split(sep).join('/')).sort() : tagged.list(ref)),
    read: (ref, path) => (ref === 'main' ? readFileSync(join(docs, path), 'utf8') : tagged.read(ref, path)),
    date: (ref, path) => {
      if (ref !== 'main') return tagged.date(ref, path);
      if (git(['-C', root, 'status', '--porcelain', '--', `docs/${path}`]).trim()) return null;
      return git(['-C', root, 'log', '-1', '--format=%cI', 'HEAD', '--', `docs/${path}`]).trim() || null;
    },
  };
}

/**
 * @typedef {object} Source
 * @property {'remote' | 'local'} kind
 * @property {() => string[]} tags
 * @property {(ref: string) => string[]} list
 * @property {(ref: string, path: string) => string} read
 * @property {(ref: string, path: string) => string} readRepo
 * @property {(ref: string, path: string) => string | null} date
 */

/**
 * Opens the pages' source: TROUPE_DOCS's checkout when it's set, otherwise the clone in `cacheDir`, fetched now.
 * @param {Record<string, string | undefined>} env
 * @param {{ cacheDir: string, remote?: string }} options
 * @returns {Source}
 */
export function openSource(env, { cacheDir, remote = TROUPE_REMOTE }) {
  return env.TROUPE_DOCS === undefined ? cloned(cacheDir, remote) : local(env.TROUPE_DOCS);
}

// Writing the pages (design D4, D7, D8). Each page keeps troupe's five fields and gains only the site's own:
// slug, editUrl, lastUpdated and pagefind. The manifest tells the sidebar, the version menu and the tests what was built.

/** The keys the sync adds to a troupe page. Nothing else is added (checked by a test). */
export const SITE_KEYS = ['slug', 'editUrl', 'lastUpdated', 'pagefind'];
const EDIT = 'https://github.com/troupe-run/troupe/edit/main/docs/';
const MARKER = '.troupe-docs';

/** Reads and checks every version's pages. Refuses a version with any problem, naming each. */
export function buildVersions(source) {
  const versions = chooseVersions(source.tags());
  const onMain = new Set(source.list('main'));
  return versions.map((version) => {
    const paths = source.list(version.ref);
    const problems = layoutProblems(paths);
    const pages = [];
    for (const path of paths.filter((p) => layoutProblems([p]).length === 0)) {
      try {
        const { front, body } = parseFrontMatter(source.read(version.ref, path));
        const found = frontMatterProblems(front, body);
        if (found.length) problems.push(...found.map((f) => `docs/${path}: ${f}`));
        else pages.push({ path, front, body, date: source.date(version.ref, path) });
      } catch (error) {
        if (!(error instanceof TroupeDocsError)) throw error;
        problems.push(`docs/${path}: ${error.message}`);
      }
    }
    refuse(version, problems);
    const editable = version.role === 'next' || (version.role === 'current' && version.ref === 'main');
    for (const p of pages) {
      p.editUrl = editable || (version.role === 'current' && onMain.has(p.path)) ? EDIT + p.path : false;
      p.pagefind = version.role === 'current';
    }
    return { ...version, pages };
  });
}

const yaml = (key, value) => `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`;

/** One page as Starlight reads it: troupe's fields, the site's, and a comment saying where to edit it. */
export function renderPage(version, page) {
  const lines = Object.entries(page.front).map(([k, v]) => yaml(k, v));
  // Astro slugs a page's id from its path, which drops the dot in v0.1, so each page names its own URL path.
  lines.push(yaml('slug', `docs/${version.dir ? `${version.dir}/` : ''}${page.path.slice(0, -'.md'.length)}`));
  lines.push(yaml('editUrl', page.editUrl));
  // Unquoted, so YAML reads it as a date, which Starlight's schema needs.
  if (page.date) lines.push(`lastUpdated: ${page.date}`);
  if (!page.pagefind) lines.push('pagefind: false');
  const from = `troupe-run/troupe ${version.ref === 'main' ? 'main' : version.ref}:docs/${page.path}`;
  return `---\n${lines.join('\n')}\n---\n<!-- Generated from ${from} by npm run docs:sync. Edit it there, not here. -->\n${page.body}`;
}

/** Replaces `outDir` with every version's pages, and writes the manifest. Refuses to clear a folder it didn't make. */
export function writeDocs(versions, outDir, manifestPath) {
  if (existsSync(outDir) && readdirSync(outDir).length && !existsSync(join(outDir, MARKER))) {
    throw new TroupeDocsError(`${outDir} holds files the docs sync didn't write, so it won't replace them. Fix: move them, then run it again.`);
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, MARKER), 'Written by npm run docs:sync from troupe-run/troupe. Everything here is replaced on each run.\n');
  for (const version of versions) {
    for (const page of version.pages) {
      const at = join(outDir, version.dir, page.path);
      mkdirSync(dirname(at), { recursive: true });
      writeFileSync(at, renderPage(version, page));
    }
  }
  const main = versions.find((v) => v.ref === 'main');
  const manifest = {
    versions: versions.map(({ pages, ...v }) => ({ ...v, pages: pages.map((p) => ({ path: p.path, title: p.front.title })) })),
    glossary: join(outDir, main.dir, 'prompt-book', 'glossary.md'),
  };
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/**
 * Fetches troupe, checks every version, and writes the pages and the manifest under `root`.
 * @param {{ env?: Record<string, string | undefined>, root: string, remote?: string }} options
 */
export function sync({ env = process.env, root, remote }) {
  const source = openSource(env, { cacheDir: join(root, '.cache', 'troupe.git'), remote });
  const versions = buildVersions(source);
  return writeDocs(versions, join(root, 'src', 'content', 'docs', 'docs'), join(root, 'src', 'generated', 'troupe-docs.json'));
}
