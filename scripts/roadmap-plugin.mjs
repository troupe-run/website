// Renders /status/'s generated parts into src/content/docs/status.md, where its markers say (spec: roadmap; design D5,
// D6). A marker is an HTML comment on its own line that starts `<!-- roadmap:NAME`: `status` becomes the status line,
// and `releases` the list of releases from src/generated/roadmap.json. A Sätteri mdast plugin, like troupe-links, so
// the page keeps its own headings and prose in Markdown.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const MARKER = /^<!--\s*roadmap:([a-z-]*)[\s\S]*-->$/;
const MARKERS = ['status', 'releases'];

/** The inputs the plugin renders from: the roadmap the sync wrote, and the copy's `roadmap` section. */
export function loadRoadmapInputs(root) {
  const roadmap = JSON.parse(readFileSync(join(root, 'src', 'generated', 'roadmap.json'), 'utf8'));
  const text = readFileSync(join(root, 'src', 'content', 'copy', 'roadmap.md'), 'utf8');
  const copy = parse(/^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '');
  return { roadmap, copy };
}

const text = (value) => ({ type: 'text', value });

function statusLine({ latest }, copy) {
  return { type: 'paragraph', children: [text(latest ? copy.released.replace('{latest}', latest) : copy.unreleased)] };
}

function releasedOn(date, copy) {
  const [before, after] = copy.releasedOn.split('{date}');
  const time = { type: 'roadmapTime', data: { hName: 'time', hProperties: { datetime: date } }, children: [text(date)] };
  const children = [before && text(before), time, after && text(after)].filter(Boolean);
  return { type: 'roadmapReleased', data: { hName: 'span', hProperties: { className: ['roadmap-released'] } }, children };
}

function releaseList({ releases }, copy) {
  return {
    type: 'list',
    // Ordered, for the order's sake, with its numbers hidden: the versions say it. role="list" keeps the list a list
    // in Safari, which drops the role from one styled with no markers.
    data: { hProperties: { className: ['roadmap-releases'], role: 'list' } },
    ordered: true,
    start: 1,
    spread: false,
    children: releases.map((r) => ({
      type: 'listItem',
      spread: false,
      children: [{
        type: 'paragraph',
        children: [
          { type: 'strong', children: [text(r.version)] },
          text(` ${r.description}`),
          ...(r.released ? [text(' '), releasedOn(r.released, copy)] : []),
        ],
      }],
    })),
  };
}

/**
 * The plugin, for `page` only. `load` returns `{ roadmap, copy }` and is called once per render of the page.
 * @param {{ page: string, load: () => { roadmap: { releases: { version: string, description: string, released: string | null }[], latest: string | null }, copy: { unreleased: string, released: string, releasedOn: string } } }} options
 */
export function roadmapPlugin({ page, load }) {
  return ({ fileURL }) => {
    if (!fileURL || fileURLToPath(fileURL) !== page) return null;
    const { roadmap, copy } = load();
    const found = Object.fromEntries(MARKERS.map((m) => [m, 0]));
    const name = 'src/content/docs/status.md';
    return {
      name: 'roadmap',
      html: (node, ctx) => {
        const marker = MARKER.exec(node.value.trim())?.[1];
        if (marker === undefined) return;
        if (!MARKERS.includes(marker)) {
          throw new Error(`${name} has an unknown marker roadmap:${marker}: use ${MARKERS.map((m) => `roadmap:${m}`).join(' or ')}`);
        }
        found[marker] += 1;
        ctx.replaceNode(node, marker === 'status' ? statusLine(roadmap, copy) : releaseList(roadmap, copy));
      },
      after: () => {
        for (const m of MARKERS) {
          if (found[m] === 0) throw new Error(`${name} has no roadmap:${m} marker: put \`<!-- roadmap:${m} -->\` on its own line where it goes`);
          if (found[m] > 1) throw new Error(`${name} has ${found[m]} roadmap:${m} markers: keep one`);
        }
      },
    };
  };
}
