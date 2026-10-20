# Design

## Context

The landing page's words live in three places that don't share a source: the hero's title and subtitle in
`src/content/copy/hero.md` (one file per section, reviewed by the owner as text), the `title` and `description` props
passed to `Landing.astro` in `src/pages/index.astro` (which set `<title>`, the meta description, `og:title` and
`og:description`), and the README banner's line in `brand/templates/readme-banner.html`, rendered to
`brand/out/readme-banner.png` by `npm run assets:render` and verified against `brand/out/manifest.json` in CI. The OG
and repository previews already pass the tagline to `preview.html` in `scripts/assets.config.mjs`.

On GitHub's side, infrastructure declares the same text in `tofu/descriptions.json` and checks the org profile against
it. Here the issue makes the brand guide the reference.

## Goals / Non-Goals

**Goals:**

- One written record of the set, in the brand guide, and a check that names any surface on this site that differs.

**Non-Goals:**

- Reading the brand guide at build time, or generating copy from it.
- Checking that infrastructure's declaration matches this brand guide. The two repos agree by review, as they did for
  #108; a cross-repo check would make this repo's CI depend on infrastructure's files.
- Changing the OG or repository previews, which already show the tagline.

## Decisions

**D1. The table lives in §7, as a subsection, not a new numbered section.** "How troupe is described" is voice applied
to one subject, and a new §8 would renumber Assets, Licensing and Open points, which other documents cite by number.
The vocabulary test's `section()` splits on `## `, so a `### ` subsection inside §7 doesn't disturb it.

The table has two columns, Part and Text, with the six parts in the issue's order. The one-line description's row
holds the full text (tagline, a space, then the sentence) rather than "the tagline, then the sentence", so the check
can compare it and a reader sees exactly what GitHub shows. Below the table, a short list names the deliberate
variants and says who follows the set.

**D2. Each surface keeps its own copy of the text, held to the guide by a unit test.** The alternatives were to have
`index.astro` and the hero read the guide at build time, or to move the set into a JSON file both read. Reading the
guide couples the build to a Markdown table's layout, and both alternatives would take the hero subtitle out of
`src/content/copy/`, where the owner reviews landing copy as text. A check keeps every file readable on its own and
fails loudly on drift, which is the property that matters.

The test, `tests/unit/descriptions.test.ts`, parses the guide's table and checks:

- all six parts are present (an unknown or missing part fails, naming it);
- the paragraph opens with the sentence, the one-line description is the tagline, a space and the sentence, and it's
  at most 160 characters;
- `hero.md`'s `title` is the tagline and its `subtitle` is the paragraph (front matter parsed with `yaml`, already a
  dependency);
- `index.astro`'s `title` prop is the page title and its `description` prop is the one-line description, a space and
  the status line;
- the banner template's `.sub` line is the tagline.

Each failure message names the surface and the text it should have. The `section()` and `table()` helpers in
`vocabulary.test.ts` move to `tests/unit/support/markdown.ts` so both tests use one parser.

The hero title already equals the tagline, and the issue keeps it. The check covers it anyway, so a later edit to
either can't drift unnoticed.

**D3. The e2e tests check the built page.** `landing.spec.ts` gains the hero subtitle, and `meta.spec.ts` gains the
title, meta description, `og:title` and `og:description`, each against the literal text. The unit test proves the
sources agree; the e2e tests prove the page shows them.

**D4. The banner's line is the tagline, in the banner's original style.** It reads the same as the OG and repository
previews, which already show the tagline. The 28-character tagline sits on one line in the existing `.sub` rule (30px,
`max-width: 22ch`). Centred as a box, its capitals sat about 8px above the marks' centre, so it moves down 8px
(`position: relative; top: 8px`), which centres the capitals on the marks. The sentence was tried first, at 26px and 26ch with balanced lines,
and the owner chose the tagline on seeing it (2026-10-20). The image is re-rendered with `npm run assets:render`, and
`npm run assets:verify` must pass.

**D5. The page title and description stay in `index.astro`**, as the issue says, rather than moving into
`src/content/copy/`. They're now copies of text the owner has already agreed in the brand guide, and the check holds
them to it.

## Risks / Trade-offs

- [The table's layout is now an interface the test depends on] → the test fails with a message naming the brand guide
  and the part it couldn't find, rather than a parse error.
- [Infrastructure's declaration and this guide can drift] → both cite #108; a change to the agreed text goes through
  both repos, as this one does. Accepted rather than adding a cross-repo dependency.
- [The meta description is about 160 characters, so search results may truncate the status line] → accepted: the
  issue sets the text, and the truncated part is the status line, which the hero's "Install: coming" button also
  carries.
