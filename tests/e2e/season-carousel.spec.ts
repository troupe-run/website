import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { freezeClock } from './clock';

const CAROUSEL = '#how-it-works [data-carousel]';
const current = (page: Page) => page.locator(`${CAROUSEL} .slide.is-current .eyebrow`);

// The carousel only runs while on screen, so every test scrolls it into view first and parks the mouse away from it.
async function open(page: Page) {
  await page.goto('/');
  await page.locator(CAROUSEL).scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
}

test('initially the Cast step is shown and the other three are hidden', async ({ page }) => {
  await open(page);
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(1);
  await expect(current(page)).toHaveText('Cast');
});

test('clicking the CUE tab shows Cue and makes the dial’s third dot the current one', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  await expect(current(page)).toHaveText('Cue');
  await expect(page.getByRole('tab', { name: 'Cue' })).toHaveAttribute('aria-selected', 'true');
  const dots = page.locator(`${CAROUSEL} .dot`);
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator(`${CAROUSEL} .dot[aria-current]`)).toHaveCount(1);
});

test('after 6.1s on screen the shown step advances from Cast to Perform', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(5000);
  await expect(current(page)).toHaveText('Cast');
  await page.clock.runFor(1100);
  await expect(current(page)).toHaveText('Perform');
});

test('the carousel has no previous, next, pause or play buttons', async ({ page }) => {
  await open(page);
  await expect(page.locator(`${CAROUSEL} button`).filter({ hasText: /pause|play|previous|next|‹|›/i })).toHaveCount(0);
  await expect(page.locator(`${CAROUSEL} [aria-label="Pause"], ${CAROUSEL} [aria-label="Play"], ${CAROUSEL} [aria-label="Next step"], ${CAROUSEL} [aria-label="Previous step"]`)).toHaveCount(0);
});

test('activating a tab shows that step and stops auto-advance: no change after 20s', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Perform' }).click();
  await page.mouse.move(0, 0);
  await page.locator('h1').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(current(page)).toHaveText('Perform');
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Perform');
});

test('clicking a loop-dial dot shows that step and stops auto-advance: no change after 20s', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.locator(`${CAROUSEL} .dot`).nth(3).click();
  await page.mouse.move(0, 0);
  await page.locator('h1').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(current(page)).toHaveText('Notes');
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Notes');
});

test('left alone, the steps wrap from Notes back to Cast', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6100 * 4);
  await expect(current(page)).toHaveText('Cast');
});

test('hovering the carousel stops the steps advancing', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.locator(`${CAROUSEL} .slides`).hover();
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('keyboard focus on a control stops the steps advancing', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cast' }).focus();
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('with prefers-reduced-motion the carousel does not advance in 20s', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('with prefers-reduced-motion the slide change has no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  expect(await page.locator(`${CAROUSEL} .slide.is-current`).evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('the live region is off while rotating and polite once the user has stopped it', async ({ page }) => {
  await open(page);
  const slides = page.locator(`${CAROUSEL} [data-slides]`);
  await expect(slides).toHaveAttribute('aria-live', 'off');
  await page.getByRole('tab', { name: 'Cue' }).click();
  await expect(slides).toHaveAttribute('aria-live', 'polite');
});

test('with JavaScript disabled all four steps are visible and the controls are hidden', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(4);
  await expect(page.locator(`${CAROUSEL} [data-controls]`)).toBeHidden();
  await ctx.close();
});

test('each slide’s scene places the troupe triangle at a different position: left, right, centre, top', async ({ page }) => {
  await page.goto('/');
  const positions = await page.locator(`${CAROUSEL} .scene`).evaluateAll((els) => els.map((e) => e.getAttribute('data-troupe-pos')));
  expect(positions).toEqual(['left', 'right', 'centre', 'top']);
  const troupe = await page.locator(`${CAROUSEL} .scene`).evaluateAll((els) => els.map((e) => e.querySelectorAll('.character--troupe').length));
  expect(troupe).toEqual([1, 1, 1, 1]);
});

test('the scenes are not part of the hero cast, so they never idle-bow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(`${CAROUSEL} [data-cast]`)).toHaveCount(0);
  await expect(page.locator(`${CAROUSEL} .scene`).first().locator('xpath=ancestor::*[@data-cast]')).toHaveCount(0);
});

test('the troupe triangle sits left in Cast, right in Perform, centre in Cue and at the top in Notes', async ({ page }) => {
  await open(page);
  const where: string[] = [];
  for (let i = 0; i < 4; i++) {
    await page.locator(`${CAROUSEL} [data-tab="${i}"]`).click();
    const r = await page.locator(`${CAROUSEL} [data-slide="${i}"] .scene`).evaluate((scene) => {
      const s = scene.getBoundingClientRect();
      const t = scene.querySelector('.character--troupe')!.getBoundingClientRect();
      return { x: (t.left + t.width / 2 - s.left) / s.width, y: (t.top - s.top) / s.height };
    });
    where.push(i === 0 ? (r.x < 0.35 ? 'left' : '?') : i === 1 ? (r.x > 0.65 ? 'right' : '?') : i === 2 ? (r.x > 0.35 && r.x < 0.8 ? 'centre' : '?') : (r.y < 0.15 ? 'top' : '?'));
  }
  expect(where).toEqual(['left', 'right', 'centre', 'top']);
});

