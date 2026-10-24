import { test, expect } from './fixtures';
import { freezeClock } from './clock';

test('with the clock frozen, the page’s performance.now() and Date.now() read the same after 1s of real time', async ({ page }) => {
  await freezeClock(page);
  await page.goto('/');
  const before = await page.evaluate(() => [performance.now(), Date.now()]);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => [performance.now(), Date.now()])).toEqual(before);
});
