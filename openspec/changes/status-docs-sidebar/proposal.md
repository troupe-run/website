# Proposal: status-docs-sidebar

## Why

The docs sidebar's Programme section ends with "Status and roadmap", but `/status/` has no sidebar, so a reader who
follows it from the docs loses the docs navigation (troupe-run/website#28). troupe's "What is troupe?" reaches the
same page through the old URL's redirect, with the same result. It's working as designed: `docs-from-troupe`'s
design D10 moved the page out of `/docs` because this repository owns it, and rendered it like a blog page. The
owner chose on 2026-10-20 to keep the page where it is and give it the docs sidebar.

Looking for the same problem elsewhere found a second one. Pages outside `/docs` show Starlight's own "Previous" and
"Next" links, which come from Starlight's order of every page rather than any sidebar. `/status/` shows "Previous"
to `/docs/the-company/theatres/`, and the blog post `/blog/2026-10-10-methodology-bake-off/` shows "Next" to
`/docs/backstage/changelog/`. Both drop a reader somewhere arbitrary, so this change fixes them too.

## What Changes

- **`/status/` shows the docs sidebar** of the version at `/docs/` (the latest release, or troupe's `main` before the
  first one), with "Status and roadmap" marked as the current page. It stays this repository's own page at
  `/status/`, in no version, with no version menu, and its header and tab title stay the site's ("troupe"), not
  "troupe docs".
- **Any page the docs sidebar links to** gets the sidebar this way, not only `/status/`. A page outside `/docs` that
  the sidebar doesn't link to keeps having none. Contributing is on GitHub, so it isn't affected.
- **Pages outside `/docs` have no "Previous" or "Next" link into `/docs`.** `/status/` has neither. A blog post keeps
  the links starlight-blog gives it to other posts, and loses any link outside `/blog/`.
- **BREAKING (spec):** the `versioned-docs` requirement "Status and roadmap is the site's own page at /status/" no
  longer says "no docs sidebar", and `tests/e2e/status.spec.ts`'s assertion that the sidebar is absent is reversed.

Out of scope: marking Contributing as an external link in the sidebar (noted on #28), and which sidebar to show to a
reader arriving from an older version. A static page can't know where the reader came from, so it shows the
version at `/docs/`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `versioned-docs`: Status and roadmap shows the docs sidebar of the version at `/docs/` with itself marked current;
  the sidebar requirement covers the pages the website keeps; pages outside `/docs` have no "Previous" or "Next"
  link into it.

## Impact

- `src/route-middleware.ts` and `src/lib/docs-versions.ts` (the sidebar's current-page marking), with their unit
  tests in `tests/unit/docs-versions.test.ts`.
- `tests/e2e/status.spec.ts`, plus new e2e checks for the sidebar on `/status/` (including at 320px, through the
  mobile menu) and for the blog post's pagination. The axe test already covers `/status/` and the blog post.
- No copy changes. The owner sees `/status/` at 320px, 768px and 1280px, in light and dark, before it's called done.
