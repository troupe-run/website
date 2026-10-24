// The pages rendered from data outside their own file, and the loader that renders them again when that data changes
// (troupe-run/website#35; status-milestones-refresh design D1, D2). Astro's glob loader keeps an entry's stored render
// while the entry's file is unchanged, and the store outlives a build: in node_modules/.astro, which the deploy
// restores from an earlier build's cache. These pages' files never change when their lists do, so without this a
// build could publish what an earlier one rendered. astro.config.mjs registers each page's plugin from this table and
// src/content.config.ts wraps the docs loader, so the two can't disagree about a page or what it's rendered from.
import { fileURLToPath } from 'node:url';
import { loadProtocolInputs, protocolPlugin } from './protocol-plugin.mjs';
import { loadRoadmapInputs, roadmapPlugin } from './roadmap-plugin.mjs';

/**
 * Each page's path from the root, the inputs its plugin renders from (`load(root)`), and the plugin.
 * @type {{ page: string, load: (root: string) => unknown, plugin: (options: { page: string, load: () => any }) => unknown }[]}
 */
export const GENERATED_PAGES = [
  // /status/: the milestones and release tags, in src/generated/roadmap.json, and its copy (spec: roadmap).
  { page: 'src/content/docs/status.md', load: loadRoadmapInputs, plugin: roadmapPlugin },
  // /protocol/: the protocol releases, in src/generated/troupe-docs.json, and its copy (spec: protocol-schemas).
  { page: 'src/content/docs/protocol.md', load: loadProtocolInputs, plugin: protocolPlugin },
];

/**
 * `loader`, wrapped so that a page in `pages` whose inputs changed since the last load is dropped from the store first,
 * and so rendered again. Each page's inputs digest is kept in the collection's meta store. Only the Content Loader API
 * is used. A missing or malformed input throws, naming its file, as the plugin would.
 * @param {{ name: string, load: (context: any) => Promise<void> }} loader
 * @param {typeof GENERATED_PAGES} [pages]
 * @returns {{ name: string, load: (context: any) => Promise<void> }}
 */
export function rerenderGeneratedPages(loader, pages = GENERATED_PAGES) {
  return {
    ...loader,
    load: async (context) => {
      const root = fileURLToPath(context.config.root);
      for (const { page, load } of pages) {
        const key = `generated-inputs:${page}`;
        const digest = context.generateDigest(JSON.stringify(load(root)));
        if (context.meta.get(key) === digest) continue;
        for (const [id, entry] of context.store.entries()) if (entry.filePath === page) context.store.delete(id);
        context.meta.set(key, digest);
      }
      return loader.load(context);
    },
  };
}
