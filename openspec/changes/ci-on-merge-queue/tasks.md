# Tasks

## 1. CI runs on merge-queue commits

- [x] 1.1 Add `tests/unit/ci-workflow.test.ts` (design D4): `ci.yml`'s `on` has `pull_request`, `push` with
  `branches: [main]` and `merge_group`; the job is named `test`; its only `run` step is `uv run scripts/check.py`. Each
  test's name says what its body checks. Verify with `npx vitest run tests/unit/ci-workflow.test.ts` that only the
  `merge_group` test fails, naming the missing trigger.
- [x] 1.2 Add `merge_group:` to `.github/workflows/ci.yml`'s triggers (design D1, D2), and extend its comment to say the
  queue's commit gets the full check. Verify `npx vitest run tests/unit/ci-workflow.test.ts` passes.
- [x] 1.3 Verify the deploy still can't start from a queue run: `npx vitest run tests/unit/deploy-workflow.test.ts`
  passes unchanged, and its "builds only after CI passed on a push" test is the one that pins it (design D3).
- [x] 1.4 Run `uv run scripts/check.py` and verify it exits 0, then confirm on the pull request that CI's `test` passes.

## Workflow follow-up

- Open the pull request with `Closes #69`.
- Archive the change on the branch before merging, so the specs land with the code.
- After the merge, comment on #69 with the pull request and the archived change, and check the issue is closed and its
  roadmap card says Done.
- Tell infrastructure's follow-up (merge-queue design D7 step 4) that website's CI is ready for the queue.
