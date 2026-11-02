# Tasks

## 1. The glossary row, in troupe

- [ ] 1.1 Open a troupe-run/troupe issue for an "audition" row in `docs/prompt-book/glossary.md`, with
  `--project "troupe roadmap"`. It cites troupe#232, troupe#233 and troupe-run/website#85, and quotes design D1's
  status text so the meaning matches it. Verify with `gh issue view <n> -R troupe-run/troupe --json projectItems`
  that it's on the board.

## 2. The guide row and its test

- [ ] 2.1 In `tests/unit/vocabulary.test.ts`, add the test in design D3, named for what it checks: "the brand guide's
  §6 lists audition as in use, dated 2026-11-01, for troupe init --audition from 0.2.0, apart from rehearsal, and
  the glossary has a row for it". Verify `npx vitest run tests/unit/vocabulary.test.ts` fails on it, naming audition's missing status.
- [ ] 2.2 Add design D1's row to `docs/brand-guide.md` §6, straight after rehearsal. Verify
  `npx vitest run tests/unit/vocabulary.test.ts` now fails only because the glossary has no audition row: the new
  test's guide checks pass, and the general test names audition as "kept in the guide, missing from the glossary".
  Record that output in the PR. Until troupe's row lands this is the expected result, so the commit says so
  (design D2).
- [ ] 2.3 Show the owner the row as text and get their agreement before the PR is marked ready. Verify by the
  owner's reply, recorded in the PR.

## 3. Landing

- [ ] 3.1 Once troupe's glossary row is on `main`, re-run `npm run docs:sync`, then `uv run scripts/check.py`, and
  verify both vocabulary tests pass and the check is clean. Then re-run `test` on the PR and verify it passes.
- [ ] 3.2 Raise design's open question on rehearsal's status with the owner, and record their answer in the PR.
  Verify by the owner's reply. Any change it leads to is a separate issue.

## Workflow follow-up

- Open the draft PR with `Closes #85`, saying it waits on troupe's glossary row. Act on Claude's review of the last
  push, and mark it ready only once task 3.1 passes.
- Archive the change on the branch, then ask the owner to merge.
- After the merge, comment on #85 with the PR and the archived change, and check that the issue is closed and its
  card says Done.
