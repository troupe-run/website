// Renders /protocol/'s release list into src/content/docs/protocol.md, where its marker says (spec: protocol-schemas;
// design D8). The marker is an HTML comment on its own line that starts `<!-- protocol:releases`. The releases come from
// the manifest the troupe sync wrote, and the words from src/content/copy/protocol.md. A Sätteri mdast plugin, like
// roadmap-plugin.mjs, so the page keeps its own headings and prose in Markdown.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const MARKER = /^<!--\s*protocol:([a-z-]*)[\s\S]*-->$/;
const MARKERS = ['releases'];

/** The inputs the plugin renders from: the protocol releases the sync recorded, and the copy's `protocol` section. */
export function loadProtocolInputs(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'src', 'generated', 'troupe-docs.json'), 'utf8'));
  const text = readFileSync(join(root, 'src', 'content', 'copy', 'protocol.md'), 'utf8');
  const copy = parse(/^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '');
  return { releases: manifest.protocol.releases, copy };
}

/** Phrasing nodes for `words`, where text in backticks is code. */
function phrasing(words) {
  return words.split(/`([^`]*)`/).map((part, i) => (i % 2 ? { type: 'inlineCode', value: part } : { type: 'text', value: part }))
    .filter((n) => n.value !== '');
}

/** A release's line: `template` with {version} as text and {path} as code. */
function line(template, version) {
  return phrasing(template.replace('{version}', version).replace('{path}', `\`/protocol/${version}/\``));
}

function releaseList(releases, copy) {
  if (releases.length === 0) return { type: 'paragraph', children: phrasing(copy.none) };
  return {
    type: 'list',
    data: { hProperties: { className: ['protocol-releases'] } },
    ordered: false,
    spread: false,
    children: releases.map((version, i) => ({
      type: 'listItem',
      spread: false,
      children: [{ type: 'paragraph', children: line(i === 0 ? copy.latest : copy.release, version) }],
    })),
  };
}

/**
 * The plugin, for `page` only. `load` returns `{ releases, copy }`, the releases newest first, and is called once per
 * render of the page.
 * @param {{ page: string, load: () => { releases: string[], copy: { none: string, latest: string, release: string } } }} options
 */
export function protocolPlugin({ page, load }) {
  return ({ fileURL }) => {
    if (!fileURL || fileURLToPath(fileURL) !== page) return null;
    const { releases, copy } = load();
    let found = 0;
    const name = 'src/content/docs/protocol.md';
    return {
      name: 'protocol',
      html: (node, ctx) => {
        const marker = MARKER.exec(node.value.trim())?.[1];
        if (marker === undefined) return;
        if (!MARKERS.includes(marker)) {
          throw new Error(`${name} has an unknown marker protocol:${marker}: use ${MARKERS.map((m) => `protocol:${m}`).join(' or ')}`);
        }
        found += 1;
        ctx.replaceNode(node, releaseList(releases, copy));
      },
      after: () => {
        if (found === 0) throw new Error(`${name} has no protocol:releases marker: put \`<!-- protocol:releases -->\` on its own line where it goes`);
        if (found > 1) throw new Error(`${name} has ${found} protocol:releases markers: keep one`);
      },
    };
  };
}
