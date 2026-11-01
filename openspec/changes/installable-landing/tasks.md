# Tasks

## 1. The status line

- [ ] 1.1 In `docs/brand-guide.md` §7, change the table's status line to "Pre-alpha: you can install it with uv.",
  and name "Install (pre-alpha)" in place of "Install: coming" in the Do list and the deliberate variants (design D3).
  In `tests/unit/descriptions.test.ts`, change `AGREED`'s status line and the agreement test's name to cover
  2026-11-01. Verify `npx vitest run tests/unit/descriptions.test.ts` fails only on the landing page's description.
- [ ] 1.2 Change the description in `src/pages/index.astro` to end "Pre-alpha: you can install it with uv.", and the
  literal in `tests/e2e/meta.spec.ts` to match. Verify `npx vitest run tests/unit/descriptions.test.ts` passes, and
  `grep -rn "nothing to install" src docs/brand-guide.md tests` finds nothing.

## 2. The hero's install link

- [ ] 2.1 Add the site-path schema under `src/lib/` (design D2), with unit tests that it accepts
  `/docs/opening-night/install/` and refuses a missing value, `https://troupe.run/docs/opening-night/install/` and
  `//troupe.run/docs/`, each with the message saying the link must be a path on this site. Write the tests first and
  watch them fail. Verify with `npx vitest run` on the new test file.
- [ ] 2.2 Make the hero's `secondary` in `src/content.config.ts` require `href` as a site path, and set
  `src/content/copy/hero.md`'s secondary to `{ label: "Install (pre-alpha)", href: "/docs/opening-night/install/" }`.
  Verify by hand that the build refuses the copy with the `href` removed, and again with a full URL, naming
  `hero.md` (record the two error lines in the PR), then that `npx astro check` passes with the real copy.
- [ ] 2.3 In `tests/e2e/landing.spec.ts`, replace the "disabled button" test with the three tests in design D4 (the
  link's name and `href` with no disabled button in the hero; following it reaches the page headed "Install"; tabbing
  from "Watch on GitHub" focuses it with an outline). Run them against the current build and watch them fail.
- [ ] 2.4 Render the secondary call to action in `Hero.astro` as `<a class="btn secondary">`, and drop
  `opacity: .75` and `cursor: not-allowed` from `.secondary` (design D1). Verify the three new e2e tests and the
  landing page's axe tests pass, in light and dark.

## 3. History and verification

- [ ] 3.1 Add a one-line note in `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`, where its calls to
  action first describe "Install: coming", that the `landing-calls-to-action` spec replaced it (troupe-run/website#83).
  Verify by reading the note in place.
- [ ] 3.2 Build the site and show the owner the hero at 320px, 768px and 1280px, in light and dark, with the new copy
  ("Install (pre-alpha)" and the page description). Verify by the owner's approval, recorded in the PR.
- [ ] 3.3 Verify `openspec validate installable-landing --strict` and `uv run scripts/check.py` pass before each
  commit.

## Workflow follow-up

- Open the pull request as a draft (`Closes #83`), act on Claude's review, and mark it ready once it's clean.
- Archive the change on the branch, then ask the owner to merge.
- After the merge, check #83 is closed and its card on the troupe roadmap says Done, and comment on it with the pull
  request and the archived change.
