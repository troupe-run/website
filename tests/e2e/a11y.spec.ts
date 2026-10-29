import { test, expect } from './fixtures';
import { ACCEPTED, reportedTargets, seriousViolations } from './axe';

const PAGES = [
  ['landing page', '/'],
  ['written docs page', '/docs/programme/what-is-troupe/'],
  ['licensing (tables)', '/docs/backstage/licensing/'],
  ['glossary (a wide table)', '/docs/prompt-book/glossary/'],
  ['CLI reference (code and generated tables)', '/docs/prompt-book/cli/'],
  ['status and roadmap', '/status/'],
  ['protocol schemas (a wide table)', '/protocol/'],
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
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
}

// The search button's accepted finding (axe.ts) holds only while the visible text beyond its name is a shortcut hint
// that it also exposes as aria-keyshortcuts (spec: accessibility; axe-core-4-14 design D4). Whether that serves
// speech-input users is Starlight's judgement, which the owner accepted (#67); no test here can check it.
test('the search button\'s visible text, without its Ctrl K or ⌘ K hint, is its accessible name "Search", and the hint is exposed as aria-keyshortcuts', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  const button = page.locator('button[data-open-modal]');
  await expect(button).toHaveAccessibleName('Search');
  const seen = await button.evaluate((b: HTMLElement) => {
    const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
    const hint = b.querySelector<HTMLElement>(':scope > kbd');
    return {
      label: squash(hint ? b.innerText.replace(hint.innerText, ' ') : b.innerText),
      hint: hint && squash([...hint.querySelectorAll<HTMLElement>('kbd')].map((k) => k.innerText).join(' ')),
      keys: b.getAttribute('aria-keyshortcuts') ?? '(none)',
    };
  });
  expect(seen.label, 'the visible text without the hint, against the accessible name').toBe('Search');
  expect(['Ctrl K', '⌘ K'], `the hint reads ${JSON.stringify(seen.hint)}, not a shortcut alone`).toContain(seen.hint);
  expect(seen.keys, 'aria-keyshortcuts: without it the hint is conveyed only visually').toMatch(/^(Control|Meta)\+K$/);
});

// An accepted finding that axe no longer reports can go (design D5). Light only: the rule doesn't depend on colour.
for (const accepted of ACCEPTED) {
  test(`axe still reports ${accepted.rule} on ${accepted.target} at ${accepted.page}, so its accepted finding is still needed`, async ({ page }) => {
    await page.goto(accepted.page);
    expect(
      await reportedTargets(page, accepted.rule),
      `axe no longer reports ${accepted.rule} on ${accepted.target}: its entry in ACCEPTED (tests/e2e/axe.ts) can be removed`,
    ).toContain(accepted.target);
  });
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
