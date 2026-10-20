# Tasks

## 1. The brand guide's record (D1)

- [x] 1.1 Add "### How troupe is described" to the end of §7 in `docs/brand-guide.md`: a Part | Text table with the
  tagline, sentence, paragraph, status line, one-line description (written out in full) and page title, exactly as in
  troupe-run/website#26, then the deliberate variants (the hero's "Install: coming" button; troupe's README following
  its status line with what exists so far) and a line saying GitHub, troupe's README and this site follow it, citing
  troupe-run/infrastructure#108. Verify: `npx vitest run tests/unit/vocabulary.test.ts` still passes, and the
  rendered Markdown table shows six rows.

## 2. The check (D2)

- [x] 2.1 Move `section()` and `table()` from `tests/unit/vocabulary.test.ts` to `tests/unit/support/markdown.ts` and
  import them from there. Verify: `npx vitest run tests/unit/vocabulary.test.ts` passes with the same number of tests
  as before the move.
- [x] 2.2 Write `tests/unit/descriptions.test.ts` with tests that read the guide's table and check the set agrees with
  itself: all six parts present (and an unknown or missing part is named), the paragraph opens with the sentence, the
  one-line description is the tagline, a space and the sentence, and it's at most 160 characters (the message gives
  the length and the limit). Give the parsing a fixture test for each failure: a missing part, a paragraph that
  doesn't open with the sentence, and a 161-character description. Verify: the tests pass against the guide from 1.1,
  and each fixture test fails with the message the spec names when its assertion is inverted by hand once.
- [x] 2.3 Add tests to the same file that hold each surface to the guide: `hero.md`'s `title` is the tagline and its
  `subtitle` is the paragraph; `index.astro`'s `title` prop is the page title and its `description` prop is the
  one-line description, a space and the status line; the banner template's `.sub` text is the tagline. Each failure
  names the surface and the text it should have. Verify: run them before section 3 and see the subtitle, title,
  description and banner tests fail on today's text, naming the right surface, while the hero title test passes.

## 3. The landing page (spec: hero, title and description)

- [x] 3.1 Set `subtitle` in `src/content/copy/hero.md` to the paragraph. Leave `title` alone. Verify: the hero tests
  from 2.3 pass.
- [x] 3.2 Set the `title` and `description` props in `src/pages/index.astro` to the page title, and to the one-line
  description followed by the status line. Verify: the title and description tests from 2.3 pass.
- [x] 3.3 In `tests/e2e/landing.spec.ts`, assert the hero's `.sub` text is the paragraph. In `tests/e2e/meta.spec.ts`,
  assert the landing page's title, meta description, `og:title` and `og:description` against the literal text in the
  spec. Verify: `npm run test:e2e -- landing meta` passes, and each new assertion fails when run against `main`'s
  `hero.md` and `index.astro`.

## 4. The README banner (D4)

- [x] 4.1 Set the `.sub` line in `brand/templates/readme-banner.html` to the tagline, keeping it within the 1280×320
  image. Run `npm run assets:render`. Verify: the banner test from 2.3 passes, `npm run assets:verify` passes, and only
  `readme-banner.png` and `manifest.json` changed under `brand/out/`. Look at the PNG and record the style used.
  Done 2026-10-20: the sentence went first, at 26px and 26ch with balanced lines (three lines). On seeing it the owner
  chose the tagline, so the banner reads the same as the previews. The test was changed to the tagline first and
  failed on the sentence, naming the banner. The tagline sits on one line in the banner's original `.sub` rule (30px,
  `max-width: 22ch`). The owner saw it sit high, and measuring showed its capitals' centre at y 160 against the marks'
  167. `top: 8px` moves it down, and the re-render was measured: capitals at y 157–178 (centre 167.5), marks at
  y 138–196 (centre 167). The owner accepted that as close enough (2026-10-20). The descriptions test passes (15/15),
  `npm run assets:verify` passes, and only `readme-banner.png` and `manifest.json` changed under `brand/out/`.

## 5. Review and integration

- [x] 5.1 Build the site and show the owner the hero at 320px, 768px and 1280px, in light and dark, and the rendered
  README banner. Verify: the owner agrees the text and layout in this session, recorded in this task with the date.
  Done 2026-10-20: the owner saw the hero at 320px, 768px and 1280px in light and dark (screenshots), and the built page
  in a browser, and agreed it, including the line that starts with "you." at 768px and 1280px ("that's fine"). The
  banner was agreed after two changes: the tagline instead of the sentence, and 8px lower (task 4.1).
- [x] 5.2 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes, axe among them. Save the output
  to the scratchpad.
  Done 2026-10-20: all gates passed, with 226 e2e tests across both projects. The output is saved at
  /private/tmp/claude-502/-Users-martin-Projects-troupe-website/d979b2a5-b154-47d9-98db-2b8793ac5129/scratchpad/final-check.log.
- [x] 5.3 Open the pull request with `Closes #26`. Verify: CI's `test` and `guard` jobs pass.
  Done 2026-10-20: troupe-run/website#27 says Closes #26. `guard` passed. `test` failed first because the runner's
  `apt-get` got a 403 from packages.microsoft.com while installing Chromium's libraries, before any check ran. It passed
  on a re-run of the failed job.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- Check #26 is closed and its card on the troupe roadmap says Done. Comment on #26 with the pull request and the
  archived change.
