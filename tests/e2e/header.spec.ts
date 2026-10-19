import { test, expect } from './fixtures';

const BLOG_POST = '/blog/2026-10-10-methodology-bake-off/';
const PAGES = [
  { name: 'landing page', path: '/', label: null },
  { name: 'docs page', path: '/docs/programme/what-is-troupe/', label: 'docs' },
  { name: 'blog index', path: '/blog/', label: 'blog' },
  { name: 'blog post', path: BLOG_POST, label: 'blog' },
] as const;

for (const p of PAGES) {
  test(`the ${p.name} has the shared site header with exactly Docs, Blog and GitHub`, async ({ page }) => {
    await page.goto(p.path);
    const header = page.locator('.site-header');
    await expect(header).toHaveCount(1);
    const links = await header.locator('nav[aria-label="Site"] a').allInnerTexts();
    expect(links).toEqual(['Docs', 'Blog', 'GitHub']);
    await expect(header.getByRole('link', { name: 'troupe home' })).toHaveAttribute('href', '/');
  });

  test(`the ${p.name}'s header reads "${p.label ? `troupe ${p.label}` : 'troupe'}" top left`, async ({ page }) => {
    await page.goto(p.path);
    const brand = page.locator('.site-header .brand');
    // The wordmark and section name, not the docs version picker that follows them (versioned-docs design D6).
    await expect(brand.locator(':scope > a')).toHaveText(p.label ? ['troupe', p.label] : ['troupe'], { useInnerText: false });
    await expect(brand.locator('.section')).toHaveCount(p.label ? 1 : 0);
    if (p.label) await expect(brand.locator('.section')).toHaveAttribute('href', `/${p.label}/`);
  });
}

for (const path of ['/docs/programme/what-is-troupe/', '/blog/']) {
  test(`on ${path} "troupe" and the section name share a baseline`, async ({ page }) => {
    await page.goto(path);
    const baseline = (sel: string) => page.locator(sel).evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.appendChild(probe);
      const y = probe.getBoundingClientRect().top;
      probe.remove();
      return y;
    });
    const word = await baseline('.site-header .wordmark');
    const section = await baseline('.site-header .section');
    expect(Math.abs(word - section)).toBeLessThanOrEqual(0.5);
  });
}

for (const path of ['/blog/', BLOG_POST]) {
  test(`${path} has no left-hand sidebar`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).not.toHaveAttribute('data-has-sidebar');
    await expect(page.locator('#starlight__sidebar')).toHaveCount(0);
  });

  test(`${path}'s tab title names the blog, not the docs`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/\| troupe blog$/);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'troupe blog');
  });
}

test('docs pages keep their sidebar, tab title and search', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.locator('html')).toHaveAttribute('data-has-sidebar');
  await expect(page).toHaveTitle(/\| troupe docs$/);
  await expect(page.locator('.site-header site-search')).toHaveCount(1);
});

test('the blog keeps search too', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator('.site-header site-search')).toHaveCount(1);
});

// Starlight clips its header (overflow: clip), so a page-overflow check can't see a link pushed off the edge.
// These check each link's own box instead.
async function linksFitOnScreen(page: import('@playwright/test').Page) {
  const width = page.viewportSize()!.width;
  for (const link of await page.locator('.site-header nav[aria-label="Site"] a').all()) {
    await expect(link).toBeVisible();
    const box = (await link.boundingBox())!;
    expect(box.x + box.width, await link.innerText()).toBeLessThanOrEqual(width);
  }
}

for (const [name, path] of [['landing page', '/'], ['docs page', '/docs/programme/what-is-troupe/'], ['blog index', '/blog/'], ['blog post', BLOG_POST]] as const) {
  test(`at 1280px every site link on the ${name} is fully on screen`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    await linksFitOnScreen(page);
  });
}

for (const [name, path] of [['landing page', '/'], ['blog index', '/blog/'], ['blog post', BLOG_POST]] as const) {
  test(`at 375px every site link on the ${name} is fully on screen`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    await linksFitOnScreen(page);
  });
}

test('at 375px a docs page moves the site links from the header into the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.locator('.site-header nav')).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  const menu = page.locator('.mobile-site-nav');
  await expect(menu).toBeVisible();
  expect(await menu.getByRole('link').allInnerTexts()).toEqual(['Docs', 'Blog', 'GitHub']);
});

test('at 1280px the mobile-menu copy of the site links is hidden, so the page has one Site nav', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.locator('.mobile-site-nav')).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Site' })).toHaveCount(1);
});

test('the blog index has no empty "On this page" column', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator('html')).not.toHaveAttribute('data-has-toc');
});

test('a blog post keeps its "On this page" contents', async ({ page }) => {
  await page.goto(BLOG_POST);
  await expect(page.locator('html')).toHaveAttribute('data-has-toc');
});

test('the blog post column is the docs width, not Starlight\'s wide splash width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BLOG_POST);
  const width = await page.locator('.main-pane .sl-container').first().evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(720);
});
