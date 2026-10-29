import { test, expect } from './fixtures';
import { seriousViolations } from './axe';

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
  test("sits in the header, beside \"troupe docs\", and shows only the version being read until it's opened", async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    await expect(page.locator('header [data-version-menu]')).toHaveCount(1);
    await expect(page.locator('.sl-markdown-content [data-version-menu]')).toHaveCount(0);
    await expect(menu(page).locator('summary')).toHaveText('v0.1');
    await expect(menu(page).locator('summary')).toHaveAttribute('aria-label', 'Version: v0.1');
    await expect(menu(page).getByRole('link').first()).toBeHidden();
  });

  test('names the version being read, and lists next, the latest release and v0.1, newest first', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
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

  test('closes on Escape, returning focus to the picker, and on a click elsewhere', async ({ page }) => {
    await page.goto('/docs/v0.1/the-company/theatres/');
    const summary = menu(page).locator('summary');
    await summary.click();
    await expect(menu(page)).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(menu(page)).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await summary.click();
    await page.locator('h1').click();
    await expect(menu(page)).not.toHaveAttribute('open', '');
  });

  for (const width of [320, 1280]) {
    test(`at ${width}px, open, fits in the window and causes no page-level horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/docs/v0.1/the-company/theatres/');
      await menu(page).locator('summary').click();
      const box = (await menu(page).locator('ul').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
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

  test("/status/ shows the latest release's sidebar: no link under /docs/next/ or /docs/v0.1/ (troupe-run/website#28)", async ({ page }) => {
    await page.goto('/status/');
    const hrefs = await sidebarHrefs(page);
    expect(hrefs.filter((h) => !h.startsWith('/docs/'))).toEqual(['/status/', 'https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md']);
    expect(hrefs.filter((h) => h.startsWith('/docs/next/') || h.startsWith('/docs/v0.1/'))).toEqual([]);
    // v0.2 has one Stagecraft page; main adds "A new guide".
    await expect(stagecraft(page)).toHaveText(['Design a flow']);
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
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
}

// The roadmap on the fixture build: tests/fixtures/milestones.json against the fixture troupe's tags, troupe-v0.1.0
// (2026-01-01), troupe-v0.1.1 (2026-02-01) and troupe-v0.2.0 (2026-03-01) (spec: roadmap; quality-check).
test.describe('the roadmap on /status/', () => {
  // A section's entries: the first list after its heading (Milestones has an introduction before its own).
  const entries = (page: import('@playwright/test').Page, id: string) =>
    page.locator(`.sl-heading-wrapper:has(h2#${id}) ~ ol`).first().locator('> li');
  const versionsIn = (page: import('@playwright/test').Page, id: string) => entries(page, id).locator('> strong').allInnerTexts();

  test('lists 0.1.0 and 0.2.0 under Releases and the rest under Milestones, each in version order, with no entry for the 0.1.1 patch', async ({ page }) => {
    await page.goto('/status/');
    expect(await versionsIn(page, 'releases')).toEqual(['0.1.0', '0.2.0']);
    expect(await versionsIn(page, 'milestones')).toEqual(['0.3.0', '0.10.0', '1.0.0']);
  });

  test('dates 0.1.0 and 0.2.0 by their tags, as text and in a <time>, and nothing under Milestones', async ({ page }) => {
    await page.goto('/status/');
    const released = entries(page, 'releases');
    await expect(released.nth(0)).toHaveText('0.1.0 One: the first fixture release Released 2026-01-01');
    await expect(released.nth(0).locator('.roadmap-released time')).toHaveAttribute('datetime', '2026-01-01');
    await expect(released.nth(1).locator('.roadmap-released time')).toHaveAttribute('datetime', '2026-03-01');
    await expect(released.nth(1).locator('.roadmap-released')).toHaveText('Released 2026-03-01');
    await expect(page.locator('.roadmap-released')).toHaveCount(2);
    const planned = entries(page, 'milestones');
    await expect(planned.nth(0)).toHaveText('0.3.0 Three: planned, with no tag in the fixture troupe');
    await expect(planned.locator('.roadmap-released')).toHaveCount(0);
  });

  test('puts Releases before Milestones, in the page and in "On this page"', async ({ page }) => {
    await page.goto('/status/');
    const headings = await page.locator('.sl-markdown-content h2').allInnerTexts();
    expect(headings).toEqual(['Status', 'Releases', 'Milestones']);
    const toc = (await page.locator('starlight-toc a').allInnerTexts()).filter((t) => headings.includes(t));
    expect(toc).toEqual(headings);
  });

  test('names 0.2.0 as the latest release in the status', async ({ page }) => {
    await page.goto('/status/');
    await expect(page.locator('.sl-heading-wrapper:has(h2#status) + p')).toHaveText('Pre-alpha. The latest release is 0.2.0, installed with uv from its tag on GitHub.');
  });
});

// /protocol/ on the fixture build: protocol-v0.1.0, protocol-v0.2.0 and protocol-v1.0.0, and main after them, from
// tests/fixtures/troupe-docs/ (spec: protocol-schemas; quality-check; design D9). pinned.schema.json names its ref in
// its description; config/actor.schema.json exists only on main.
test.describe('the protocol copies', () => {
  const BASE = 'https://troupe.run/protocol/';
  const pinned = async (request: import('@playwright/test').APIRequestContext, prefix: string) => {
    const response = await request.get(`/protocol/${prefix}pinned.schema.json`);
    expect(response.status(), prefix).toBe(200);
    return response.json();
  };
  const copies: [string, string][] = [
    ['', 'protocol-v1.0.0'], ['1/', 'protocol-v1.0.0'], ['0/', 'protocol-v0.2.0'], ['next/', 'main'],
    ['1.0.0/', 'protocol-v1.0.0'], ['0.2.0/', 'protocol-v0.2.0'], ['0.1.0/', 'protocol-v0.1.0'],
  ];
  for (const [prefix, ref] of copies) {
    test(`/protocol/${prefix} serves ${ref}, with its own ids and its absolute reference moved with them`, async ({ request }) => {
      const schema = await pinned(request, prefix);
      expect(schema.description).toBe(`The fixture troupe at ${ref}: an absolute reference to another of its schemas.`);
      expect(schema.$id).toBe(`${BASE}${prefix}pinned.schema.json`);
      expect(schema.properties.hash.$ref).toBe(`${BASE}${prefix}lineage.schema.json#/$defs/hash`);
    });
  }

  test("main's change after the last tag is only in next/", async ({ request }) => {
    expect((await request.get('/protocol/next/config/actor.schema.json')).status()).toBe(200);
    for (const prefix of ['', '1/', '0/', '1.0.0/']) {
      expect((await request.get(`/protocol/${prefix}config/actor.schema.json`)).status(), prefix).toBe(404);
    }
  });

  test('/protocol/ lists the releases newest first, naming the latest', async ({ page }) => {
    await page.goto('/protocol/');
    await expect(page.locator('.protocol-releases li')).toHaveText([
      '1.0.0 (latest), at /protocol/1.0.0/', '0.2.0, at /protocol/0.2.0/', '0.1.0, at /protocol/0.1.0/',
    ]);
    await expect(page.getByText('No protocol release yet.')).toHaveCount(0);
  });
});

