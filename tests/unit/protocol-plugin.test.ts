import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { protocolPlugin } from '../../scripts/protocol-plugin.mjs';

// The protocol plugin renders /protocol/'s release list where protocol.md marks it (spec: protocol-schemas; design D8).
const PAGE = resolve('src/content/docs/protocol.md');
const COPY = {
  none: 'No protocol release yet. Until there is one, `/protocol/` and `/protocol/0/` serve troupe’s unreleased `main`.',
  latest: '{version} (latest), at {path}',
  release: '{version}, at {path}',
};
const MARKER = '<!-- protocol:releases (from troupe\'s protocol-v* tags) -->';
const PAGE_TEXT = `## Releases\n\n${MARKER}\n\n## What each schema defines\n\nText.\n`;

async function render(releases: string[], markdown = PAGE_TEXT, file = PAGE) {
  const plugin = protocolPlugin({ page: PAGE, load: () => ({ releases, copy: COPY }) });
  const processor = await createSatteriMarkdownProcessor({ mdastPlugins: [plugin], syntaxHighlight: false });
  return (await processor.render(markdown, { fileURL: pathToFileURL(file) })).code;
}

describe('protocol plugin', () => {
  it('says there is no release yet, with the paths and main as code, leaving no marker', async () => {
    const html = await render([]);
    expect(html).toContain(
      "<p>No protocol release yet. Until there is one, <code>/protocol/</code> and <code>/protocol/0/</code> serve troupe’s unreleased <code>main</code>.</p>",
    );
    expect(html).not.toContain('protocol:releases');
    expect(html).not.toContain('<ul');
  });

  it('lists the releases newest first, as given, naming the first as the latest, with each copy as code', async () => {
    const html = await render(['1.0.0', '0.2.0', '0.1.0']);
    expect(html).toMatch(
      /<ul[^>]*>\s*<li>1\.0\.0 \(latest\), at <code>\/protocol\/1\.0\.0\/<\/code><\/li>\s*<li>0\.2\.0, at <code>\/protocol\/0\.2\.0\/<\/code><\/li>\s*<li>0\.1\.0, at <code>\/protocol\/0\.1\.0\/<\/code><\/li>\s*<\/ul>/,
    );
    expect(html).not.toContain('No protocol release yet');
  });

  it('leaves other pages alone', async () => {
    const html = await render(['0.1.0'], PAGE_TEXT, resolve('src/content/docs/status.md'));
    expect(html).not.toContain('0.1.0, at');
  });

  it('refuses a page with no marker, two markers, or an unknown one, naming the page and the fix', async () => {
    await expect(render([], '## Releases\n')).rejects.toThrow(
      'src/content/docs/protocol.md has no protocol:releases marker: put `<!-- protocol:releases -->` on its own line where it goes',
    );
    await expect(render([], `${MARKER}\n\n${MARKER}\n`)).rejects.toThrow('src/content/docs/protocol.md has 2 protocol:releases markers: keep one');
    await expect(render([], `${MARKER}\n\n<!-- protocol:status -->\n`)).rejects.toThrow(
      'src/content/docs/protocol.md has an unknown marker protocol:status: use protocol:releases',
    );
  });
});
