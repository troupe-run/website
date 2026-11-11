import { describe, it, expect } from 'vitest';
import { collectLinks, repoLink } from '../../scripts/troupe-repo-links.mjs';

// A link from a troupe page into troupe's repository names a ref and a path, which the sync checks against its source
// (spec: versioned-docs; design D2, D3).
const REPO = 'https://github.com/troupe-run/troupe';

describe('repoLink', () => {
  it.each([
    ['a file by blob', `${REPO}/blob/main/protocol/CHANGELOG.md`, { ref: 'main', path: 'protocol/CHANGELOG.md' }],
    ['a folder by tree', `${REPO}/tree/main/plugins`, { ref: 'main', path: 'plugins' }],
    ['a file at a tag', `${REPO}/blob/troupe-v0.1.0/packages/troupe/CHANGELOG.md`, { ref: 'troupe-v0.1.0', path: 'packages/troupe/CHANGELOG.md' }],
    ['a link with an anchor, dropping it', `${REPO}/blob/main/docs/README.md#layout`, { ref: 'main', path: 'docs/README.md' }],
    ['a link with a query, dropping it', `${REPO}/blob/main/docs/README.md?plain=1`, { ref: 'main', path: 'docs/README.md' }],
    ['a percent-encoded path, decoding it', `${REPO}/blob/main/docs/a%20b.md`, { ref: 'main', path: 'docs/a b.md' }],
    ['a trailing slash, removing it', `${REPO}/tree/main/plugins/`, { ref: 'main', path: 'plugins' }],
    ['the repository root by tree', `${REPO}/tree/main`, { ref: 'main', path: '' }],
    ['the repository root with a trailing slash', `${REPO}/tree/main/`, { ref: 'main', path: '' }],
    ['the owner and repository in another case', 'https://github.com/Troupe-Run/Troupe/blob/main/README.md', { ref: 'main', path: 'README.md' }],
    ['http, not https', 'http://github.com/troupe-run/troupe/blob/main/README.md', { ref: 'main', path: 'README.md' }],
  ])('reads %s', (_, url, expected) => {
    expect(repoLink(url)).toEqual(expected);
  });

  it.each([
    ['an issue', `${REPO}/issues/366`],
    ['a release', `${REPO}/releases`],
    ["the repository's front page", REPO],
    ['the edit view of a file', `${REPO}/edit/main/docs/README.md`],
    ['another repository', 'https://github.com/troupe-run/website/blob/main/README.md'],
    ['a repository whose name starts with troupe', 'https://github.com/troupe-run/troupe-extra/blob/main/README.md'],
    ['raw.githubusercontent.com', 'https://raw.githubusercontent.com/troupe-run/troupe/main/README.md'],
    ['another host', 'https://example.com/troupe-run/troupe/blob/main/README.md'],
    ['a relative link', '../stagecraft/build-a-flow.md'],
    ['an anchor', '#errors'],
    ['a mailto link', 'mailto:someone@example.com'],
    ['blob with no ref', `${REPO}/blob`],
  ])('leaves %s alone', (_, url) => {
    expect(repoLink(url)).toBeNull();
  });

  it('refuses a path with a malformed %-escape rather than skipping it, naming the link', () => {
    expect(() => repoLink(`${REPO}/blob/main/docs/a%zz.md`)).toThrow(
      `the link ${REPO}/blob/main/docs/a%zz.md isn't a valid URL: its path has a malformed %-escape`,
    );
  });
});

describe('collectLinks, through the Markdown processor the site renders with', () => {
  it('finds an inline link', async () => {
    expect(await collectLinks('See [the changelog](https://example.com/a).')).toEqual(['https://example.com/a']);
  });

  it('finds a reference definition', async () => {
    expect(await collectLinks('See [the changelog][c].\n\n[c]: https://example.com/c\n')).toEqual(['https://example.com/c']);
  });

  it('finds a GFM autolink', async () => {
    expect(await collectLinks('See https://example.com/auto for more.')).toEqual(['https://example.com/auto']);
  });

  it('finds every link on the page, in order', async () => {
    expect(await collectLinks('[a](https://example.com/a) and [b](https://example.com/b)')).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });

  it('finds nothing in inline code or a fenced code block', async () => {
    const markdown = 'Write `[x](https://example.com/x)`.\n\n```md\n[y](https://example.com/y)\nhttps://example.com/z\n```\n';
    expect(await collectLinks(markdown)).toEqual([]);
  });
});
