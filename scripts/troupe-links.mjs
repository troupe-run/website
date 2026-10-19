// troupe's pages link each other by relative .md paths, which work on GitHub. On the site, each becomes that page's
// URL in the same version (spec: versioned-docs; design D5). A Sätteri mdast plugin, so it sees links as nodes, never
// text inside code.
import { posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION_DIR = /^(next|v\d+\.\d+)$/;
// A URL with a scheme (https:, mailto:), a site path, or an anchor on the same page.
const NOT_RELATIVE = /^([a-z][a-z0-9+.-]*:|\/|#)/i;

/** The site URL for `url`, a link in the page at `page` (its path under docs/) in the version at `base`. */
export function rewriteLink(url, page, base) {
  if (NOT_RELATIVE.test(url)) return url;
  const hash = url.indexOf('#');
  const [path, anchor] = hash < 0 ? [url, ''] : [url.slice(0, hash), url.slice(hash)];
  if (!path.endsWith('.md')) {
    throw new Error(`the link ${url} isn't a .md page: link another page by its .md path, or anything else by a full URL`);
  }
  const target = posix.normalize(posix.join(posix.dirname(page), path));
  if (target.startsWith('../') || target === '..') {
    throw new Error(`the link ${url} leaves docs/: link a file outside the user docs by its GitHub URL`);
  }
  return `${base}${target.slice(0, -'.md'.length)}/${anchor}`;
}

/** Where a generated file sits: its version's base URL and its path under troupe's docs/. Null outside `docsDir`. */
function locate(docsDir, fileURL) {
  if (!fileURL) return null;
  const rel = relative(docsDir, fileURLToPath(fileURL)).split(sep).join('/');
  if (rel.startsWith('..') || rel === '') return null;
  const [first, ...rest] = rel.split('/');
  return VERSION_DIR.test(first) ? { base: `/docs/${first}/`, page: rest.join('/'), rel } : { base: '/docs/', page: rel, rel };
}

/** The plugin, for pages under `docsDir` (the generated docs) only. */
export function troupeLinks(docsDir) {
  return ({ fileURL }) => {
    const at = locate(docsDir, fileURL);
    if (!at) return null;
    const rewrite = (node, ctx) => {
      let url;
      try {
        url = rewriteLink(node.url, at.page, at.base);
      } catch (error) {
        throw new Error(`${at.rel} (troupe's docs/${at.page}): ${error.message}`);
      }
      if (url !== node.url) ctx.setProperty(node, 'url', url);
    };
    return { name: 'troupe-links', link: rewrite, definition: rewrite };
  };
}
