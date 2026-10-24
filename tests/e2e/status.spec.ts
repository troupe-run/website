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

// The roadmap, from troupe-run/infrastructure's live milestones and troupe's live tags (spec: roadmap). Both change, so
// these check shape only; tests/e2e/versions.spec.ts checks fixed releases on the fixture build.
type Page = import('@playwright/test').Page;
// A section's list is the first list after its heading (Milestones has an introduction before its own).
const list = (page: Page, id: string) => page.locator(`.sl-heading-wrapper:has(h2#${id}) ~ ol`).first();
const entries = (page: Page, id: string) => list(page, id).locator('> li');
const versionsIn = (page: Page, id: string) => entries(page, id).locator('> strong').allInnerTexts();
const byVersion = (a: string, b: string) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

test('/status/ lists the milestones not yet out under Milestones, each starting with its version in bold, in version order', async ({ page }) => {
  await page.goto('/status/');
  await expect(page.locator('.sl-markdown-content ol')).not.toHaveCount(0);
  const versions = await versionsIn(page, 'milestones');
  expect(versions.length).toBeGreaterThan(1);
  for (const v of versions) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  expect(versions).toEqual([...versions].sort(byVersion));
  await expect(page.locator('.sl-markdown-content')).not.toContainText('roadmap:');
});

test('/status/ has a Releases section exactly when the status names a latest release, each entry dated and in version order', async ({ page }) => {
  await page.goto('/status/');
  const status = await page.locator('.sl-heading-wrapper:has(h2#status) + p').innerText();
  const latest = /The latest release is (\d+\.\d+\.\d+)/.exec(status)?.[1];
  await expect(page.locator('h2#releases')).toHaveCount(latest ? 1 : 0);
  const versions = await versionsIn(page, 'releases');
  expect(versions).toEqual([...versions].sort(byVersion));
  for (const text of await entries(page, 'releases').allInnerTexts()) expect(text).toMatch(/Released \d{4}-\d{2}-\d{2}$/);
});

test('/status/ lists no version under both Releases and Milestones', async ({ page }) => {
  await page.goto('/status/');
  const planned = new Set(await versionsIn(page, 'milestones'));
  expect((await versionsIn(page, 'releases')).filter((v) => planned.has(v))).toEqual([]);
});

test('/status/ has no count, percentage, progress mark or date beside a milestone under Milestones', async ({ page }) => {
  await page.goto('/status/');
  const planned = await entries(page, 'milestones').allInnerTexts();
  expect(planned.length).toBeGreaterThan(0);
  await expect(list(page, 'milestones').locator('.roadmap-released')).toHaveCount(0);
  for (const text of planned) {
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}|%|\b\d+\s*(?:of|\/)\s*\d+\b|in progress|working on|current/i);
  }
});

test("/status/ links to troupe's milestones and the roadmap board", async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('link', { name: 'troupe’s milestones' })).toHaveAttribute('href', 'https://github.com/troupe-run/troupe/milestones');
  await expect(page.getByRole('link', { name: 'roadmap board' })).toHaveAttribute('href', 'https://github.com/orgs/troupe-run/projects/1');
});

test('/status/ lists Status, Milestones and How to read it in "On this page", in that order', async ({ page }) => {
  await page.goto('/status/');
  const toc = (await page.locator('starlight-toc a').allInnerTexts()).filter((t) => ['Status', 'Milestones', 'How to read it'].includes(t));
  expect(toc).toEqual(['Status', 'Milestones', 'How to read it']);
});
