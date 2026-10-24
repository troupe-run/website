import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { freezeClock } from './clock';

const bowing = (page: Page) => page.locator('[data-cast] .character.is-bowing');

test('after 5s with no hover, exactly one character is bowing', async ({ page }) => {
  await freezeClock(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'running');
  await page.clock.runFor(5100);
  await expect(bowing(page)).toHaveCount(1);
});

test('with reduced motion, idle bowing is off and nothing bows after 6s', async ({ page }) => {
  await freezeClock(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'off');
  await page.clock.runFor(6000);
  await expect(bowing(page)).toHaveCount(0);
});

test('with the hero scrolled out of view, no bow fires', async ({ page }) => {
  await freezeClock(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('footer.site-footer').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'paused');
  await page.clock.runFor(6000);
  await expect(bowing(page)).toHaveCount(0);
});

test('idle bowing reaches state "done" within 40s', async ({ page }) => {
  await freezeClock(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.clock.runFor(40_000);
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'done');
});

test('hovering a character at 4s delays the first idle bow until after 9s', async ({ page }) => {
  await freezeClock(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'running');
  await page.clock.runFor(4000);
  await page.locator('[data-cast] .character').nth(2).hover();
  await page.mouse.move(0, 0);
  // t=5100: an unreset timer would have bowed at 5000 and still be bowing (bows last 700ms)
  await page.clock.runFor(1100);
  // a one-shot count, not expect().toHaveCount(): that retries in real time and the bow class would expire meanwhile
  expect(await bowing(page).count()).toBe(0);
  // t=9100: the reset timer fires at 9000
  await page.clock.runFor(4000);
  await expect(bowing(page)).toHaveCount(1);
});
