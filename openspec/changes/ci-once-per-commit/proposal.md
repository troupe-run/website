# Proposal

## Why

CI runs the full check twice on every commit that lands through the merge queue: once on the queue's commit, and
again on the push to `main`, though the commit the queue passed is the one that lands. It also runs on every push to
a pull request while Claude's review is still finding things to change. troupe-run/infrastructure#227 decided (owner,
2026-10-30) that CI runs once for each version of the code that matters, in troupe, infrastructure and website. This
is website's part, troupe-run/website#77. The saving here is small, since the check takes 2 to 3 minutes, but the
three repositories work the same way. infrastructure has already built its part (#232, merged in #234), and its
`docs/development-workflow.md` now says a pull request opens as a draft and is marked ready once its review is clean.

## What Changes

- **A push to `main` that the merge queue already passed skips `test`.** CI asks GitHub whether CI's `merge_group`
  run on that exact commit succeeded. If it did, `test` is skipped and the run still concludes success, so the deploy,
  which follows only a successful CI run on a push to `main`, still publishes. A commit that reaches `main` any other
  way, such as the App's guard deliveries, has no such run and is tested in full. A lookup that fails or can't be read
  tests in full too, and never turns `main` red.
- **A draft pull request runs no `test`.** CI runs on `ready_for_review` as well, so marking a draft ready runs the
  check. A draft can't join the merge queue, so a skipped `test` on one can't let anything merge.
- **The merge queue's commit is tested as today**, in full.
- **CLAUDE.md's pull request steps match the org's workflow:** open the pull request as a draft
  (`gh pr create --draft`), act on Claude's review, and mark it ready (`gh pr ready <n>`) once the review of its last
  push leaves no must-fix or decision open. Then CI runs, and the pull request goes to the merge queue.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: "CI runs the same check" changes. `test` runs the check on a pull request that's ready for review,
  on every merge-queue commit, and on a push to `main` unless the queue passed that commit. It's skipped on a draft
  and on a push the queue passed.
- `build-and-deploy`: "Only CI on a push to main starts a deploy" gains the case where `test` was skipped because the
  queue passed the commit: the run still succeeds and the deploy still publishes.
- `contributing`: "The contributor docs describe the workflow" adds the draft-then-ready step.

## Impact

- `.github/workflows/ci.yml`: the `pull_request` trigger's types, a new job ahead of `test` that decides whether it
  runs, and the header comment.
- A new standard-library script that looks up CI's merge-queue run on a commit, with its tests under `scripts/tests/`.
  It follows infrastructure's `scripts/queue_passed.py`.
- `tests/unit/ci-workflow.test.ts`: the pins on CI's triggers and jobs.
- `CLAUDE.md`, steps 4 to 6.
- Nothing changes in infrastructure. The required checks stay `test` and `guard (workflow rules)`, and a skipped
  required job counts as passed. `deploy.yml` doesn't change, and `claude-review.yml`, delivered from infrastructure,
  already doesn't start a review on `ready_for_review`.
