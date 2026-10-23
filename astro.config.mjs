import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import { isSatteriProcessor } from '@astrojs/markdown-satteri';
import { fileURLToPath } from 'node:url';
import { sync } from './scripts/troupe-docs-lib.mjs';
import { syncRoadmap } from './scripts/roadmap-lib.mjs';
import { loadRoadmapInputs, roadmapPlugin } from './scripts/roadmap-plugin.mjs';
import { troupeLinks } from './scripts/troupe-links.mjs';
import { CONTRIBUTING, firstPage, pageUrl } from './src/lib/docs-nav.ts';

// Writes /docs's pages from troupe-run/troupe before Astro reads content, for every command (dev, check, build,
// sync), redirects each version's root to its first page, and rewrites the pages' .md links to the site's URLs
// (spec: versioned-docs; design D2, D5, D6). Then reads the release milestones from troupe-run/infrastructure for
// /status/, marked against the release tags /docs was built from (spec: roadmap).
function troupeDocs() {
  return {
    name: 'troupe-docs',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig, logger }) => {
        // Preview serves a finished build, so it mustn't rewrite the pages another command may be building from.
        if (command === 'preview') return;
        const root = fileURLToPath(new URL('.', import.meta.url));
        const manifest = sync({ root });
        const redirects = {};
        for (const v of manifest.versions) {
          const first = firstPage(v.pages);
          if (first) redirects[v.base.slice(0, -1)] = pageUrl(v.base, first.path);
          logger.info(`${v.base} from ${v.ref}, ${v.pages.length} pages`);
        }
        const roadmap = syncRoadmap({ root, tags: manifest.releases });
        logger.info(`/status/ lists ${roadmap.releases.length} releases, the latest released ${roadmap.latest ?? 'none yet'}`);
        // The pages the website keeps moved out of /docs (design D10). troupe's "What is troupe?" links the first.
        redirects['/docs/programme/status-and-roadmap'] = '/status/';
        redirects['/docs/backstage/contributing'] = CONTRIBUTING;
        updateConfig({ redirects });
        // Added to the processor's own list, as Starlight adds its plugins, so neither replaces the other.
        const { processor } = config.markdown;
        if (!isSatteriProcessor(processor)) throw new Error(`troupe-docs needs the Sätteri Markdown processor, not ${processor.name}`);
        processor.options.mdastPlugins.push(troupeLinks(fileURLToPath(new URL('src/content/docs/docs/', import.meta.url))));
        // /status/'s status line and release list, where status.md marks them (spec: roadmap; design D5).
        const page = fileURLToPath(new URL('src/content/docs/status.md', import.meta.url));
        processor.options.mdastPlugins.push(roadmapPlugin({ page, load: () => loadRoadmapInputs(root) }));
      },
    },
  };
}

export default defineConfig({
  site: 'https://troupe.run',
  trailingSlash: 'always',
  integrations: [
    troupeDocs(),
    starlight({
      title: 'troupe docs',
      editLink: { baseUrl: 'https://github.com/troupe-run/website/edit/main/' },
      lastUpdated: true,
      plugins: [starlightBlog({ title: 'Blog', prefix: 'blog', navigation: 'none', recentPostCount: 5 })],
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://troupe.run/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      customCss: [
        '@fontsource-variable/bricolage-grotesque',
        '@fontsource-variable/dm-sans',
        '@fontsource/dm-mono/400.css',
        '@fontsource/dm-mono/500.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
      routeMiddleware: './src/route-middleware.ts',
      components: {
        Header: './src/components/docs/Header.astro',
        MobileMenuFooter: './src/components/docs/MobileMenuFooter.astro',
        Head: './src/components/docs/Head.astro',
        MarkdownContent: './src/components/docs/MarkdownContent.astro',
        ThemeProvider: './src/components/docs/ThemeProvider.astro',
        ThemeSelect: './src/components/docs/ThemeSelect.astro',
      },
      // The docs sidebar is built per version from src/lib/docs-nav.ts, in src/route-middleware.ts (design D6).
    }),
  ],
});
