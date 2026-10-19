import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { rewriteLink, troupeLinks } from '../../scripts/troupe-links.mjs';

// Links between troupe's pages are .md paths, so they work on GitHub; on the site they lead to that page in the same
// version (spec: versioned-docs; design D5).
const DOCS = resolve('src/content/docs/docs');

describe('rewriteLink', () => {
  it.each([
    ['a sibling page', 'gates-and-decisions.md', 'the-company/flows.md', '/docs/', '/docs/the-company/gates-and-decisions/'],
    ['a page in another section', '../stagecraft/build-a-flow.md', 'the-company/flows.md', '/docs/', '/docs/stagecraft/build-a-flow/'],
    ['a link with an anchor', 'cli.md#errors', 'prompt-book/events.md', '/docs/', '/docs/prompt-book/cli/#errors'],
    ['a link in an archived version', '../stagecraft/build-a-flow.md', 'the-company/flows.md', '/docs/v0.1/', '/docs/v0.1/stagecraft/build-a-flow/'],
    ['a link in next', 'flows.md', 'the-company/notes.md', '/docs/next/', '/docs/next/the-company/flows/'],
    ['a section path that resolves back into its section', '../the-company/lineage.md', 'the-company/notes.md', '/docs/', '/docs/the-company/lineage/'],
  ])('rewrites %s', (_, url, page, base, expected) => {
    expect(rewriteLink(url, page, base)).toBe(expected);
  });

  it.each([
    ['an absolute URL', 'https://troupe.run/docs/programme/status-and-roadmap/'],
    ['a mailto link', 'mailto:someone@example.com'],
    ['a site path', '/status/'],
    ['an anchor on the same page', '#errors'],
  ])('leaves %s as written', (_, url) => {
    expect(rewriteLink(url, 'programme/what-is-troupe.md', '/docs/')).toBe(url);
  });

  it('refuses a relative link that leaves docs/, naming the link and saying to use a GitHub URL', () => {
    expect(() => rewriteLink('../../protocol/schemas.md', 'prompt-book/events.md', '/docs/')).toThrow(
      'the link ../../protocol/schemas.md leaves docs/: link a file outside the user docs by its GitHub URL',
    );
  });

  it("refuses a relative link that isn't a .md page", () => {
    expect(() => rewriteLink('diagram.png', 'the-company/flows.md', '/docs/')).toThrow(
      "the link diagram.png isn't a .md page: link another page by its .md path, or anything else by a full URL",
    );
  });
});

// Rendered through Astro's own Markdown pipeline (Sätteri), as the site renders a page.
async function render(markdown: string, file: string) {
  const processor = await createSatteriMarkdownProcessor({ mdastPlugins: [troupeLinks(DOCS)], syntaxHighlight: false });
  return (await processor.render(markdown, { fileURL: pathToFileURL(join(DOCS, file)) })).code;
}

describe('troupeLinks, in the Markdown pipeline', () => {
  it("rewrites a page's links to its version's URLs", async () => {
    const html = await render('See [flows](flows.md) and [the CLI](../prompt-book/cli.md#errors).', 'v0.1/the-company/notes.md');
    expect(html).toContain('href="/docs/v0.1/the-company/flows/"');
    expect(html).toContain('href="/docs/v0.1/prompt-book/cli/#errors"');
  });

  it('rewrites a reference-style link through its definition', async () => {
    const html = await render('See [flows][f].\n\n[f]: flows.md', 'the-company/notes.md');
    expect(html).toContain('href="/docs/the-company/flows/"');
  });

  it('leaves links in inline code and code blocks as written', async () => {
    const html = await render('Write `[x](other.md)`.\n\n```md\n[y](other.md)\n```\n', 'the-company/notes.md');
    expect(html).toContain('[x](other.md)');
    expect(html).toContain('[y](other.md)');
    expect(html).not.toContain('/docs/the-company/other/');
  });

  it("doesn't touch pages outside the generated docs, such as the blog", async () => {
    const processor = await createSatteriMarkdownProcessor({ mdastPlugins: [troupeLinks(DOCS)], syntaxHighlight: false });
    const { code } = await processor.render('[x](other.md)', { fileURL: pathToFileURL(resolve('src/content/docs/blog/post.md')) });
    expect(code).toContain('href="other.md"');
  });

  it('fails the page on a link out of docs/, naming the page and the link', async () => {
    await expect(render('[p](../../protocol/schemas.md)', 'next/prompt-book/events.md')).rejects.toThrow(
      "next/prompt-book/events.md (troupe's docs/prompt-book/events.md): the link ../../protocol/schemas.md leaves docs/",
    );
  });
});
