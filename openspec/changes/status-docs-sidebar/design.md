# Design

## Context

`src/route-middleware.ts` runs after Starlight's and starlight-blog's own route middleware. For a docs route
(`locate()` finds its version) it replaces `route.sidebar` and `route.pagination` with that version's. For every other
route it sets `route.hasSidebar = false`, drops an "On this page" column that would be empty, and renames the site in
the tab title. It leaves `route.pagination` alone, so a page outside `/docs` keeps Starlight's own "Previous" and
"Next", taken from Starlight's order of every page in the collection. That's how `/status/` gets "Previous" to
`/docs/the-company/theatres/`, and the only blog post (with no neighbouring post for starlight-blog to link) gets
"Next" to `/docs/backstage/changelog/`.

`sidebar(version, current)` in `src/lib/docs-versions.ts` builds a version's groups. It marks a page link current when
its path is `current`, and never marks the kept links (Status and roadmap, Contributing). `latest(manifest)` is the
version at `/docs/` (role `current`). Site pages with a sidebar get the docs layout through existing rules:
`[data-has-sidebar]` hides the header's site links on narrow screens, where `MobileMenuFooter.astro` carries them in
the menu, and `starlight.css` narrows the content only when there's no sidebar.

## Goals / Non-Goals

**Goals:**

- `/status/` reads as part of the docs to a reader arriving from them, without moving the page or its source.
- No page outside `/docs` sends a reader into `/docs` through "Previous" or "Next".

**Non-Goals:**

- Remembering which version a reader came from. The site is static, and a script that rewrites the sidebar after load
  would show the wrong sidebar first.
- Changing the header on `/status/`: it keeps the plain wordmark and "| troupe" in the tab title (D3).

## Decisions

**D1. A page outside `/docs` gets the docs sidebar when the sidebar links to it.** The middleware asks whether the
route's URL is one of the kept links' hrefs (only `/status/` today, since Contributing is on GitHub). If it is, it sets
`route.sidebar` to `sidebar(latest(manifest), …)` with that link marked current, and leaves `hasSidebar` on. The
alternative, checking for `status` by name, would miss the next page the website keeps. Giving every `site` page the
sidebar would show it on pages it doesn't list, with nothing marked current.

**D2. `sidebar()` marks a kept link current by its href.** Its second argument becomes "what the reader is on": a
page path (`programme/what-is-troupe.md`) or a kept link's href (`/status/`). A page link is current when its path
matches, a kept link when its href matches. One function keeps docs pages and `/status/` on the same sidebar, so they
can't drift. The alternative, a separate `siteSidebar()`, would copy the group-building.

**D3. The header and tab title stay the site's.** The page belongs to this repository, not to a docs version, and the
issue is about navigation, not naming. So the header keeps the plain wordmark, there's no version picker (`locate()`
still finds no version), and the title stays "Status and roadmap | troupe". The owner can ask for "troupe docs" in
review. It's a one-line change in `Header.astro` and the middleware.

**D4. Pagination outside `/docs` keeps only links within the page's own section.** For a `site` page that's none.
For a blog page, the middleware drops any link whose href isn't under `/blog/`, so starlight-blog's links between posts
survive and the docs fallback goes. It's filtered by URL rather than cleared, so a second post brings back
"Older posts" and "Newer posts" without a change here.

**D5. Tests.**

- **Unit** (`tests/unit/docs-versions.test.ts`):
  - `sidebar(v, '/status/')` marks only Status and roadmap current;
  - `sidebar(v, 'programme/what-is-troupe.md')` marks only that page;
  - a kept link is never current on a docs page.

  The middleware's choices (which routes get the sidebar, how pagination is filtered) move into a pure function in
  `src/lib/site-section.ts` beside `siteSection()`, so they're unit-tested without Astro.
- **E2e** (`tests/e2e/status.spec.ts`):
  - `/status/` has `data-has-sidebar`;
  - its sidebar's labels are the six sections;
  - its current entry (`aria-current="page"`) is the only one, and it's "Status and roadmap";
  - every docs link in the sidebar is under `/docs/` and not `/docs/next/`;
  - it has no `rel="prev"` or `rel="next"` link;
  - at 320px, the Menu button opens a sidebar that holds Status and roadmap.

  The existing assertion that the sidebar is absent is replaced, and the test's name changes with it.
- **Blog e2e:** the blog index and post have no sidebar, and the post has no `rel="prev"` or `rel="next"` link under
  `/docs/`.
- **Fixture build** (`versions.spec.ts`): `/status/`'s sidebar links to the latest release's pages, with none under
  `/docs/next/` or `/docs/v0.1/`.

## Risks / Trade-offs

- [A reader arriving from `/docs/next/` or an archived version sees the latest release's sidebar on `/status/`] →
  accepted (Non-Goals). The page isn't versioned, the latest release is what most readers use, and the header's
  "Docs" link and the browser's back button return them.
- [Starlight could change how its route data or `aria-current` works in a minor upgrade] → the e2e tests check the
  built page, so an upgrade that breaks it fails CI. That's the design spec's 6.4 trigger to revisit, as for the docs
  sidebar.
- [The page gets wider, since `starlight.css` narrows content only without a sidebar] → seen in the owner's review at
  three widths.
