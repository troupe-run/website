import { test, expect, BLOCKED_EXTERNAL } from './fixtures';

const SECTIONS = ['#top', '#how-it-works', '#the-cast', '#principles', '#follow'];
const REPO = 'https://github.com/troupe-run/troupe';

test('renders the header, the six landing sections and the footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header.site-header')).toBeVisible();
  for (const id of SECTIONS) await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('footer.site-footer')).toBeVisible();
});

test('renders all sections with JavaScript disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  await ctx.route(BLOCKED_EXTERNAL, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto('/');
  for (const id of SECTIONS) await expect(page.locator(id)).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(26, 24, 48)');
  await ctx.close();
});

test('both "Watch on GitHub" links point at the troupe.run repo', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('link', { name: /Watch on GitHub/ });
  await expect(links).toHaveCount(2);
  for (const l of await links.all()) await expect(l).toHaveAttribute('href', REPO);
});

test('"Install: coming" is a disabled button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Install: coming' })).toBeDisabled();
});

test('hero cast is human, agent, troupe, agent, human', async ({ page }) => {
  await page.goto('/');
  const kinds = await page.locator('[data-cast] .character').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')));
  expect(kinds).toEqual(['human', 'agent', 'troupe', 'agent', 'human']);
});

test('principles section shows six cards, each with exactly one topic icon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#principles .principle')).toHaveCount(6);
  const perCard = await page.locator('#principles .principle').evaluateAll((els) => els.map((e) => e.querySelectorAll('.topic-icon').length));
  expect(perCard).toEqual([1, 1, 1, 1, 1, 1]);
});

test('how it works has four steps in order Cast, Perform, Cue, Notes', async ({ page }) => {
  await page.goto('/');
  const labels = await page.locator('#how-it-works .step .eyebrow').evaluateAll((els) => els.map((e) => e.textContent));
  expect(labels.map((l) => l?.trim().toLowerCase())).toEqual(['cast', 'perform', 'cue', 'notes']);
});

