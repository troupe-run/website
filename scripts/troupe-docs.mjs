// npm run docs:sync: fetch troupe-run/troupe and write /docs's pages and /protocol/'s schemas, then
// troupe-run/infrastructure's milestones for /status/, as every Astro command does through the troupe-docs integration
// in astro.config.mjs (spec: versioned-docs, protocol-schemas, roadmap). TROUPE_DOCS and TROUPE_MILESTONES build from
// local checkouts.
import { fileURLToPath } from 'node:url';
import { sync, TroupeDocsError } from './troupe-docs-lib.mjs';
import { RoadmapError, syncRoadmap } from './roadmap-lib.mjs';

try {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const manifest = sync({ root });
  for (const v of manifest.versions) console.log(`docs:sync: ${v.base} from ${v.ref}, ${v.pages.length} pages`);
  const { copies } = manifest.protocol;
  console.log(`docs:sync: /protocol/ has ${copies.length} copies, the latest from ${copies[0].ref}`);
  const roadmap = syncRoadmap({ root, tags: manifest.releases });
  console.log(`docs:sync: /status/ lists ${roadmap.releases.length} releases, the latest released ${roadmap.latest ?? 'none yet'}`);
} catch (error) {
  if (!(error instanceof TroupeDocsError) && !(error instanceof RoadmapError)) throw error;
  console.error(`docs:sync: ${error.message}`);
  process.exit(1);
}
