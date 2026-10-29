# Tasks

## 1. One axe helper, on 4.13, with no change in behaviour

- [x] 1.1 Add `tests/e2e/axe.ts` (design D3) with the WCAG tags, an empty `ACCEPTED` list, the pure filter (D2), and
  a function that runs axe on a page and returns the serious and critical `rule: targets` strings after the filter.
  Move `tests/e2e/a11y.spec.ts` and the version-menu block of `tests/e2e/versions.spec.ts` onto it, keeping their test
  names, page lists and setup. Verify, still on 4.13.0, that `uv run scripts/check.py` passes and the e2e test count
  matches main's, so the refactor changed nothing. Recorded 2026-10-29: on 4.13.0, `check: all gates passed`, 459
  unit and 265 e2e passed, the same 265 as main's last CI run (40815480960)
- [ ] 1.2 Add `tests/unit/e2e-axe.test.ts`. It runs the filter on hand-made results, one case per scenario in the
  spec's "An accepted axe finding names one rule on one node" requirement: an exact match is dropped; the same rule on
  another node is kept; another rule on the excepted node is kept; a changed selector is kept; a violation with the
  excepted node and another keeps the other; a violation left empty is dropped. It also fails when a file under
  `tests/e2e/` other than `axe.ts` imports `@axe-core/playwright`. Verify `npm run test:unit` passes. Then add
  `import AxeBuilder from '@axe-core/playwright'` to a copy of a spec file under `tests/e2e/`, verify the test fails
  and names that file, and remove the copy.

## 2. Move to 4.14 and accept the search button's finding

- [ ] 2.1 Run `npm install --save-exact @axe-core/playwright@4.14.0` (design D1). Verify `package.json` says
  `"4.14.0"` and that `git diff package-lock.json` moves only `@axe-core/playwright` and `axe-core`, to 4.14.0. With
  `ACCEPTED` still empty, run the e2e tests and verify the axe tests fail on `label-content-name-mismatch:
  button[data-open-modal=""]`, and on nothing else, in both builds. Record the counts. If anything else fails, stop
  and report it to the owner rather than adding an entry (design, Risks).
- [ ] 2.2 Add the one `ACCEPTED` entry: rule `label-content-name-mismatch`, target `button[data-open-modal=""]`, page
  `/docs/programme/what-is-troupe/`, and a `why` that cites withastro/starlight#4260 and the owner's decision of
  2026-10-29. Verify every axe test in both builds passes.
- [ ] 2.3 Add the reason test (design D4) to `tests/e2e/a11y.spec.ts`, named for exactly what it checks. Verify it
  passes. Then break each condition in turn, by editing the button in the page through `page.evaluate` in a
  throwaway copy of the test: change the aria-hidden span's text, remove `aria-keyshortcuts`, and add a word to the
  `<kbd>`. Verify each one fails with a message naming what it found, and delete the copy.
- [ ] 2.4 Add the stale-entry test (design D5), one per `ACCEPTED` entry, with its axe run in `tests/e2e/axe.ts`.
  Verify it passes. Then change the entry's target to `button[data-open-modal="x"]` locally and verify it fails,
  saying the entry is no longer reported and can be removed, and that the axe tests fail naming the real selector
  (spec, "The node's selector changes"). Restore it.

## 3. Verify

- [ ] 3.1 Run `uv run scripts/check.py` and verify it passes in full. Record its last line and the e2e count.
- [ ] 3.2 Open the pull request with `Closes #67`, saying it supersedes #58, and verify CI's `test` job passes.

## Workflow follow-up

- Act on Claude's review of the last push, then run `/opsx:archive` on the branch and add the pull request to the
  merge queue.
- After the merge, check #67 is closed and its card on the troupe roadmap board says Done, and comment on #67 with
  the pull request and the archived change.
- Check that Dependabot closed #58 as up to date. If it's still open a day later, close it with a comment that links
  the merged pull request (design, Migration Plan).
