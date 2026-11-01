# Design

## Context

See proposal.md for why. Observed on 2026-11-01:

- `troupe-run-v0.1.0` is published as a pre-release, and troupe's "release install check" run for it passed.
- `src/content/copy/hero.md` gives `secondary: { label: "Install: coming" }`. `Hero.astro` renders it as
  `<button type="button" disabled>`, and `.secondary` sets `opacity: .75; cursor: not-allowed`. The hero's schema in
  `src/content.config.ts` takes `secondary: cta`, where `cta`'s `href` is optional. Nothing reads that `href`.
- `src/pages/index.astro` passes the description as a literal. `tests/unit/descriptions.test.ts` holds it to the
  brand guide's one-line description plus status line, and holds the guide's table to an `AGREED` set.
  `tests/e2e/meta.spec.ts` checks the built meta tags against a literal.
- `tests/e2e/landing.spec.ts` checks `"Install: coming" is a disabled button`.
- `https://troupe.run/docs/opening-night/install/` exists today, titled "Install". `/docs/` follows core's tag until
  troupe-run/website#82 lands.
- The original design spec (`docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`) describes "Install:
  coming" in its calls to action, its hero layout, its principles notes and its smoke tests.

## Goals / Non-Goals

**Goals:**
- The hero offers the install page, as a working link, and still says pre-alpha where a visitor can see it.
- The landing page's description, the brand guide and the tests agree on the new status line, as they do on the old.

**Non-Goals:**
- Which release `/docs/` and the status page follow (troupe-run/website#82) and what the install page says
  (troupe-run/troupe#208). This change only links to the page.
- Showing the version number on the landing page. The label names no version, so it needn't change with each release.
- Restyling the hero's buttons beyond dropping the disabled look.

## Decisions

### D1. The secondary call to action is always a link

`Hero.astro` renders the secondary call to action as `<a class="btn secondary" href=…>`, and the disabled `<button>`
goes. The `.secondary` style keeps its surface background and ink border, and loses `opacity: .75` and
`cursor: not-allowed`, which said "unavailable". It gets the site's `:focus-visible` outline from `global.css`, like
the primary link.

Alternative: keep both shapes, a link when `href` is given and a disabled button when it isn't. Rejected: nothing
needs the disabled state now, and a missing `href` would then quietly render a dead button instead of failing. A
missing link is an error (see D2).

### D2. The hero's schema requires a path on this site

The hero's `secondary` becomes `{ label: string, href: site path }`, where a site path is a string starting with `/`
(and not `//`, which a browser reads as another host). The check is a small schema of its own, exported from a module
under `src/lib/` that imports nothing from Astro's content runtime, so a unit test can parse good and bad values
directly. `content.config.ts` uses it for the hero. Its error message says the link must be a path on this site,
such as `/docs/opening-night/install/`; Astro's content error names the file.

Alternative: allow any URL, as the primary does. Rejected: the install page is ours, and a full URL to troupe.run
would skip the build's internal link check and break on preview hosts.

### D3. The status line changes in the guide, and everything else follows the test

The brand guide's table is the source. Its status line becomes "Pre-alpha: you can install it with uv.", the
`AGREED` set in `descriptions.test.ts` changes with it (its test is named for the 2026-10-20 agreement, so the name
gains the 2026-11-01 change), and `index.astro`'s description is edited to match: the existing test fails until it
does. `meta.spec.ts` changes its literal to the new description.

The guide's §7 Do list and its deliberate variants name "Install (pre-alpha)" in place of "Install: coming". The
original design spec isn't rewritten: it's dated history. A one-line note where it first describes "Install: coming"
says it was replaced by the `landing-calls-to-action` spec (troupe-run/website#83), so a reader treating it as current
isn't misled (project context: its decisions stand unless an OpenSpec spec replaces them).

### D4. Tests

- **e2e, `landing.spec.ts`:** the "disabled button" test is replaced by one that finds the link named
  "Install (pre-alpha)", checks its `href`, and checks that the hero has no disabled button. A second test follows the
  link and checks the install page's heading is "Install". A third tabs from "Watch on GitHub" and checks focus moves
  to "Install (pre-alpha)" and the outline is drawn (a non-`none` `outline-style` on the focused link).
- **unit, the site-path schema:** accepts `/docs/opening-night/install/`; refuses a missing value, `https://…` and
  `//host/…`, each with the message from D2.
- **axe:** the landing page's existing axe runs, in light and dark, now cover an enabled secondary link, which a
  disabled button was exempt from in the contrast rule. No new axe test is needed; they must still pass.
- **By hand:** the hero at 320px, 768px and 1280px, in light and dark, shown to the owner as the built page before the
  change is called done (project context: visual and copy changes are shown at the widths that matter).

## Risks / Trade-offs

- [The install page describes installing from `main` until troupe-run/troupe#208 is released] → It's still a working
  install, and the page itself says how to install a tagged release. This change links to the page; it doesn't own
  its text.
- [The enabled secondary's contrast hasn't been measured by axe before] → It's ink on surface, the body text pair,
  which passes everywhere else on the site. The existing axe runs will fail if it doesn't.
- [A page under `/docs/` moving would break the link] → The internal link check fails the build, as for any link.

## Migration Plan

Lands with the merge, like any change: every merge to main deploys. Rolling back is reverting the commit.
