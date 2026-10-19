import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// The versions, on the fixture build: troupe-v0.1.0, troupe-v0.1.1, troupe-v0.2.0 and main, from
// tests/fixtures/troupe-docs/ (spec: versioned-docs; quality-check; design D9). Each fixture page says which ref it's
// at ("Theatres, at troupe-v0.1.1."), so a test can tell which version a URL served.
const EDIT = 'https://github.com/troupe-run/troupe/edit/main/docs/';
const menu = (page: import('@playwright/test').Page) => page.locator('[data-version-menu]');
const sidebarHrefs = (page: import('@playwright/test').Page) =>
  page.locator('.sidebar-content .top-level a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));

test.describe('which troupe each URL serves', () => {
  for (const [url, text] of [
    ['/docs/the-company/theatres/', 'Theatres, at troupe-v0.2.0.'],
    ['/docs/v0.1/the-company/theatres/', 'Theatres, at troupe-v0.1.1.'],
    ['/docs/next/the-company/theatres/', 'Theatres, at main.'],
  ]) {
    test(`${url} serves "${text}"`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('.sl-markdown-content')).toContainText(text);
    });
  }

  test('no version is published from an older patch of a minor, or from the latest minor under /docs/vX.Y/', async ({ page }) => {
    expect((await page.goto('/docs/v0.2/the-company/theatres/'))?.status()).toBe(404);
    expect((await page.goto('/docs/v0.1.0/the-company/theatres/'))?.status()).toBe(404);
  });

  for (const [root, first] of [
    ['/docs/', '/docs/programme/what-is-troupe/'],
    ['/docs/next/', '/docs/next/programme/what-is-troupe/'],
    ['/docs/v0.1/', '/docs/v0.1/programme/what-is-troupe/'],
  ]) {
    test(`${root} redirects to its first page, ${first}`, async ({ page }) => {
      await page.goto(root);
      await expect(page).toHaveURL(new RegExp(`${first.replace(/[./]/g, '\\$&')}$`));
    });
  }
});

test.describe('the version menu', () => {
  test('names the version being read, and lists next, the latest release and v0.1, newest first', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await expect(menu(page).locator('summary')).toHaveText('Version: v0.1');
    await menu(page).locator('summary').click();
    await expect(menu(page).getByRole('link')).toHaveText(['next (unreleased)', 'v0.2 (latest)', 'v0.1']);
    await expect(menu(page).getByRole('link', { name: 'v0.1' })).toHaveAttribute('aria-current', 'page');
  });

  test('takes the reader to the same page in a version that has it', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await menu(page).locator('summary').click();
    await menu(page).getByRole('link', { name: 'v0.2 (latest)' }).click();
    await expect(page).toHaveURL(/\/docs\/the-company\/theatres\/$/);
  });

  test("takes the reader to a version's first page when it lacks the page", async ({ page }) => {
    await page.goto('/docs/next/stagecraft/new-guide/');
    await menu(page).locator('summary').click();
    await menu(page).getByRole('link', { name: 'v0.1' }).click();
    await expect(page).toHaveURL(/\/docs\/v0\.1\/programme\/what-is-troupe\/$/);
  });

  test('opens and follows an entry from the keyboard alone', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await menu(page).locator('summary').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(menu(page).getByRole('link', { name: 'next (unreleased)' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/docs\/next\/the-company\/theatres\/$/);
  });

  test('at 320px, open, causes no page-level horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/docs/v0.1/the-company/theatres/');
    await menu(page).locator('summary').click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('banners', () => {
  test('an archived page says which version it is and that v0.2 is the latest, linking the same page there', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    const banner = page.locator('aside[data-doc-note="archived"]');
    await expect(banner).toContainText("You're reading the docs for v0.1. The latest release is v0.2.");
    await expect(banner.getByRole('link', { name: 'Read this page in v0.2' })).toHaveAttribute('href', '/docs/the-company/theatres/');
  });

  test("an archived page the latest release lacks links the latest release's first page", async ({ page }) => {
    await page.goto('/docs/v0.1/stagecraft/old-guide/');
    await expect(page.locator('aside[data-doc-note="archived"]').getByRole('link', { name: 'Go to the v0.2 docs' }))
      .toHaveAttribute('href', '/docs/programme/what-is-troupe/');
  });

  test('a next page says it is unreleased, ahead of v0.2, linking the same page in v0.2', async ({ page }) => {
    await page.goto('/docs/next/the-company/theatres/');
    const banner = page.locator('aside[data-doc-note="next"]');
    await expect(banner).toContainText("Unreleased: these docs describe troupe's main, ahead of v0.2.");
    await expect(banner.getByRole('link', { name: 'Read this page in v0.2' })).toHaveAttribute('href', '/docs/the-company/theatres/');
  });

  test('a page of the latest release has no version banner', async ({ page }) => {
    await page.goto('/docs/the-company/theatres/');
    await expect(page.locator('aside[data-doc-note="archived"], aside[data-doc-note="next"]')).toHaveCount(0);
  });
});

