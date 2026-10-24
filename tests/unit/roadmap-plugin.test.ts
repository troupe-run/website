import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { roadmapPlugin } from '../../scripts/roadmap-plugin.mjs';

// The roadmap plugin renders /status/'s generated parts where status.md marks them, and leaves out a section with
// nothing in it (spec: roadmap; design D1 to D3 of status-released-and-planned).
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
  { version: '0.10.0', description: 'Ten: after two', released: null },
];
const STATUS = '<!-- roadmap:status (from troupe\'s release tags) -->';
const RELEASED = '<!-- roadmap:released (from tofu/milestones.json in troupe-run/infrastructure; edit it there) -->';
const PLANNED = '<!-- roadmap:planned (from tofu/milestones.json in troupe-run/infrastructure; edit it there) -->';
const INTRO = 'Each milestone is a set of things you’ll be able to do.';
const PAGE_TEXT =
  `## Status\n\n${STATUS}\n\n## Releases\n\n${RELEASED}\n\n## Milestones\n\n${INTRO}\n\n${PLANNED}\n`;

async function render(markdown: string, roadmap: { releases: Release[]; latest: string | null }, file = PAGE) {
  const plugin = roadmapPlugin({ page: PAGE, load: () => ({ roadmap, copy: COPY }) });
  const processor = await createSatteriMarkdownProcessor({ mdastPlugins: [plugin], syntaxHighlight: false });
  const { code, metadata } = await processor.render(markdown, { fileURL: pathToFileURL(file) });
  return { html: code, headings: metadata.headings.map((h) => h.text) };
}
const released = (dates: (string | null)[]) => PLAN.map((r, i) => ({ ...r, released: dates[i] ?? null }));
// The versions in each rendered list, in order: the text of each <strong> between the section's <h2> and the next.
const section = (html: string, id: string) => html.split(/(?=<h2)/).find((s) => s.startsWith(`<h2 id="${id}"`));
const versions = (html: string | undefined) => [...(html ?? '').matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1]);

describe('roadmap plugin: the two lists', () => {
  it('lists released milestones under Releases and the rest under Milestones, each in the order given, none in both', async () => {
    const { html } = await render(PAGE_TEXT, { releases: released(['2026-01-01', null, null]), latest: '0.1.0' });
    expect(versions(section(html, 'releases'))).toEqual(['0.1.0']);
    expect(versions(section(html, 'milestones'))).toEqual(['0.2.0', '0.10.0']);
    expect(html).not.toContain('roadmap:');
  });

  it('renders each list as an ordered list with the roadmap-list class and role="list", after its heading', async () => {
    const { html } = await render(PAGE_TEXT, { releases: released(['2026-01-01', null, null]), latest: '0.1.0' });
    for (const id of ['releases', 'milestones']) {
      const part = section(html, id) as string;
      expect(part).toContain('<ol class="roadmap-list" role="list">');
      expect(part.indexOf('<h2')).toBeLessThan(part.indexOf('<ol'));
    }
  });

  it('shows each version in bold and its description word for word, as text, not Markdown or HTML', async () => {
    const { html } = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).toContain('<li><strong>0.1.0</strong> One real actor, safely: an actor &lt;runs&gt; &amp; you *keep* it</li>');
  });

  it('gives a release that is out "Released" and its date in a <time>, and nothing to one that is not', async () => {
    const { html } = await render(PAGE_TEXT, { releases: released(['2026-11-05', null, null]), latest: '0.1.0' });
    expect(section(html, 'releases')).toContain('<span class="roadmap-released">Released <time datetime="2026-11-05">2026-11-05</time></span>');
    expect(html.match(/roadmap-released/g)).toHaveLength(1);
    expect(html).toContain('<li><strong>0.2.0</strong> Config by hand: edits are read back</li>');
  });
});