for (const width of [320, 390]) {
  test(`no page-level horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('below 480px the cast shows three characters, troupe in the middle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const visible = await page.locator('[data-cast] .character:visible').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')));
  expect(visible).toEqual(['agent', 'troupe', 'agent']);
});

test('with reduced motion, hovering a character leaves its transform at none', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const ch = page.locator('[data-cast] .character').nth(2);
  await ch.hover();
  expect(await ch.evaluate((e) => getComputedStyle(e).transform)).toBe('none');
});

test('without reduced motion, hovering a character transforms it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const ch = page.locator('[data-cast] .character').nth(2);
  await ch.hover();
  await expect.poll(() => ch.evaluate((e) => getComputedStyle(e).transform)).not.toBe('none');
});

test('page has exactly one h1, and it is the hero title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#top h1')).toHaveText('Your agents need a director.');
});

test('the how-it-works section has the --surface background', async ({ page }) => {
  await page.goto('/');
  const bgs = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--surface)';
    document.body.append(probe);
    const surface = getComputedStyle(probe).color;
    probe.remove();
    return { surface, section: getComputedStyle(document.querySelector('#how-it-works')!).backgroundColor };
  });
  expect(bgs.section).toBe(bgs.surface);
});

test('each how-it-works step names the problem it fixes inside its own sentence, with no separate label', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#how-it-works .instead')).toHaveCount(0);
  await expect(page.locator('#how-it-works #step-panel-1 .body')).toHaveText(
    "Tasks fork, join, swarm and loop, so the work isn't stuck behind one agent at a time.");
});

test('the home page has no standalone problem section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#problem')).toHaveCount(0);
});

test('the cast band lists four roles in order with their holders', async ({ page }) => {
  await page.goto('/');
  const rows = await page.locator('#the-cast .row').evaluateAll((els) => els.map((e) => [
    e.querySelector('.role')?.textContent, e.querySelector('.holder')?.textContent,
  ]));
  expect(rows).toEqual([['Product owner', 'Alex'], ['Engineer', 'Build agent'], ['Reviewer', 'Review agent'], ['QA', 'Sam']]);
});

test('each cast row shows a lilac circle for a person and a teal rounded square for an agent', async ({ page }) => {
  await page.goto('/');
  const shapes = await page.locator('#the-cast .row .shape').evaluateAll((els) => els.map((e) => {
    const s = getComputedStyle(e);
    const probe = document.createElement('i');
    document.body.append(probe);
    probe.style.color = `var(--${e.dataset.kind === 'human' ? 'lilac' : 'teal'})`;
    const token = getComputedStyle(probe).color;
    probe.remove();
    return { kind: e.getAttribute('data-kind'), bg: s.backgroundColor, token, round: s.borderTopLeftRadius };
  }));
  expect(shapes.map((s) => s.kind)).toEqual(['human', 'agent', 'agent', 'human']);
  for (const s of shapes) {
    expect(s.bg).toBe(s.token);
    expect(s.round).toBe(s.kind === 'human' ? '50%' : '5px');
  }
});

test('the cast band shows the release gate line and the "Example cast" note', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#the-cast .gate')).toHaveText('Release: decided by the product owner');
  await expect(page.locator('#the-cast .note')).toHaveText('Example cast');
});

test('the cast band does not animate: its shapes are not hero characters and nothing in it bows', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#the-cast .character')).toHaveCount(0);
  await expect(page.locator('#the-cast [data-cast]')).toHaveCount(0);
});

test('the landing page says neither repo, YAML nor config, except in the local-first principle’s "its config, history and decisions" line', async ({ page }) => {
  await page.goto('/');
  const text = (await page.locator('main').innerText()).replace('its config, history and decisions live in git', '');
  expect(text).not.toMatch(/\b(repo|YAML|config)\b/i);
});
test('the how-it-works heading reads "A season, not a single show."', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#how-it-works h2')).toHaveText('A season, not a single show.');
});

test('sections appear in the order hero, how, the-cast, principles, follow', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['top', 'how-it-works', 'the-cast', 'principles', 'follow']);
});

test('the hero has no eyebrow line, no status badge and the header has no status pill', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#top .eyebrow, #top .badge')).toHaveCount(0);
  await expect(page.locator('header.site-header .pill')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('pre-alpha · ');
});

test('at 1280px the hero headline sits on one line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const lines = await page.locator('#top h1').evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
  expect(lines).toBe(1);
});

test('the hero buttons and the closing button centre their text, and the hero pair share a baseline', async ({ page }) => {
  await page.goto('/');
  const btns = page.locator('#top .btn, #follow .btn');
  await expect(btns).toHaveCount(3);
  const info = await btns.evaluateAll((els) => els.map((e) => {
    const s = getComputedStyle(e);
    return { display: s.display, align: s.alignItems, height: e.getBoundingClientRect().height };
  }));
  for (const i of info) {
    expect(i.display).toMatch(/flex/); // blockified to flex inside the hero's flex row
    expect(i.align).toBe('center');
  }
  expect(new Set(info.map((i) => Math.round(i.height))).size).toBe(1);
  const tops = await page.locator('#top .btn').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
});

test('the footer drops the privacy and licence lines and links hps.gd twice, in new tabs', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer.site-footer');
  await expect(footer).not.toContainText('GoatCounter');
  await expect(footer).not.toContainText('CC BY');
  await expect(footer).toContainText('© 2026 HPS.GD PTY LTD');
  const links = footer.locator('a[href="https://hps.gd"]');
  await expect(links).toHaveCount(2);
  await expect(footer.getByRole('link', { name: 'a project by hps.gd' })).toHaveAttribute('target', '_blank');
  await expect(footer.getByRole('link', { name: '© 2026 HPS.GD PTY LTD' })).toHaveAttribute('rel', /noopener/);
});

test('six principles lay out as two rows of three at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const tops = await page.locator('#principles .principle').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  const rows = [...new Set(tops)].map((t) => tops.filter((x) => x === t).length);
  expect(rows).toEqual([3, 3]);
});
