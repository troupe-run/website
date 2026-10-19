import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import { isSatteriProcessor } from '@astrojs/markdown-satteri';
import { fileURLToPath } from 'node:url';
import { sync } from './scripts/troupe-docs-lib.mjs';
import { troupeLinks } from './scripts/troupe-links.mjs';
import { firstPage, pageUrl } from './src/lib/docs-nav.ts';

// Writes /docs's pages from troupe-run/troupe before Astro reads content, for every command (dev, check, build,
// sync), redirects each version's root to its first page, and rewrites the pages' .md links to the site's URLs
// (spec: versioned-docs; design D2, D5, D6).
function troupeDocs() {
  return {
    name: 'troupe-docs',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, logger }) => {
        const root = fileURLToPath(new URL('.', import.meta.url));
        const manifest = sync({ root });
        const redirects = {};
        for (const v of manifest.versions) {
          const first = firstPage(v.pages);
          if (first) redirects[v.base.slice(0, -1)] = pageUrl(v.base, first.path);
          logger.info(`${v.base} from ${v.ref}, ${v.pages.length} pages`);
        }
        updateConfig({ redirects });
        // Added to the processor's own list, as Starlight adds its plugins, so neither replaces the other.
        const { processor } = config.markdown;
        if (!isSatteriProcessor(processor)) throw new Error(`troupe-docs needs the Sätteri Markdown processor, not ${processor.name}`);
        processor.options.mdastPlugins.push(troupeLinks(fileURLToPath(new URL('src/content/docs/docs/', import.meta.url))));
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
