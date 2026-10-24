# Tasks

## 1. The plugin renders two lists and leaves out an empty section

- [x] 1.1 Install dependencies in this worktree (`npm ci`), then run `npm run test:unit -- roadmap` on the unchanged
  tree to record the baseline. The behaviours that must not change (the list item's shape, the description
  verbatim, the "Released" span and `<time>`, the status line, other pages left alone) are tested by the existing
  plugin tests. Verify: they pass before any edit, and the count is recorded here.
  Done 2026-10-24: 45 tests in 3 files (roadmap, roadmap-plugin, roadmap-source) pass on 9fab6d1.
- [x] 1.2 Prove D3 first: a unit test renders a two-section page (`## Releases` + `roadmap:released`,
  `## Milestones` + an introduction + `roadmap:planned`) with nothing released and asserts the HTML has no Releases
  heading or marker, the Milestones section is whole, and the render's `headings` metadata has no `releases` slug.
  Make it pass by removing the marker's section in `scripts/roadmap-plugin.mjs` (falling back to the `after` hook if
  removing a sibling mid-walk misbehaves, design Risks). Verify: the test fails before the change and passes after.
  Done 2026-10-24: written with 1.3's tests, all 16 new ones failed first (on the then-unknown `roadmap:released`
  marker). Removing the siblings with `ctx.removeNode` during the `html` visit works, so the `after` fallback isn't
  needed; the render's headings are Status, Milestones, How to read it.
- [x] 1.3 Render `released` and `planned` from `roadmap.json`'s one list (D2): released milestones at `released`,
  the rest at `planned`, each in the order given; rename the markers' set to `status`, `released`, `planned`, and the
  list class to `roadmap-list` in the plugin and `src/styles/starlight.css`. Update the plugin tests' page text and
  add tests: each list holds the right versions in order; no version is in both; everything released removes
  Milestones' heading and introduction; `roadmap:releases` fails as an unknown marker naming the three valid ones; a
  marker with no heading before it fails naming the page and the marker; a missing or repeated `released` or
  `planned` marker fails. Verify: `npm run test:unit` passes, the 1.1 baseline tests among them unchanged in what they
  assert.
  Done 2026-10-24: 17 plugin tests, 371 unit tests in all, pass; `astro check` has no errors. The baseline's
  assertions (item shape, verbatim description, the Released span, status line, other pages) are kept.

## 2. The page

- [x] 2.1 Edit `src/content/docs/status.md`: add `## Releases` with `<!-- roadmap:released ... -->` above
  `## Milestones`, rename that section's marker to `roadmap:planned`, each comment saying the descriptions come from
  `tofu/milestones.json` in troupe-run/infrastructure and that an empty section is left out; replace the "gets a date"
  bullet with D4's proposed wording. Update the comment in `src/content/copy/roadmap.md` (its words don't change).
  Verify: `npm run build` succeeds and the built `/status/` (live, no release tags) has no Releases heading and lists
  every milestone under Milestones.
  Done 2026-10-24: the live build's `/status/` has headings Status, Milestones, How to read it, and one list of 21
  milestones.
- [x] 2.2 Update `tests/e2e/status.spec.ts` (live build, shape only, D5): Milestones' list is in version order with no
  date in it; any Releases entry has a date; no version is in both lists; a Releases heading exists exactly when the
  status line names a latest release; "On this page" contains Status, Milestones and How to read it, in that order.
  Rename any test whose name no longer matches its body. Verify: `npm run test:e2e -- status` passes on the live
  build.
  Done 2026-10-24: six roadmap tests, renamed to what they check; with the status, versions and a11y specs, 72 e2e tests
  pass. Each list is found as the first list after its heading, since Milestones has an introduction before its own.
- [x] 2.3 Update the roadmap tests in `tests/e2e/versions.spec.ts` (fixture build): Releases lists 0.1.0 and 0.2.0
  with "Released 2026-01-01" and "Released 2026-03-01" in `<time>` elements; Milestones lists 0.3.0, 0.10.0 and 1.0.0
  with no date; Releases comes before Milestones; "On this page" is Status, Releases, Milestones, How to read it; the
  status line names 0.2.0. Verify: these tests pass on `npm run build:fixture`.
  Done 2026-10-24: four tests on the fixture build pass, among the 72 above.

## 3. Review and integration

- [ ] 3.1 Show the owner D4's "How to read it" wording as text, and `/status/` built live (no Releases) and from the
  fixture (both sections) at 320px, 768px and 1280px, in light and dark. Verify: the owner agrees the wording and the
  layout in this session, recorded here with the date and any change they ask for.
- [ ] 3.2 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes, axe on `/status/` in light and
  dark among them. Save the output to the scratchpad and record its path here.
- [ ] 3.3 Open the pull request with `Closes #34` (body via `--body-file`). Verify: CI's `test` and `guard` jobs
  pass.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- Check #34 is closed and its card on the troupe roadmap says Done. Comment on #34 with the pull request and the
  archived change.
