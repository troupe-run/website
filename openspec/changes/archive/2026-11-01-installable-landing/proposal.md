# Proposal

## Why

troupe's bundle, `troupe-run-v0.1.0`, was published on 2026-11-01, and its release install check passed. The landing
page still says there's nothing to install: the hero's secondary button is a disabled "Install: coming", and the page
description ends "Pre-alpha: there's nothing to install yet." This is troupe-run/website#83.

## What Changes

- **The hero's install button becomes a link.** "Install: coming", a disabled `<button>`, becomes "Install
  (pre-alpha)", a link to the install page, `/docs/opening-night/install/`. It's styled as an enabled secondary
  button. The label keeps the landing page's only visible pre-alpha signal (owner, 2026-11-01).
- **The status line changes.** The brand guide's §7 "How troupe is described" table changes its status line from
  "Pre-alpha: there's nothing to install yet." to "Pre-alpha: you can install it with uv." (owner, 2026-11-01). It
  still says pre-alpha: 0.x releases are pre-releases until 1.0 (troupe-run/troupe#217). The landing page's meta
  description and `og:description` follow it, since they're the one-line description followed by the status line.
- **The brand guide's deliberate variants** name the hero's "Install (pre-alpha)" link, in place of "Install: coming",
  as the landing page's pre-alpha signal, in §7's Do list and under the table.
- **The hero's copy schema requires the secondary call to action's link,** a path on this site. The disabled state
  goes; nothing else uses it.
- **The rest of the landing copy was checked.** No other section says there's nothing to install. The status page's
  "unreleased" and "released" lines (`roadmap.md`) already switch on the release data, and are troupe-run/website#82's
  concern.

## Capabilities

### New Capabilities

- `landing-calls-to-action`: the landing page's calls to action, starting with the hero's install link: its label,
  where it goes, and that it's a working link.

### Modified Capabilities

- `descriptions`: the status line the brand guide records, and so the landing page's description, become "Pre-alpha:
  you can install it with uv."

## Impact

- `src/content/copy/hero.md`, `src/components/sections/Hero.astro`, `src/content.config.ts` (the hero's schema),
  `src/pages/index.astro`.
- `docs/brand-guide.md` §7, and a note in the original design spec where it describes "Install: coming".
- Tests: `tests/e2e/landing.spec.ts`, `tests/e2e/meta.spec.ts`, `tests/unit/descriptions.test.ts`.
- Nothing outside this repository changes. GitHub's descriptions don't carry the status line, and troupe's README
  already opens with "Pre-alpha: you can install it with uv", then says what exists so far, as the guide's variant
  allows.
- The link goes to whatever `/docs/` is built from. Until troupe-run/website#82 lands, that's core's `troupe-v0.1.0`,
  whose install page installs from `main`; after it, the bundle's tag. Both install a working troupe, and the build's
  internal link check holds the link to a page that exists.
