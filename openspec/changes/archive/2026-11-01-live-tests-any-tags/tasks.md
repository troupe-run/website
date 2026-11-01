# Tasks

## 1. Two troupe checkouts to build from

On main the live build stops at troupe's component tags (`troupe-vcs-files-v0.1.0` and others), which the docs sync
reads as malformed `troupe-v*` tags. That's #82's to fix (design, Non-Goals). So this change is verified against local
clones of troupe-run/troupe, built with `TROUPE_DOCS`, and no site code is touched.

- [x] 1.1 In the scratchpad, clone troupe-run/troupe twice and delete the component tags locally in both, keeping
  `troupe-v0.1.0`. Keep `protocol-v0.1.0` in the first clone ("with release") and delete it in the second
  ("no release"). Verify with `git tag -l` in each, and confirm that `TROUPE_DOCS=<clone> npm run build` succeeds for
  both and that the manifest's `protocol.releases` is `['0.1.0']` and `[]`. If `TROUPE_DOCS` doesn't read tags from
  the checkout, stop and say so before choosing another route.
- [x] 1.2 On the "with release" build, run the current `tests/e2e/protocol.spec.ts`
  (`npx playwright test --project=chromium tests/e2e/protocol.spec.ts`), and verify it fails exactly as #84 says: the
  release-list test and the 404 test, and nothing else.

## 2. The live /protocol/ tests read the manifest

- [x] 2.1 Rewrite `tests/e2e/protocol.spec.ts` (design D1 to D4): load `src/generated/troupe-docs.json`'s `protocol`
  as `docs.spec.ts` loads the manifest. Keep the four-kinds-of-URL check and the heading, sidebar and marker tests. The
  release-list test takes the branch the manifest gives (D2). There's one `$id` test for each manifest copy (D3). The
  404 test uses the next major and the next patch, and asserts that neither is a manifest copy (D4). Update the header
  comment to say the live build is troupe as it is, with or without releases. Verify that
  `npx playwright test --project=chromium tests/e2e/protocol.spec.ts` passes on the "with release" build and on the
  "no release" build, and that the report lists `0.1.0/` among the copies tested only on the first.
- [x] 2.2 Check that the tests can fail, on the "with release" build. Temporarily change `latest` in
  `src/content/copy/protocol.md` and rebuild, and verify the release-list test fails, naming the list it expected. Then
  temporarily break one copy's `$id`, and verify that copy's test fails, naming the prefix. Revert both, and verify
  `git status` shows only `tests/e2e/protocol.spec.ts` changed. (Done by skipping the id rewrite for `0.1.0/` in
  `scripts/protocol-lib.mjs`'s `writeProtocol`, not by editing `dist/`: the e2e preview rebuilds `dist/` before it
  serves it.)
- [x] 2.3 Run the whole live suite (`npx playwright test --project=chromium`) on the "with release" build, and verify
  that no other test fails because troupe now has releases. Any test that does is in scope (#84, "any other live-build
  test"): fix it the same way, and add a task here for it.

## 3. The check

- [x] 3.1 Run `uv run scripts/check.py` and record the result. On main it's expected to stop at the build, on
  `troupe-vcs-files-v0.1.0`, until #82's fix is in. If it fails anywhere else, fix that before committing. Commit as
  `test(protocol): check the live /protocol/ against the releases the build recorded` once the check gets as far as
  the build. If the guard needs the full check to pass, raise it with the owner rather than working around it.
  Result (2026-11-01, on bundle-tag-is-the-release with #82's fix): every gate passed, 492 unit tests and 270
  end-to-end tests. Committed in one commit with #82's change, since neither passes the check alone and the guard tests
  the whole tree on each commit.

## Workflow follow-up

- Open the draft pull request (`Closes #84`), and ask the owner how it lands with #82 (design, Open questions): either
  #82's branch builds on this one and one pull request lands both, or one of them merges with `--admin`.
- Act on Claude's review, mark it ready, archive on the branch, and ask the owner to merge.
- After the merge, check that #84 is closed and its card is Done, and comment with the pull request and the archived
  change.
