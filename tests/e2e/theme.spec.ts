import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);
const PAGES = [
  ['landing page', '/'],
  ['docs page', '/docs/programme/what-is-troupe/'],
] as const;

for (const [name, path] of PAGES) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`the ${name} follows an emulated ${scheme} system scheme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      expect(await theme(page)).toBe(scheme);
    });
  }

  test(`a stale stored starlight-theme of dark is ignored: the ${name} still renders light under a light system scheme`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('starlight-theme', 'dark'));
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(path);
    expect(await theme(page)).toBe('light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(26, 24, 48)');
  });

  test(`the ${name} has no theme picker`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.locator('starlight-theme-select, [data-theme-toggle]')).toHaveCount(0);
  });

  test(`switching the emulated scheme at runtime updates data-theme on the ${name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(path);
    expect(await theme(page)).toBe('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => theme(page)).toBe('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => theme(page)).toBe('light');
  });
}

test('landing page raises no errors when localStorage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(errors).toEqual([]);
  expect(await theme(page)).toBe('dark');
});

test('body background uses --bg in each theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 248, 238)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(26, 24, 48)');
});
