import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 4, colorScheme: 'light' });

// Reads real pixels from a 4x screenshot of a "Watch on GitHub" button: the space above and below the capital W of
// "Watch", and above and below all the ink (the star, the ascenders and the baseline together).
async function measure(page: Page, selector: string) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const button = page.locator(selector);
  await button.scrollIntoViewIfNeeded();
  const png = (await button.screenshot()).toString('base64');
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bmp.width, bmp.height);
    const px = (x: number, y: number) => [
      data[(y * width + x) * 4],
      data[(y * width + x) * 4 + 1],
      data[(y * width + x) * 4 + 2],
    ];
    const bg = px(60, Math.floor(height / 2));
    const differs = (x: number, y: number, by: number) => px(x, y).reduce((a, v, i) => a + Math.abs(v - bg[i]), 0) > by;
    // The face ends where the darker 3px shadow strip starts (a screenshot can include a pixel or two of it).
    let face = height - 1;
    for (let y = Math.floor(height / 2); y < height; y++)
      if (differs(60, y, 10)) {
        face = y - 1;
        break;
      }
    const columnHasInk = (x: number) => {
      for (let y = 8; y < face - 4; y++) if (differs(x, y, 200)) return true;
      return false;
    };
    // Columns holding ink, grouped into runs: the first run is the star, the second is "Watch".
    const runs: [number, number][] = [];
    for (let x = 60; x < width - 60; x++) {
      if (!columnHasInk(x)) continue;
      const last = runs[runs.length - 1];
      if (last && x - last[1] <= 12) last[1] = x;
      else runs.push([x, x]);
    }
    const span = (x0: number, x1: number) => {
      let top = -1;
      let bottom = -1;
      for (let y = 8; y < face - 4; y++) {
        let any = false;
        for (let x = x0; x <= x1; x++)
          if (differs(x, y, 200)) {
            any = true;
            break;
          }
        if (any) {
          if (top < 0) top = y;
          bottom = y;
        }
      }
      return { above: top / 4, below: (face - bottom) / 4 };
    };
    return { cap: span(runs[1][0], runs[1][0] + 36) /* the W only: a true capital */, ink: span(60, width - 60) };
  }, png);
}

for (const [name, selector] of [
  ['hero', '#top .btn.primary'],
  ['closing', '#follow .btn'],
] as const) {
  test(`in the ${name} button the space above and below the capital W of "Watch" differs by at most 1px at 1280px`, async ({
    page,
  }) => {
    const { cap } = await measure(page, selector);
    expect(Math.abs(cap.above - cap.below)).toBeLessThanOrEqual(1);
  });

  test(`in the ${name} button the star and lettering as a whole have equal space above and below, within 1px`, async ({
    page,
  }) => {
    const { ink } = await measure(page, selector);
    expect(Math.abs(ink.above - ink.below)).toBeLessThanOrEqual(1);
  });
}

test('the star is its own element, hidden from assistive technology, and the link name stays "Watch on GitHub"', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#top .btn.primary .star')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#top .btn.primary')).toHaveAccessibleName('Watch on GitHub');
  await expect(page.locator('#follow .btn')).toHaveAccessibleName('Watch on GitHub');
});
