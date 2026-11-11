// Links from a troupe page into troupe's repository (github.com/troupe-run/troupe/blob/<ref>/<path>, or /tree/), which
// the sync checks against the clone it reads the pages from, so a link to a file that isn't there stops the build
// rather than waiting for the weekly external check (spec: versioned-docs; design D2, D3).
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { pathToFileURL } from 'node:url';

import { TroupeDocsError } from './troupe-error.mjs';

const REPO = ['troupe-run', 'troupe'];
const VIEWS = new Set(['blob', 'tree']);

/**
 * The ref and path a link into troupe's repository names, or null for any other URL. The ref is one segment (design
 * D3): a branch with a `/` can't be told from its path, so the check accepts only `main`, a tag or a commit. The
 * query and anchor are dropped, the path is percent-decoded, and a trailing `/` is removed.
 * @param {string} url
 * @returns {{ ref: string, path: string } | null}
 */
export function repoLink(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null; // a relative link, which troupe-links.mjs handles
  }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.hostname.toLowerCase() !== 'github.com') return null;
  const [owner, repo, view, ref, ...rest] = parsed.pathname.split('/').slice(1);
  if (owner?.toLowerCase() !== REPO[0] || repo?.toLowerCase() !== REPO[1] || !VIEWS.has(view) || !ref) return null;
  try {
    return { ref: decodeURIComponent(ref), path: decodeURIComponent(rest.join('/')).replace(/\/+$/, '') };
  } catch {
    throw new TroupeDocsError(`the link ${url} isn't a valid URL: its path has a malformed %-escape`);
  }
}

/**
 * Refuses a path that isn't a plain path inside the repository: `..` or `.` segments, empty ones, or control
 * characters (design D4). A link's path comes from a URL, so `%2e%2e` or `%0A` can reach here after decoding.
 */
export function refuseOddPath(path) {
  if (/[\x00-\x1f\x7f]/.test(path)) {
    throw new TroupeDocsError(`${JSON.stringify(path)} isn't a path in troupe's repository: it has a control character`);
  }
  if (path !== '' && path.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new TroupeDocsError(`${JSON.stringify(path)} isn't a path in troupe's repository: it has an empty, . or .. part`);
  }
}

let processor;
let renders = 0;
const pending = new Map();

/**
 * Every link a page renders, in order: inline links, reference definitions and GFM autolinks, but nothing in code.
 * Found by the Markdown processor the site renders with, so the check sees what the reader gets (design D2). The
 * processor only renders asynchronously, so the sync is async. One processor serves every page: each render has a
 * file URL of its own, which the plugin uses to find where that page's links go, so calls can overlap.
 * @param {string} markdown
 * @returns {Promise<string[]>}
 */
export async function collectLinks(markdown) {
  processor ??= createSatteriMarkdownProcessor({
    syntaxHighlight: false,
    mdastPlugins: [
      ({ fileURL }) => {
        const found = pending.get(String(fileURL));
        if (!found) return null;
        const collect = (node) => {
          found.push(node.url);
        };
        return { name: 'troupe-repo-links', link: collect, definition: collect };
      },
    ],
  });
  const fileURL = pathToFileURL(`/troupe-repo-links/${(renders += 1)}.md`);
  const found = [];
  pending.set(String(fileURL), found);
  try {
    await (await processor).render(markdown, { fileURL });
  } finally {
    pending.delete(String(fileURL));
  }
  return found;
}

/**
 * What's wrong with a version's links into troupe's repository, each naming the page, the link and the fix, in the
 * page contract's style (design D3 to D5). The sync calls it for the versions read from main.
 * @param {import('./troupe-docs-lib.mjs').Source} source
 * @param {{ ref: string, pages: { path: string, body: string }[] }} version
 * @returns {Promise<string[]>}
 */
export async function repoLinkProblems(source, version) {
  const problems = [];
  const toLookUp = [];
  const known = new Map();
  for (const page of version.pages) {
    const at = `docs/${page.path}`;
    for (const url of await collectLinks(page.body)) {
      let link;
      try {
        link = repoLink(url);
        if (link) refuseOddPath(link.path);
      } catch (error) {
        if (!(error instanceof TroupeDocsError)) throw error;
        problems.push(`${at}: the link ${url}: ${error.message}`);
        continue;
      }
      if (!link) continue;
      if (!known.has(link.ref)) known.set(link.ref, source.hasRef(link.ref));
      if (!known.get(link.ref)) {
        problems.push(
          `${at}: the link ${url} names ${link.ref}, which isn't main, a tag or a commit in troupe-run/troupe: ` +
            'link main, a tag or a commit',
        );
        continue;
      }
      toLookUp.push({ at, url, ...link });
    }
  }
  const found = source.exists(toLookUp.map(({ ref, path }) => ({ ref, path })));
  toLookUp.forEach(({ at, url, ref, path }, i) => {
    if (!found[i]) {
      problems.push(`${at}: the link ${url} names ${path}, which isn't at ${ref}: link it once it exists, or link a path that does`);
    }
  });
  return problems;
}
