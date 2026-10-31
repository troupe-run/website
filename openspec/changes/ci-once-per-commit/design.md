# Design

## Context

See proposal.md for why. What the change works with:

- `ci.yml` has one job, `test`, whose only run step is `uv run scripts/check.py`. It runs on `pull_request` (default
  types), a push to `main`, and `merge_group`. `test` and `guard (workflow rules)` are the ruleset's required checks,
  declared in troupe-run/infrastructure.
- `deploy.yml` builds on CI's `workflow_run` only when `conclusion == 'success'` and `event == 'push'`, and checks out
  the run's `head_sha`. It builds the site itself, so it needs nothing from CI's run but its conclusion.
- GitHub concludes a run `success` when some job ran and none failed, with others skipped. A run whose every job was
  skipped concludes `skipped`, which wouldn't start the deploy (measured in infrastructure, ci-once-per-commit design
  "Context"). So a push run that skips `test` needs a job that runs.
- A skipped required job counts as passed. That's harmless on a draft, which can't be merged or queued.
- infrastructure built the same thing in #234: a `changes` job that answers per event, and `scripts/queue_passed.py`,
  which asks for CI's `merge_group` run on the pushed commit. Live on 2026-10-31, its push run skipped the legs and
  concluded success, and its plan of `main` followed it.
- `claude-review.yml`, delivered from infrastructure, already doesn't start a review on `ready_for_review`, so marking
  ready runs CI only.
- `scripts/check.py`'s first gate runs `python -m unittest discover -s scripts/tests`, so standard-library Python
  tests there run in every check.

## Goals / Non-Goals

**Goals:**
- `test` runs once for each commit that lands through the queue, and not on a draft, while CI's run on `main` still
  concludes success so the deploy still follows it.
- The same shape as infrastructure's, so the three repositories read alike.

**Non-Goals:**
- Narrowing the check by changed paths on a pull request. This repository declares no scopes, and a ready pull request
  still runs the full check.
- Any change to `deploy.yml`, the required checks, or `claude-review.yml`.
- A concurrency group that cancels a superseded run. That's a separate saving, not decided in #227.

## Decisions

### D1. One small job ahead of `test` decides whether it runs

A new job, `changes` (shown as "does it need testing?"), runs on `pull_request` and `push`
(`github.event_name != 'merge_group'`) and answers one output, `test`, `true` or `false`:

| Event | `changes` | `test` |
| --- | --- | --- |
| merge group | skipped | runs, in full |
| push, the queue passed the commit | `test=false` | skipped |
| push, anything else | `test=true` | runs, in full |
| pull request, draft | `test=false` | skipped |
| pull request, ready | `test=true` | runs, in full |

`test` gets `needs: changes` and `if: ${{ !cancelled() && needs.changes.outputs.test != 'false' }}`. `!cancelled()`
keeps `test` from being skipped when `changes` was skipped (a merge group) or failed. A skipped or failed `changes`
leaves the output empty, so `test` runs. Only a `changes` that succeeded and said `false` skips it: failing safe costs
a run, never a missing check. `changes` runs on every push, so the push run is never all-skipped.

The output is named `test`, not infrastructure's `scope`, `check-args` and `guard`, because this repository has one
job and no scopes. *Alternative:* draft and queue conditions written into `test`'s own `if`. Rejected: the queue
lookup needs a step to run, so it needs a job, and a job that only answers keeps every decision in one place, as in
infrastructure.

### D2. Ask for CI's merge-queue run on the commit

On a push, `changes` asks GitHub for CI's `merge_group` runs on `github.sha`:
`gh run list --workflow ci.yml --commit <sha> --event merge_group --json status,conclusion`. Any completed run that
succeeded counts, since a re-run tested the same tree. A pull request's run doesn't count: it tested the pull request
merged onto an older `main`, not the commit that landed. This is infrastructure's design D1.

### D3. The lookup never turns `main` red

