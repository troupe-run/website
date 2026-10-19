import { test, expect } from './fixtures';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The real build: /docs from troupe-run/troupe, as `npm run docs:sync` fetched it (spec: versioned-docs). The
// versions themselves (next, archived, the menu's other entries) are tested on the fixture build, in versions.spec.ts.
interface Page { path: string; title: string }
const manifest: { versions: { role: string; base: string; dir: string; ref: string; pages: Page[] }[] } =
  JSON.parse(readFileSync('src/generated/troupe-docs.json', 'utf8'));
const current = manifest.versions.find((v) => v.role === 'current')!;
const url = (p: Page) => `${current.base}${p.path.replace(/\.md$/, '')}/`;
const front = (p: Page) =>
  parse(/^---\n([\s\S]*?)\n---\n/.exec(readFileSync(`src/content/docs/docs/${current.dir ? `${current.dir}/` : ''}${p.path}`, 'utf8'))![1]);
const EDIT = 'https://github.com/troupe-run/troupe/edit/main/docs/';

test("the current version has troupe's pages, and none of the website's old ones", () => {
  expect(current.pages.length).toBeGreaterThan(20);
  const paths = current.pages.map((p) => p.path);
  expect(paths).not.toContain('programme/status-and-roadmap.md');
  expect(paths).not.toContain('backstage/contributing.md');
});

for (const p of current.pages) {
  test(`${url(p)} is built, is in the sidebar, and its "Improve this page" opens docs/${p.path} on troupe's main`, async ({ page }) => {
    await page.goto(url(p));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.title);
    const sidebar = await page.locator('.sidebar-content a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(sidebar).toContain(url(p));
    await expect(page.getByRole('link', { name: 'Improve this page' })).toHaveAttribute('href', EDIT + p.path);
  });
}

test('sidebar shows the six section labels in order', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  const labels = await page.locator('.sidebar-content .top-level > li > details > summary .large').allInnerTexts();
  expect(labels).toEqual(['Programme', 'Opening night', 'The company', 'Stagecraft', 'Prompt book', 'Backstage']);
});

test('the sidebar ends Programme with Status and roadmap, and Backstage with the org\'s contributing guide', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  const sections = page.locator('.sidebar-content .top-level > li');
  await expect(sections.first().locator('a').last()).toHaveAttribute('href', '/status/');
  await expect(sections.last().locator('a').last()).toHaveAttribute('href', 'https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md');
});

test('sidebar section labels use the display face in --tomato-text (light)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/programme/what-is-troupe/');
  const label = page.locator('.sidebar-content .top-level > li > details > summary .large').first();
  expect(await label.evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Bricolage Grotesque');
  expect(await label.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(206, 61, 33)');
});

test('a page with prerelease: true shows the pre-alpha note and no Planned note', async ({ page }) => {
  const p = current.pages.find((x) => front(x).status === 'written' && front(x).prerelease === true)!;
  await page.goto(url(p));
  await expect(page.locator('aside[data-doc-note="prerelease"]')).toContainText('Pre-alpha: this page describes intended behaviour.');
  await expect(page.locator('aside[data-doc-note="planned"]')).toHaveCount(0);
});

test('a page with prerelease: false shows no status note', async ({ page }) => {
  const p = current.pages.find((x) => front(x).status === 'written' && front(x).prerelease === false)!;
  await page.goto(url(p));
  await expect(page.locator('aside[data-doc-note]')).toHaveCount(0);
});

test("a page shows \"Last updated\" with the date of troupe's last commit to it", async ({ page }) => {
  const p = current.pages.find((x) => front(x).lastUpdated)!;
  await page.goto(url(p));
  const date = new Date(front(p).lastUpdated);
  await expect(page.locator('time')).toHaveAttribute('datetime', date.toISOString());
});

test("every link from one docs page to another's heading lands on that heading", () => {
  const broken: string[] = [];
  let checked = 0;
  for (const p of current.pages) {
    const html = readFileSync(`dist${url(p)}index.html`, 'utf8');
    const content = /<div class="sl-markdown-content">([\s\S]*?)<\/main>/.exec(html)?.[1] ?? '';
    for (const [, target, anchor] of content.matchAll(/href="(\/docs\/[^"#]+)#([^"]+)"/g)) {
      checked++;
      const file = `dist${target}index.html`;
      if (!existsSync(file) || !readFileSync(file, 'utf8').includes(`id="${anchor}"`)) broken.push(`${url(p)} → ${target}#${anchor}`);
    }
  }
  expect(checked, 'no anchor links found: the content selector is out of date').toBeGreaterThan(0);
  expect(broken).toEqual([]);
});

test('/docs/ redirects to the first page', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page).toHaveURL(/\/docs\/programme\/what-is-troupe\/$/);
});

test('an unknown URL shows the 404 page with a link home', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
  await expect(page.locator('aside[data-doc-note]')).toHaveCount(0);
});

test('glossary at 320px has no page-level horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/docs/prompt-book/glossary/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
