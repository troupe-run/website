// npm run docs:sync: fetch troupe-run/troupe and write /docs's pages, as every Astro command does through the
// troupe-docs integration in astro.config.mjs (spec: versioned-docs). TROUPE_DOCS builds from a local checkout.
import { fileURLToPath } from 'node:url';
import { sync, TroupeDocsError } from './troupe-docs-lib.mjs';

try {
  const manifest = sync({ root: fileURLToPath(new URL('..', import.meta.url)) });
  for (const v of manifest.versions) console.log(`docs:sync: ${v.base} from ${v.ref}, ${v.pages.length} pages`);
} catch (error) {
  if (!(error instanceof TroupeDocsError)) throw error;
  console.error(`docs:sync: ${error.message}`);
  process.exit(1);
}
