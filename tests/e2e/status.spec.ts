import { test, expect } from './fixtures';

// The pages the website keeps, outside /docs (spec: versioned-docs; design D10). Status and roadmap keeps the docs
// sidebar, so a reader who follows it from the docs keeps the navigation (troupe-run/website#28).
test('/status/ shows Status and roadmap with "troupe docs" in the header, the docs sidebar and no version menu', async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Status and roadmap');
  await expect(page.locator('.site-header .section')).toHaveText('docs');
  await expect(page.locator('html')).toHaveAttribute('data-has-sidebar', '');
  await expect(page.locator('[data-version-menu]')).toHaveCount(0);
  await expect(page).toHaveTitle('Status and roadmap | troupe docs');
});

test("/status/'s sidebar shows the docs' six section labels in order", async ({ page }) => {
  await page.goto('/status/');
  const labels = await page.locator('.sidebar-content .top-level > li > details > summary .large').allInnerTexts();
  expect(labels).toEqual(['Programme', 'Opening night', 'The company', 'Stagecraft', 'Prompt book', 'Backstage']);
});

test("/status/'s sidebar marks Status and roadmap as the current page, and nothing else", async ({ page }) => {
  await page.goto('/status/');
  const current = page.locator('.sidebar-content [aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('Status and roadmap');
  await expect(current).toHaveAttribute('href', '/status/');
});

test("every docs link in /status/'s sidebar is in the version at /docs/, none under /docs/next/", async ({ page }) => {
  await page.goto('/status/');
  const hrefs = await page.locator('.sidebar-content a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  const docs = hrefs.filter((h) => h.startsWith('/docs/'));
  expect(docs.length).toBeGreaterThan(0);
  expect(docs.filter((h) => h.startsWith('/docs/next/'))).toEqual([]);
});

test('/status/ has no "Previous" or "Next" link', async ({ page }) => {
  await page.goto('/status/');
  await expect(page.locator('a[rel="prev"], a[rel="next"]')).toHaveCount(0);
});

test("at 320px, /status/'s Menu button opens the docs sidebar, with Status and roadmap in it", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/status/');
  const link = page.locator('.sidebar-content a[href="/status/"]');
  await expect(link).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(link).toBeVisible();
});

test("/status/'s \"Improve this page\" opens its source in troupe-run/website", async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('link', { name: 'Improve this page' }))
    .toHaveAttribute('href', 'https://github.com/troupe-run/website/edit/main/src/content/docs/status.md');
});

test('the old Status and roadmap URL, which troupe links, redirects to /status/, with the docs sidebar', async ({ page }) => {
  await page.goto('/docs/programme/status-and-roadmap/');
  await expect(page).toHaveURL(/\/status\/$/);
  await expect(page.locator('html')).toHaveAttribute('data-has-sidebar', '');
});

test("the old Contributing URL redirects to the org's contributing guide", async ({ page }) => {
  // The redirect page itself, not GitHub: e2e tests never reach external hosts.
  await page.route('https://github.com/**', (r) => r.fulfill({ status: 200, body: 'github' }));
  await page.goto('/docs/backstage/contributing/');
  await expect(page).toHaveURL('https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md');
});