test('ArrowRight on the tablist moves to the next tab, and Home, End and ArrowLeft jump or wrap as expected', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cast' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Perform' })).toBeFocused();
  await expect(current(page)).toHaveText('Perform');
  await page.keyboard.press('End');
  await expect(current(page)).toHaveText('Notes');
  await page.keyboard.press('Home');
  await expect(current(page)).toHaveText('Cast');
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveText('Notes');
});

test('only the selected tab is in the tab order (roving tabindex)', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  const idx = await page.locator(`${CAROUSEL} [role="tab"]`).evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
  expect(idx).toEqual([-1, -1, 0, -1]);
});

for (const width of [320, 390]) {
  test(`the carousel causes no page-level horizontal scroll at ${width}px, on any step`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page);
    for (let i = 0; i < 4; i++) {
      await page.locator(`${CAROUSEL} [data-tab="${i}"]`).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
}

// --- Motion (owner round 5): slide in parallel, a sliding tab indicator, no layout shift ---
const slideX = (page: Page, i: number) =>
  page.locator(`${CAROUSEL} [data-slide="${i}"]`).evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
const indicatorBox = (page: Page) => page.locator(`${CAROUSEL} [data-indicator]`).evaluate((e) => e.getBoundingClientRect().toJSON());
const tabBox = (page: Page, i: number) => page.locator(`${CAROUSEL} [data-tab="${i}"]`).evaluate((e) => e.getBoundingClientRect().toJSON());

test('mid-transition (+250ms) the outgoing card has moved left of its place and the incoming card is still right of it', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6000 + 250);
  expect(await slideX(page, 0)).toBeLessThan(0);
  expect(await slideX(page, 1)).toBeGreaterThan(0);
});

test('mid-transition both cards are on stage together, and after 500ms only the active card is visible', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6000 + 250);
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(2);
  await page.clock.runFor(400);
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(1);
  expect(await slideX(page, 1)).toBe(0);
});

test('a jump to an earlier tab reverses direction: the current card exits right and the target enters from the left', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  await page.clock.runFor(600);
  await page.getByRole('tab', { name: 'Perform' }).click();
  await page.clock.runFor(250);
  expect(await slideX(page, 2)).toBeGreaterThan(0);
  expect(await slideX(page, 1)).toBeLessThan(0);
});

test('a jump to a later tab slides left like auto-advance: the current card exits left and the target enters from the right', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  await page.clock.runFor(250);
  expect(await slideX(page, 0)).toBeLessThan(0);
  expect(await slideX(page, 2)).toBeGreaterThan(0);
});

test('wrapping from Notes to Cast continues in the same direction: Cast enters from the right', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6100 * 3 + 600);
  await expect(current(page)).toHaveText('Notes');
  await page.clock.runFor(5350); // Notes arrived at 18s; the wrap starts at 24s, so this is 250ms in
  expect(await slideX(page, 3)).toBeLessThan(0);
  expect(await slideX(page, 0)).toBeGreaterThan(0);
});

test('the stage keeps one height through a transition, so nothing below it shifts', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  const heights: number[] = [];
  const stage = page.locator(`${CAROUSEL} .slides`);
  const loop = page.locator('#how-it-works .loop');
  const tops: number[] = [];
  for (let i = 0; i < 6; i++) {
    heights.push((await stage.boundingBox())!.height);
    tops.push((await loop.boundingBox())!.y);
    await page.clock.runFor(1500);
  }
  expect(new Set(heights.map(Math.round)).size).toBe(1);
  expect(new Set(tops.map(Math.round)).size).toBe(1);
});

test('off-stage cards are inert and aria-hidden, so they cannot be focused or read', async ({ page }) => {
  await open(page);
  const state = await page.locator(`${CAROUSEL} .slide`).evaluateAll((els) => els.map((e) => [e.hasAttribute('inert'), e.getAttribute('aria-hidden')]));
  expect(state).toEqual([[false, 'false'], [true, 'true'], [true, 'true'], [true, 'true']]);
});

test('the tab indicator slides right from Cast to Perform and lands on the active tab (±2px)', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  const start = await indicatorBox(page);
  expect(Math.abs(start.left - (await tabBox(page, 0)).left)).toBeLessThanOrEqual(2);
  await page.clock.runFor(6000 + 250);
  const mid = await indicatorBox(page);
  expect(mid.left).toBeGreaterThan(start.left);
  await page.clock.runFor(400);
  const end = await indicatorBox(page);
  expect(end.left).toBeGreaterThan(mid.left);
  const perform = await tabBox(page, 1);
  expect(Math.abs(end.left - perform.left)).toBeLessThanOrEqual(2);
  expect(Math.abs(end.width - perform.width)).toBeLessThanOrEqual(2);
});

