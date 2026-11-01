import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';

// /protocol/ on the live build: troupe-run/troupe as it is, with or without protocol-v* tags. The tests read the
// releases and copies the sync recorded in the manifest, and check the site against them (spec: protocol-schemas;
// quality-check; design D3, D6, D8). Fixed releases, and every copy's ref, are tested on the fixture build, in
// versions.spec.ts.
const { copies, releases }: { copies: { prefix: string; ref: string }[]; releases: string[] } =
  JSON.parse(readFileSync('src/generated/troupe-docs.json', 'utf8')).protocol;
const BASE = 'https://troupe.run/protocol/';

test('/protocol/ shows Protocol schemas with no left-hand sidebar and no version menu', async ({ page }) => {
  await page.goto('/protocol/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Protocol schemas');
  await expect(page).toHaveTitle('Protocol schemas | troupe');
  await expect(page.locator('html')).not.toHaveAttribute('data-has-sidebar');
  await expect(page.locator('[data-version-menu]')).toHaveCount(0);
});

test("/protocol/ lists the four kinds of URL, and the build's protocol releases newest first, or says there is none and what serves main", async ({ page }) => {
  await page.goto('/protocol/');
  // A list, not a table, so it reads top to bottom at 320px (owner, 2026-10-24): each entry is the URL, what it serves
  // and what to use it for.
  const entries = page.locator('li').filter({ hasText: 'Serves:' }).filter({ hasText: 'Use it for:' });
  const urls = await entries.evaluateAll((lis) => lis.map((li) => li.querySelector('code')!.textContent));
  expect(urls).toEqual(['/protocol/<path>', '/protocol/<major>/<path>', '/protocol/<version>/<path>', '/protocol/next/<path>']);
  if (releases.length === 0) {
    await expect(page.getByText('No protocol release yet.')).toHaveText(
      "No protocol release yet. Until there is one, /protocol/ and /protocol/0/ serve troupe’s unreleased main.",
    );
    await expect(page.locator('.protocol-releases')).toHaveCount(0);
  } else {
    await expect(page.locator('.protocol-releases li')).toHaveText(
      releases.map((v, i) => `${v}${i === 0 ? ' (latest)' : ''}, at /protocol/${v}/`),
    );
    await expect(page.getByText('No protocol release yet.')).toHaveCount(0);
  }
});

for (const { prefix } of copies) {
  test(`/protocol/${prefix}config/actor.schema.json is served as JSON, with its own copy's $id`, async ({ request }) => {
    const response = await request.get(`/protocol/${prefix}config/actor.schema.json`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^application\/json/);
    expect((await response.json()).$id).toBe(`${BASE}${prefix}config/actor.schema.json`);
  });
}

// The next major and the next release after the latest (or 1/ and 0.1.0/ before the first) are the copies most likely
// to be served by mistake (design D4).
test('no copy is served for the next major version or the next release, which troupe has no tag for', async ({ request }) => {
  const [major, minor, patch] = (releases[0] ?? '').split('.').map(Number);
  const unreleased = releases.length === 0 ? ['1/', '0.1.0/'] : [`${major + 1}/`, `${major}.${minor}.${patch + 1}/`];
  for (const prefix of unreleased) {
    // The premise, checked: the build recorded no such copy.
    expect(copies.map((c) => c.prefix), prefix).not.toContain(prefix);
    expect((await request.get(`/protocol/${prefix}config/actor.schema.json`)).status(), prefix).toBe(404);
  }
});

test("the sync's marker file isn't served", async ({ request }) => {
  expect((await request.get('/protocol/.troupe-protocol')).status()).toBe(404);
});
