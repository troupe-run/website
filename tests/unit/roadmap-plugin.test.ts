import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { roadmapPlugin } from '../../scripts/roadmap-plugin.mjs';

// The roadmap plugin renders /status/'s generated parts where status.md marks them (spec: roadmap; design D5, D6).
const PAGE = resolve('src/content/docs/status.md');
const COPY = {
  unreleased: 'Pre-alpha. Nothing has been released yet.',
  released: 'Pre-alpha. The latest release is {latest}, installed with uv from its tag on GitHub.',
  releasedOn: 'Released {date}',
};
type Release = { version: string; description: string; released: string | null };
const PLAN: Release[] = [
  { version: '0.1.0', description: 'One real actor, safely: an actor <runs> & you *keep* it', released: null },
  { version: '0.2.0', description: 'Config by hand: edits are read back', released: null },
];
const STATUS = '<!-- roadmap:status (from troupe\'s release tags) -->';
const RELEASES = '<!-- roadmap:releases (from tofu/milestones.json in troupe-run/infrastructure; edit it there) -->';
const PAGE_TEXT = `## Status\n\n${STATUS}\n\n## Releases\n\n${RELEASES}\n\n## How to read it\n\nText.\n`;

async function render(markdown: string, roadmap: { releases: Release[]; latest: string | null }, file = PAGE) {
  const plugin = roadmapPlugin({ page: PAGE, load: () => ({ roadmap, copy: COPY }) });
  const processor = await createSatteriMarkdownProcessor({ mdastPlugins: [plugin], syntaxHighlight: false });
  return (await processor.render(markdown, { fileURL: pathToFileURL(file) })).code;
}
const released = (released: (string | null)[]) => PLAN.map((r, i) => ({ ...r, released: released[i] }));

describe('roadmap plugin: the list', () => {
  it('replaces the releases marker with an ordered list in version order, leaving no marker comment', async () => {
    const html = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).toContain('<ol class="roadmap-releases" role="list">');
    expect(html).not.toContain('roadmap:');
    expect(html.indexOf('0.1.0')).toBeLessThan(html.indexOf('0.2.0'));
    expect(html.indexOf('<h2')).toBeLessThan(html.indexOf('<ol'));
  });

  it('shows each version in bold and its description word for word, as text, not Markdown or HTML', async () => {
    const html = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).toContain('<li><strong>0.1.0</strong> One real actor, safely: an actor &lt;runs&gt; &amp; you *keep* it</li>');
  });

  it('gives a release that is out "Released" and its date in a <time>, and nothing to one that is not', async () => {
    const html = await render(PAGE_TEXT, { releases: released(['2026-11-05', null]), latest: '0.1.0' });
    expect(html).toContain('<span class="roadmap-released">Released <time datetime="2026-11-05">2026-11-05</time></span>');
    expect(html.match(/roadmap-released/g)).toHaveLength(1);
    expect(html).toContain('<li><strong>0.2.0</strong> Config by hand: edits are read back</li>');
  });
});

describe('roadmap plugin: the status line', () => {
  it('says nothing has been released yet, before the first release', async () => {
    const html = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).toContain('<p>Pre-alpha. Nothing has been released yet.</p>');
  });

  it('names the latest release once there is one', async () => {
    const html = await render(PAGE_TEXT, { releases: released(['2026-11-05', null]), latest: '0.1.0' });
    expect(html).toContain('<p>Pre-alpha. The latest release is 0.1.0, installed with uv from its tag on GitHub.</p>');
  });
});

describe('roadmap plugin: where it runs, and its refusals', () => {
  it('leaves every other page alone, markers included', async () => {
    const html = await render(PAGE_TEXT, { releases: PLAN, latest: null }, resolve('src/content/docs/blog/post.md'));
    expect(html).toContain('roadmap:releases');
    expect(html).not.toContain('<ol');
  });

  it.each([
    ['the releases marker is missing', `${STATUS}\n`, /status\.md has no roadmap:releases marker/],
    ['the status marker is missing', `${RELEASES}\n`, /status\.md has no roadmap:status marker/],
    ['a marker is repeated', `${STATUS}\n\n${RELEASES}\n\n${RELEASES}\n`, /status\.md has 2 roadmap:releases markers/],
    ['a marker is unknown', `${STATUS}\n\n${RELEASES}\n\n<!-- roadmap:dates -->\n`, /status\.md has an unknown marker roadmap:dates/],
  ])('fails the page when %s, naming the page and the marker', async (_, markdown, message) => {
    await expect(render(markdown, { releases: PLAN, latest: null })).rejects.toThrow(message);
  });
});