test('on the wrap the indicator runs off the right end of the strip while a second one enters from the left onto Cast', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6100 * 3 + 600);
  await expect(current(page)).toHaveText('Notes');
  const notes = await tabBox(page, 3);
  const cast = await tabBox(page, 0);
  await page.clock.runFor(5350); // 250ms into the wrap that starts at 24s
  const ghost = page.locator(`${CAROUSEL} [data-ghost]`);
  await expect(ghost).toBeVisible();
  expect((await indicatorBox(page)).left).toBeGreaterThan(notes.left);
  expect((await ghost.evaluate((e) => e.getBoundingClientRect().left))).toBeLessThan(cast.left);
  await page.clock.runFor(400);
  await expect(ghost).toBeHidden();
  expect(Math.abs((await indicatorBox(page)).left - cast.left)).toBeLessThanOrEqual(2);
});

test('with prefers-reduced-motion a tab click swaps the card at once, with no transform, and the indicator lands at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  expect(await slideX(page, 2)).toBe(0);
  expect(await slideX(page, 0)).toBe(0);
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(1);
  const box = await indicatorBox(page);
  expect(Math.abs(box.left - (await tabBox(page, 2)).left)).toBeLessThanOrEqual(2);
  expect(await page.locator(`${CAROUSEL} [data-tab="2"]`).evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
});

// --- Loop dial (owner round 6): one moving dot travelling the ring ---
// Angle of the moving dot in degrees clockwise from 12 o'clock, measured around the centre of the dial.
const dotAngle = (page: Page) => page.locator(`${CAROUSEL} .dial`).evaluate((dial) => {
  const d = dial.getBoundingClientRect();
  const m = dial.querySelector('[data-mover]')!.getBoundingClientRect();
  const dx = m.left + m.width / 2 - (d.left + d.width / 2);
  const dy = m.top + m.height / 2 - (d.top + d.height / 2);
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
});
const dotOffMark = (page: Page, i: number) => page.locator(`${CAROUSEL} .dial`).evaluate((dial, n) => {
  const mover = dial.querySelector('[data-mover]')!.getBoundingClientRect();
  const mark = dial.querySelectorAll('.dot')[n].getBoundingClientRect();
  return Math.hypot(mover.left + mover.width / 2 - (mark.left + mark.width / 2), mover.top + mover.height / 2 - (mark.top + mark.height / 2));
}, i);

test('the dial has one moving dot over four static marks, and the dot starts on the 12 o’clock mark', async ({ page }) => {
  await open(page);
  await expect(page.locator(`${CAROUSEL} [data-mover]`)).toHaveCount(1);
  await expect(page.locator(`${CAROUSEL} .dot`)).toHaveCount(4);
  expect(await dotOffMark(page, 0)).toBeLessThanOrEqual(1);
});

test('mid-transition from Cast to Perform the moving dot lies strictly between 0 and 90 degrees on the clockwise arc', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6000 + 250);
  const a = await dotAngle(page);
  expect(a).toBeGreaterThan(0);
  expect(a).toBeLessThan(90);
});

test('after the transition the moving dot sits on the target mark (±1px)', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6000 + 600);
  expect(await dotOffMark(page, 1)).toBeLessThanOrEqual(1);
});

test('on the Notes to Cast wrap the dot passes through the 9 to 12 arc (270 to 360 degrees), not back through 6 or 3', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.clock.runFor(6100 * 3 + 600);
  expect(await dotOffMark(page, 3)).toBeLessThanOrEqual(1);
  await page.clock.runFor(5350); // 250ms into the wrap that starts at 24s
  const a = await dotAngle(page);
  expect(a).toBeGreaterThan(270);
  expect(a).toBeLessThan(360);
  await page.clock.runFor(400);
  expect(await dotOffMark(page, 0)).toBeLessThanOrEqual(1);
});

test('a jump from Cue back to Perform moves the dot anticlockwise, strictly between 90 and 180 degrees', async ({ page }) => {
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  await page.clock.runFor(600);
  await page.getByRole('tab', { name: 'Perform' }).click();
  await page.clock.runFor(250);
  const a = await dotAngle(page);
  expect(a).toBeGreaterThan(90);
  expect(a).toBeLessThan(180);
});

test('with prefers-reduced-motion the dial dot lands on the target mark at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeClock(page);
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  expect(await dotOffMark(page, 2)).toBeLessThanOrEqual(1);
});

test('the caption glyph is the clockwise arrow ↻', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#how-it-works .loop')).toHaveText('↻ and again, every showing');
});
