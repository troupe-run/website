import { test, expect } from './fixtures';

// The pages the website keeps, outside /docs (spec: versioned-docs; design D10).
test('/status/ shows Status and roadmap with the site header, no sidebar and no version menu', async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Status and roadmap');
  await expect(page.locator('.site-header .section')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-has-sidebar', /.*/);
  await expect(page.locator('[data-version-menu]')).toHaveCount(0);
  await expect(page).toHaveTitle('Status and roadmap | troupe');
});

test("/status/'s \"Improve this page\" opens its source in troupe-run/website", async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('link', { name: 'Improve this page' }))
    .toHaveAttribute('href', 'https://github.com/troupe-run/website/edit/main/src/content/docs/status.md');
});

test('the old Status and roadmap URL, which troupe links, redirects to /status/', async ({ page }) => {
  await page.goto('/docs/programme/status-and-roadmap/');
  await expect(page).toHaveURL(/\/status\/$/);
});

test("the old Contributing URL redirects to the org's contributing guide", async ({ page }) => {
  // The redirect page itself, not GitHub: e2e tests never reach external hosts.
  await page.route('https://github.com/**', (r) => r.fulfill({ status: 200, body: 'github' }));
  await page.goto('/docs/backstage/contributing/');
  await expect(page).toHaveURL('https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md');
});