test.describe("each version's sidebar", () => {
  test("lists v0.1's own pages, every link inside /docs/v0.1/ but the website's two", async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    const hrefs = await sidebarHrefs(page);
    expect(hrefs.filter((h) => !h.startsWith('/docs/v0.1/'))).toEqual(['/status/', 'https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md']);
    expect(hrefs).toContain('/docs/v0.1/stagecraft/old-guide/');
    expect(hrefs).not.toContain('/docs/v0.1/stagecraft/design-a-flow/');
  });

  const stagecraft = (page: import('@playwright/test').Page) =>
    page.locator('.sidebar-content .top-level > li').filter({ hasText: 'Stagecraft' }).locator('a');

  test("lists a page the sidebar order doesn't name after the ones it names", async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await expect(stagecraft(page)).toHaveText(['Build a flow', 'Old guide']);
  });

  test("lists pages the sidebar order doesn't name by title, and still lists them all", async ({ page }) => {
    // Neither is named: design-a-flow is build-a-flow renamed, and new-guide is new on main.
    await page.goto('/docs/next/the-company/theatres/');
    await expect(stagecraft(page)).toHaveText(['A new guide', 'Design a flow']);
  });

  test('"Next" stays in the version', async ({ page }) => {
    await page.goto('/docs/v0.1/programme/what-is-troupe/');
    await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', /^\/docs\/v0\.1\//);
  });

  test("a page's links lead to pages in its own version", async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/flows/');
    await expect(page.locator('.sl-markdown-content').getByRole('link', { name: 'Build a flow' })).toHaveAttribute('href', '/docs/v0.1/stagecraft/build-a-flow/');
  });
});

test.describe('edit links and sources', () => {
  for (const url of ['/docs/the-company/theatres/', '/docs/next/the-company/theatres/']) {
    test(`${url} links "Improve this page" to the page on troupe's main, and has no "View source"`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('link', { name: 'Improve this page' })).toHaveAttribute('href', `${EDIT}the-company/theatres.md`);
      await expect(page.getByRole('link', { name: 'View source' })).toHaveCount(0);
    });
  }

  test('an archived page has no "Improve this page", and links "View source" to the page at its tag', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await expect(page.getByRole('link', { name: 'Improve this page' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'View source' }))
      .toHaveAttribute('href', 'https://github.com/troupe-run/troupe/blob/troupe-v0.1.1/docs/the-company/theatres.md');
  });

  test('a planned page in next shows its note with a "Help write this page" link to troupe', async ({ page }) => {
    await page.goto('/docs/next/the-company/roles-and-actors/');
    const note = page.locator('aside[data-doc-note="planned"]');
    await expect(note).toContainText('Planned: not written yet.');
    await expect(note.getByRole('link', { name: 'Help write this page' })).toHaveAttribute('href', `${EDIT}the-company/roles-and-actors.md`);
  });

  test("\"Last updated\" is the date of troupe's last commit to the page at the version's ref", async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await expect(page.locator('time')).toHaveAttribute('datetime', '2026-02-01T00:00:00.000Z');
  });
});

test.describe('search', () => {
  test('indexes the latest release only, never next or an archived version', async ({ page }) => {
    for (const [url, indexed] of [
      ['/docs/the-company/theatres/', 1], ['/docs/next/the-company/theatres/', 0], ['/docs/v0.1/the-company/theatres/', 0],
    ] as const) {
      await page.goto(url);
      await expect(page.locator('[data-pagefind-body]'), url).toHaveCount(indexed);
    }
  });

  test('a search for a page finds it in the latest release only', async ({ page }) => {
    // The index the search box reads, through Pagefind's own API, so the test doesn't depend on the widget's markup.
    await page.goto('/docs/the-company/theatres/');
    const urls = await page.evaluate(async () => {
      const index = '/pagefind/pagefind.js'; // the built site's, loaded in the browser, so TypeScript can't resolve it
      const pagefind = await import(/* @vite-ignore */ index);
      const { results } = await pagefind.search('Theatres');
      return Promise.all(results.map(async (r: { data: () => Promise<{ url: string }> }) => (await r.data()).url));
    });
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((u: string) => u.includes('/the-company/theatres/'))).toEqual(['/docs/the-company/theatres/']);
    expect(urls.filter((u: string) => u.startsWith('/docs/next/') || u.startsWith('/docs/v0.1/'))).toEqual([]);
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const [name, url] of [['an archived page', '/docs/v0.1/the-company/theatres/'], ['a next page', '/docs/next/the-company/roles-and-actors/']]) {
    test(`axe reports no serious or critical violations on ${name}, with the version menu open (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(url);
      await menu(page).locator('summary').click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}
