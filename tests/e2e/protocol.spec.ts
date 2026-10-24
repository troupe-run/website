import { test, expect } from './fixtures';

// /protocol/ on the live build: troupe-run/troupe has no protocol-v* tag yet, so the latest, 0/ and next/ all serve
// main (spec: protocol-schemas; design D3, D6, D8). The copies of a troupe with protocol releases are tested on the
// fixture build, in versions.spec.ts.
const BASE = 'https://troupe.run/protocol/';

test('/protocol/ shows Protocol schemas with no left-hand sidebar and no version menu', async ({ page }) => {
  await page.goto('/protocol/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Protocol schemas');
  await expect(page).toHaveTitle('Protocol schemas | troupe');
  await expect(page.locator('html')).not.toHaveAttribute('data-has-sidebar');
  await expect(page.locator('[data-version-menu]')).toHaveCount(0);
});

test('/protocol/ lists the four kinds of URL, and says there is no protocol release yet and what serves main', async ({ page }) => {
  await page.goto('/protocol/');
  // A list, not a table, so it reads top to bottom at 320px (owner, 2026-10-24): each entry is the URL, what it serves
  // and what to use it for.
  const entries = page.locator('li').filter({ hasText: 'Serves:' }).filter({ hasText: 'Use it for:' });
  const urls = await entries.evaluateAll((lis) => lis.map((li) => li.querySelector('code')!.textContent));
  expect(urls).toEqual(['/protocol/<path>', '/protocol/<major>/<path>', '/protocol/<version>/<path>', '/protocol/next/<path>']);
  await expect(page.getByText('No protocol release yet.')).toHaveText(
    "No protocol release yet. Until there is one, /protocol/ and /protocol/0/ serve troupe’s unreleased main.",
  );
  await expect(page.locator('.protocol-releases')).toHaveCount(0);
});

for (const prefix of ['', '0/', 'next/']) {
  test(`/protocol/${prefix}config/actor.schema.json is served as JSON, with its own copy's $id`, async ({ request }) => {
    const response = await request.get(`/protocol/${prefix}config/actor.schema.json`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^application\/json/);
    expect((await response.json()).$id).toBe(`${BASE}${prefix}config/actor.schema.json`);
  });
}

test('no copy is served for a major version or a release that troupe has no tag for', async ({ request }) => {
  for (const path of ['/protocol/1/config/actor.schema.json', '/protocol/0.1.0/config/actor.schema.json']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("the sync's marker file isn't served", async ({ request }) => {
  expect((await request.get('/protocol/.troupe-protocol')).status()).toBe(404);
});
