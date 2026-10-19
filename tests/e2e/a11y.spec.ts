import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['landing page', '/'],
  ['written docs page', '/docs/programme/what-is-troupe/'],
  ['licensing (tables)', '/docs/backstage/licensing/'],
  ['glossary (a wide table)', '/docs/prompt-book/glossary/'],
  ['CLI reference (code and generated tables)', '/docs/prompt-book/cli/'],
  ['status and roadmap', '/status/'],
  ['blog index', '/blog/'],
  ['blog post', '/blog/2026-10-10-methodology-bake-off/'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path] of PAGES) {
    test(`axe reports no serious or critical violations (WCAG 2.2 AA rule tags) on the ${name} (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // Expressive Code makes a code block that scrolls sideways focusable from a script, about 250ms after load. Wait
      // for it, so axe sees the page a reader gets; if the script never runs, this times out and the test fails.
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.expressive-code pre')].every((p) => p.scrollWidth <= p.clientWidth || p.hasAttribute('tabindex')));
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('every interactive element on the landing page is reachable by Tab', async ({ page }) => {
  await page.goto('/');
  // Mark each visible, non-tabindex=-1 interactive element with a stable identity.
  const expected = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>('a[href], select, button:not([disabled])')].filter(
      (el) => el.getAttribute('tabindex') !== '-1' && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
    );
    els.forEach((el, i) => el.setAttribute('data-tab-id', String(i)));
    return els.map((el, i) => `${i}|${el.tagName}|${el.getAttribute('href') ?? ''}|${el.textContent?.trim().slice(0, 30)}`);
  });
  expect(expected.length).toBeGreaterThan(0);
  const focused = new Set<number>();
  for (let i = 0; i < expected.length + 5; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-tab-id') ?? null);
    if (id !== null) focused.add(Number(id));
  }
  const missed = expected.filter((_, i) => !focused.has(i));
  expect(missed).toEqual([]);
});