A failed `changes` on a push would make the run conclude `failure`, and the deploy wouldn't follow it. So the lookup
always exits 0. A read that fails, an answer it can't parse, or a run status it doesn't know answer `test=true` with a
`::warning::` saying why, and `test` decides the run. A run still waiting (`queued`, `in_progress`, `waiting`,
`requested`, `pending`) is polled every 10 seconds for up to 2 minutes, then answers `test=true` with a warning. The
queue lands a commit only after `test` passed on it, so its run has normally completed by the time the push asks.

These answers aren't "absent" falling through to a default: each one that isn't a clear success runs everything and
says why, which is the safe outcome.

### D4. A standard-library Python script, like infrastructure's

`scripts/queue_passed.py --repository <owner/repo> --sha <sha>` prints `test=false` or `test=true` for
`$GITHUB_OUTPUT`, and its reason on stderr. It follows infrastructure's `scripts/queue_passed.py` line for line apart
from the output: standard library and `gh` only, runnable with the runner's `python3` before uv or Node is set up, and
a `gh` callable, clock and sleep injected for tests. Its tests live in `scripts/tests/test_queue_passed.py`, so the
check's first gate runs them. On a push, `changes` checks out the commit (to have the script) and gets
`actions: read`, on top of `contents: read`.

*Alternatives:* a Node script, like most of `scripts/`. Rejected: it would differ from infrastructure's for no gain,
and the Python one needs nothing installed. Infrastructure delivering the script, as it delivers the guard. Rejected:
the guard's delivery is for the guard's files, and the outputs differ per repository.

### D5. The draft answer is a step, and `ready_for_review` is a trigger

The draft answer is a short step in `changes` that runs when `github.event.pull_request.draft` is true: a
`::notice::` that `test` runs once the pull request is marked ready, and `test=false`. It has no logic worth a
script, and the workflow's unit tests pin it. A ready pull request's step writes `test=true`.

`pull_request` names its types: `opened, synchronize, reopened, ready_for_review`. GitHub's defaults are written out
with it, since naming any type replaces the default list. The `ready_for_review` payload has `draft: false`, so that
run is an ordinary ready one.

### D6. CLAUDE.md says the draft-then-ready step

Steps 4 and 5 of "How work happens here" follow infrastructure's CLAUDE.md: step 4 opens the pull request as a draft
(`gh pr create --draft`), and says Claude reviews it while CI's `test` waits for ready. Step 5 adds that once the
review of the last push leaves no must-fix or decision open, the pull request is marked ready (`gh pr ready <n>`),
which runs CI. Step 6's merge-queue wording stays. The header comment of `ci.yml` says what each event runs.

## Risks / Trade-offs

- [The commit that lands differs from the one the queue tested, for example if GitHub's merge method changes] → No
  `merge_group` run exists on the landed SHA, so `test` runs in full. It only costs time.
- [A flake the second run used to catch by accident isn't seen] → Accepted in #227. Flakes are hunted on purpose, not by
  repeating runs.
- [An agent marks ready before the review is clean] → It costs one run. A draft can't merge, and the ruleset blocks a
  merge with unresolved conversations.
- [A draft's `test` reads as passed] → A draft can't merge or join the queue, and `ready_for_review` runs it again.
  The notice says why it was skipped.
- [`changes` fails for a reason outside the script, such as the runner] → `test` still runs, but the push run
  concludes failure and doesn't deploy. That's today's outcome for any failed run on `main`: the next merge, or a
  re-run, deploys.

## Migration Plan

This change's own pull request is the live check. A `pull_request` run uses the workflow on the pull request's branch,
and the push run uses the one on `main` after the merge.

1. Open it as a draft: CI's `changes` runs with the draft notice, `test` is skipped, and the run concludes success.
2. Once the review is clean, mark it ready: `test` runs the check, and no review starts.
3. The queue's run tests the commit in full. After it lands, CI's push run on `main` logs that the queue passed it,
   skips `test`, concludes success, and the deploy publishes the site.

Rollback is a revert through the same path. Without `changes`, every event runs `test` again.