describe('roadmap plugin: a section with nothing in it', () => {
  it('leaves out Releases, heading and marker, and keeps it out of the headings, when nothing is released', async () => {
    const { html, headings } = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).not.toContain('Releases</h2>');
    expect(html).not.toContain('roadmap:');
    expect(headings).toEqual(['Status', 'Milestones']);
    expect(section(html, 'milestones')).toContain(INTRO);
    expect(versions(section(html, 'milestones'))).toEqual(['0.1.0', '0.2.0', '0.10.0']);
  });

  it('lists Status, Releases and Milestones in the headings once something is released', async () => {
    const { headings } = await render(PAGE_TEXT, { releases: released(['2026-01-01', null, null]), latest: '0.1.0' });
    expect(headings).toEqual(['Status', 'Releases', 'Milestones']);
  });

  it('leaves out Milestones, its introduction included, when every milestone is released, keeping what comes after it', async () => {
    const { html, headings } = await render(`${PAGE_TEXT}\n## After\n\nText.\n`, {
      releases: released(['2026-01-01', '2026-02-01', '2026-03-01']), latest: '0.10.0',
    });
    expect(headings).toEqual(['Status', 'Releases', 'After']);
    expect(html).not.toContain(INTRO);
    expect(versions(section(html, 'releases'))).toEqual(['0.1.0', '0.2.0', '0.10.0']);
    expect(html).toContain('<p>Text.</p>');
  });
});

describe('roadmap plugin: Milestones last on the page', () => {
  it('leaves out Milestones to the end of the page when every milestone is released', async () => {
    const { html, headings } = await render(PAGE_TEXT, {
      releases: released(['2026-01-01', '2026-02-01', '2026-03-01']), latest: '0.10.0',
    });
    expect(headings).toEqual(['Status', 'Releases']);
    expect(html).not.toContain(INTRO);
    expect(html).not.toContain('roadmap:');
  });
});

describe('roadmap plugin: the status line', () => {
  it('says nothing has been released yet, before the first release', async () => {
    const { html } = await render(PAGE_TEXT, { releases: PLAN, latest: null });
    expect(html).toContain('<p>Pre-alpha. Nothing has been released yet.</p>');
  });

  it('names the latest release once there is one', async () => {
    const { html } = await render(PAGE_TEXT, { releases: released(['2026-11-05', null, null]), latest: '0.1.0' });
    expect(html).toContain('<p>Pre-alpha. The latest release is 0.1.0, installed with uv from its tag on GitHub.</p>');
  });
});

describe('roadmap plugin: where it runs, and its refusals', () => {
  it('leaves every other page alone, markers included', async () => {
    const { html } = await render(PAGE_TEXT, { releases: PLAN, latest: null }, resolve('src/content/docs/blog/post.md'));
    expect(html).toContain('roadmap:planned');
    expect(html).toContain('Releases</h2>');
    expect(html).not.toContain('<ol');
  });

  it.each([
    ['the released marker is missing', `${STATUS}\n\n## Milestones\n\n${PLANNED}\n`, /status\.md has no roadmap:released marker/],
    ['the planned marker is missing', `${STATUS}\n\n## Releases\n\n${RELEASED}\n`, /status\.md has no roadmap:planned marker/],
    ['the status marker is missing', `## Releases\n\n${RELEASED}\n\n## Milestones\n\n${PLANNED}\n`, /status\.md has no roadmap:status marker/],
    ['a marker is repeated', `${PAGE_TEXT}\n${PLANNED}\n`, /status\.md has 2 roadmap:planned markers/],
    ['a marker is unknown', `${PAGE_TEXT}\n<!-- roadmap:dates -->\n`, /status\.md has an unknown marker roadmap:dates/],
    ['the old releases marker is used', `${PAGE_TEXT}\n<!-- roadmap:releases -->\n`,
      /unknown marker roadmap:releases: use roadmap:status, roadmap:released or roadmap:planned/],
    ['a list marker has no heading before it', `${STATUS}\n\n${RELEASED}\n\n## Milestones\n\n${PLANNED}\n`,
      /status\.md's roadmap:released marker has no heading before it/],
  ])('fails the page when %s, naming the page and the marker', async (_, markdown, message) => {
    await expect(render(markdown, { releases: PLAN, latest: null })).rejects.toThrow(message);
  });
});
