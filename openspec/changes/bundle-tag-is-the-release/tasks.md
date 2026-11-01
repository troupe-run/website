# Tasks

## 1. One definition of the release tag (design D1, D2)

- [ ] 1.1 Write unit tests for `scripts/release-tag.mjs` first (`tests/unit/release-tag.test.ts`), with tag names copied
  from troupe's real tags: `troupe-run-v0.1.0` reads as 0.1.0; `troupe-v0.1.0`, `troupe-v1.0.0-rc.1`,
  `troupe-runner-scripted-v0.1.0`, `troupe-vcs-git-v0.1.0` and `protocol-v0.1.0` read as not a release;
  `troupe-run-v1.0.0-rc.1` and `troupe-run-v01.0.0` throw, naming the tag and `troupe-run-vMAJOR.MINOR.PATCH`. Verify
  they fail before the module exists.
- [ ] 1.2 Add `scripts/release-tag.mjs` (prefix, accepted form, and the function that reads a tag), and verify 1.1's
  tests pass.
- [ ] 1.3 Use it in `scripts/troupe-docs-lib.mjs` (`chooseVersions`, `sync`'s release filter), replacing
  `RELEASE_PREFIX`, `RELEASE` and the comment that says `troupe-v` stands for the release. Update the unit tests that
  name `troupe-v*` as a release (`docs-versions`, `troupe-source`, `troupe-sync`, `troupe-layout`, `troupe-contract`)
  to `troupe-run-v*`, and add `chooseVersions` cases for each `versioned-docs` scenario in this change: core's tag
  higher than the bundle's, core only with no bundle, core's malformed tag ignored. Verify the new cases fail against
  the old prefix (run them before 1.3's code change) and pass after.
- [ ] 1.4 Use it in `scripts/roadmap-lib.mjs` in place of `RELEASE_TAG`, and update its header comment. Update
  `tests/unit/roadmap.test.ts` and `roadmap-source.test.ts` to bundle tags, and add cases for the `roadmap`
  scenarios "Core's tag disagrees with the bundle's" and "Core only, no bundle". Verify the new cases fail against the
  old pattern and pass after.
- [ ] 1.5 Add `troupe-run-v0.1.0` to `tests/unit/protocol-copies.test.ts`'s "another component's tag" case and to
  `protocol-sync.test.ts`'s tags, per the `protocol-schemas` delta, and verify `npm test` passes with
  `scripts/protocol-lib.mjs` unchanged (`git diff --stat` shows no change to it).

## 2. The fixture troupe tags the bundle (design D3, D4)

- [ ] 2.1 Rename `tests/fixtures/troupe-docs/`'s steps to `1-troupe-run-v0.1.0+troupe-v0.1.0+protocol-v0.1.0`,
  `2-troupe-run-v0.1.1+troupe-v0.3.0+protocol-v0.2.0` and `3-troupe-run-v0.2.0+protocol-v1.0.0` (`git mv`), change
  each page's "at troupe-v…" line to the step's bundle tag, and update the fixture's README. Update
  `scripts/troupe-fixture.mjs`'s doc comment and `tests/unit/troupe-fixture.test.ts`'s expected tags. Verify with
  `npm test`.
- [ ] 2.2 Update `tests/e2e/versions.spec.ts` to the bundle tags (its comments, the "at <tag>" texts and the
  "View source" URL `blob/troupe-run-v0.1.1/…`), and add one end-to-end test, named for what it checks, that the
  fixture's core tag `troupe-v0.3.0` publishes no version and marks no release: no `/docs/v0.3/`, the version menu lists
  v0.2 (latest) and v0.1, and `/status/` has 0.3.0 under "Milestones" with no date. Verify `npm run build:fixture` and
  the fixture end-to-end tests pass, then confirm the tests falsify the old code by temporarily setting the prefix back
  to `troupe-v` in `scripts/release-tag.mjs` and seeing them fail (revert before committing).
- [ ] 2.3 Change `scripts/rebuild-test.mjs`'s second rebuild to tag `troupe-run-v0.2.1` on `troupe-run-v0.2.0`'s commit,
  with its log line and comment, and verify the rebuild test passes and its status-line check names 0.2.1.

## 3. Docs and the whole check

- [ ] 3.1 Update `README.md`'s `TROUPE_DOCS` note to say the releases are `troupe-run-v*` for the docs and `protocol-v*`
  for the schemas, and verify `git grep -n "troupe-v" -- ':!openspec/changes/archive' ':!src/content/docs/docs'`
  finds `troupe-v` only where it means core's tag on purpose (the fixture's core tags, the ignore tests, and specs and
  design that name it as ignored).
- [ ] 3.2 Build against the real troupe (`npm run build`) and verify from its log and `dist/` that `/docs/` is built from
  `troupe-run-v0.1.0` (the manifest's current ref, and a "View source" or "Last updated" that matches `46f3e9a`'s
  docs), that the install page shows what troupe's `docs/` has at `troupe-run-v0.1.0`, and that `/status/` names 0.1.0
  as the latest release. Show the owner the built `/docs/` install page and `/status/`.
- [ ] 3.3 Verify `openspec validate bundle-tag-is-the-release --strict` and `uv run scripts/check.py` pass before the
  commit.

## Workflow follow-up

- Open the pull request as a draft (`Closes #82`), act on Claude's review, and mark it ready once it's clean.
- Archive the change on the branch, then ask the owner to merge.
- After the merge, check the deploy published `/docs/` from `troupe-run-v0.1.0` and `/status/` reads the bundle's tags
  on troupe.run; check #82 is closed and its card on the troupe roadmap says Done, and comment on it with the pull
  request and the archived change.
