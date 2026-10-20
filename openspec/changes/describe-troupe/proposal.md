# Proposal: describe-troupe

## Why

How troupe is described was agreed with the owner on 2026-10-20 (troupe-run/infrastructure#108), and GitHub's side
already uses it. This site still says "agents and people in named roles" in the hero, the page title, the meta
description and the README banner, and the brand guide doesn't record the agreed text, so nothing holds the places
that describe troupe to the same words (troupe-run/website#26).

## What Changes

- **Brand guide:** §7 (Voice) gains a subsection, "How troupe is described", holding the agreed set as a table:
  tagline, sentence, paragraph, status line, one-line description and page title, with the deliberate variants (the
  hero's "Install: coming" button, and troupe's README following its status line with what exists so far). It's the
  reference that GitHub, troupe's README and this site follow.
- **Hero (`src/content/copy/hero.md`):** the subtitle becomes the paragraph. The title stays "Your agents need a
  director.", which is the tagline.
- **Landing page (`src/pages/index.astro`):** the `<title>` (and so `og:title`) becomes the page title, "troupe: your
  agents need a director". The meta description (and so `og:description`) becomes the one-line description followed
  by the status line.
- **README banner (`brand/templates/readme-banner.html`):** its line under the wordmark becomes the sentence, and
  `brand/out/readme-banner.png` is re-rendered and committed. The issue doesn't list it; the owner added it to this
  change on 2026-10-20, so every surface in this repository uses the agreed set.
- **A check** fails when the hero, the page's title and description, or the banner differ from the brand guide's
  table, naming the surface and the text it should have.

Out of scope: GitHub's descriptions, topics and org profile (done in troupe-run/infrastructure's
`align-troupe-descriptions`), and troupe's README (troupe-run/troupe#130). The OG and repository preview images
already show the tagline and don't change.

## Capabilities

### New Capabilities

- `descriptions`: the brand guide's record of how troupe is described, and the site surfaces held to it (hero
  subtitle, page title, meta description, README banner). Named after infrastructure's `descriptions` spec, which
  holds GitHub's side to the same text.

### Modified Capabilities

None.

## Impact

- `docs/brand-guide.md` (§7), `src/content/copy/hero.md`, `src/pages/index.astro`,
  `brand/templates/readme-banner.html`, `brand/out/readme-banner.png` and `brand/out/manifest.json`.
- A new unit test reading the brand guide's table; the landing page's e2e tests gain the title, description and
  subtitle.
- Landing-page copy changes, so the owner reviews the built hero and the rendered banner at 320px, tablet and desktop
  widths before it's called done.
