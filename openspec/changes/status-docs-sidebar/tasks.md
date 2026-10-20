# Tasks

## 1. The sidebar marks a kept link current (D2)

- [ ] 1.1 In `tests/unit/docs-versions.test.ts`, add tests first:
  - `sidebar(v, '/status/')` marks Status and roadmap current and nothing else;
  - `sidebar(v, 'programme/what-is-troupe.md')` marks only that page;
  - on any docs page, neither kept link is current.

  Run them and see the first fail on `main`'s `sidebar()`. Then change `sidebar()`'s second argument to "the page
  path or kept href being read" and mark a kept link current when its href matches. Verify:
  `npx vitest run tests/unit/docs-versions.test.ts` passes, with the existing sidebar tests unchanged.

## 2. Which routes get the sidebar, and which pagination they keep (D1, D4)

- [ ] 2.1 In `src/lib/site-section.ts`, beside `siteSection()`, add pure functions, tests first in
  `tests/unit/site-section.test.ts`:
  - one that says whether a route outside `/docs` shows the docs sidebar: true for a kept link's href, so `/status/`;
    false for `/blog/`, a blog post, and a made-up site page;
  - one that keeps only the "Previous"/"Next" links within the route's own section: none for a site page, `/blog/…`
    links only for a blog page, and a docs page's links untouched.

  Verify: the new tests fail before the functions exist and pass after, and `npx vitest run tests/unit` passes.
- [ ] 2.2 Use them in `src/route-middleware.ts`. A route the docs sidebar links to gets
  `sidebar(latest(manifest), href)` and keeps `hasSidebar`. Every other non-docs route keeps today's behaviour (no
  sidebar, no empty "On this page", the site's name in the title). Each non-docs route's pagination is filtered. Update
  the middleware's comment to say why. Verify: `npm run check` passes, and in the built `dist/status/index.html` the
  `<html>` has `data-has-sidebar`, the sidebar holds exactly one `aria-current="page"` (on "Status and roadmap"), and
  there's no `rel="prev"` or `rel="next"` link. `dist/blog/2026-10-10-methodology-bake-off/index.html` has no
  `rel="next"` link to `/docs/`.

## 3. The built pages (spec scenarios)

- [ ] 3.1 In `tests/e2e/status.spec.ts`, replace the test that asserts no sidebar. Its new name says what it checks:
  "/status/ shows Status and roadmap with the site header, the docs sidebar and no version menu". Add tests:
  - the sidebar's six section labels, in order;
  - "Status and roadmap" is the only `aria-current="page"` entry;
  - every docs link in the sidebar is under `/docs/` and none is under `/docs/next/`;
  - there's no "Previous" or "Next" link;
  - at 320px, the Menu button opens the sidebar, with Status and roadmap in it;
  - the old URL lands on `/status/` with the sidebar.

  Verify: they pass, and the sidebar, `aria-current` and pagination tests fail when run against `main`'s middleware.
- [ ] 3.2 Add blog tests (in `tests/e2e/header.spec.ts`, beside the blog's other layout tests): `/blog/` and the post
  have no `data-has-sidebar`, and the post has no `rel="prev"` or `rel="next"` link under `/docs/`. Verify: the
  pagination test fails against `main`'s middleware and passes after.
- [ ] 3.3 In `tests/e2e/versions.spec.ts` (the fixture build, with releases), add: `/status/`'s sidebar links only to
  the latest release's pages under `/docs/`, none under `/docs/next/` or `/docs/v0.1/`. Verify: it passes, with
  `npm run build:fixture` run first.

## 4. Review and integration

- [ ] 4.1 Build the site and show the owner `/status/` at 320px (menu open and closed), 768px and 1280px, in light and
  dark, beside a docs page at 1280px. Verify: the owner agrees the layout in this session, recorded in this task with
  the date.
- [ ] 4.2 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes, axe on `/status/` and the blog
  post among them. Save the output to the scratchpad.
- [ ] 4.3 Open the pull request with `Closes #28`. Verify: CI's `test` and `guard` jobs pass.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- Check #28 is closed and its card on the troupe roadmap says Done. Comment on #28 with the pull request and the
  archived change.
