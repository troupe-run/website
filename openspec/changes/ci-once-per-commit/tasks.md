# Tasks

## 1. The merge-queue lookup

- [x] 1.1 Write `scripts/tests/test_queue_passed.py` first, with a fake `gh`, clock and sleep, covering: a successful
  merge-queue run answers `test=false`; no runs, and only failed or cancelled runs, answer `test=true`; a run still
  waiting is polled and then succeeds; a run that's still waiting after two minutes, a failed read, output that isn't
  JSON or isn't a list of runs, and an unknown status each answer `test=true` with a `::warning::` naming why; the
  `gh run list` call names `ci.yml`, the commit and `--event merge_group`; and the script exits 0 in every case.
  Verify they fail before the script exists.
- [x] 1.2 Write `scripts/queue_passed.py` (design D2 to D4), following troupe-run/infrastructure's
  `scripts/queue_passed.py` with this repository's one output, and verify `python3 -m unittest discover -s
  scripts/tests` passes.

## 2. CI decides once per event

- [x] 2.1 Update `tests/unit/ci-workflow.test.ts` first: `pull_request` types are exactly `opened`, `synchronize`,
  `reopened`, `ready_for_review`; the jobs are `changes` and `test`; `changes` doesn't run on a merge group, has
  `actions: read`, answers `test=false` on a draft with a notice, runs `scripts/queue_passed.py` with the repository
  and `github.sha` on a push and only then checks out, and answers `test=true` on a ready pull request; `test` needs
  `changes`, runs unless `changes` said `false` (and when `changes` was skipped or failed), and its only run step is
  still `uv run scripts/check.py`. Verify `npx vitest run tests/unit/ci-workflow.test.ts` fails on the current
  `ci.yml`.
- [x] 2.2 Change `.github/workflows/ci.yml` (design D1, D5): the types, the `changes` job and `test`'s `needs` and
  `if`, and a header comment saying what each event runs. Verify the workflow tests pass and
  `uv run scripts/check.py` passes.

## 3. The workflow docs

- [x] 3.1 Update CLAUDE.md's steps 4 and 5 (design D6): a draft pull request (`gh pr create --draft`) that Claude
  reviews while `test` waits, and `gh pr ready <n>` once the review of the last push leaves no must-fix or decision
  open. Verify by reading it against infrastructure's `docs/development-workflow.md` ("A pull request opens as a
  draft…") and against each scenario of the contributing delta spec.

## 4. Live check on this pull request

- [x] 4.1 Open the pull request as a draft and verify CI's run: `changes` logs the draft notice, `test` is skipped,
  and the run concludes success (`gh run view <id>`).
- [x] 4.2 Once Claude's review of the last push is clean, `gh pr ready <n>` and verify `test` runs the check and
  passes, and no review run starts.

## Workflow follow-up

- Archive the change on the branch, then add the pull request to the merge queue.
- After the merge, verify CI's push run on `main` logs that the merge queue passed the commit, skips `test`, and
  concludes success, and that the deploy built and published that commit. Record both run links in the issue comment
  that closes #77.
