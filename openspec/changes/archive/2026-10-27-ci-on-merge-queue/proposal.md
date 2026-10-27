# Proposal

## Why

troupe-run/infrastructure is putting a merge queue in front of `main` in every governed repository (infrastructure#169,
its change `merge-queue`), so `main` only ever holds a combination its required checks passed on. A queue lands a pull
request only when every required check reports on the commit it tested. website requires `test` and `guard (workflow
rules)`. The guard already runs on `merge_group` (delivered from infrastructure), but CI's `test` runs only on
`pull_request` and on a push to `main`, so a queue turned on today would wait for `test` until it timed out and land
nothing. infrastructure turns website's queue on only after this merges (its design D6, D7). Issue: #69.

## What Changes

- `.github/workflows/ci.yml` adds `merge_group:` to its triggers, so the `test` job runs `uv run scripts/check.py` on
  every commit the queue tests, in full, exactly as on a push to `main`. The job keeps its name, `test`.
- A unit test pins CI's triggers: `pull_request`, `push` to `main`, and `merge_group`, and the job named `test`. Today
  nothing fails if a trigger is dropped.
- The deploy is unchanged. It starts only after CI passes on a **push** to `main`, so a queue's CI run publishes nothing.
  That's true today but written down only in a test; this change puts it in the spec.
- Until infrastructure turns website's queue on, nothing sends `merge_group`, so the new trigger does nothing.

Out of scope: turning the queue on, the ruleset, `allow_auto_merge` and the guard's handling of queue branches. All of
them are infrastructure's (CLAUDE.md, openspec/config.yaml).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: "CI runs the same check" extends from every pull request and push to `main` to every merge-queue
  commit.
- `build-and-deploy`: a new requirement that only CI on a push to `main` starts a deploy, so neither a pull request's nor
  a merge queue's CI run publishes anything.

## Impact

- `.github/workflows/ci.yml`: one trigger added.
- `tests/unit/`: a new test for `ci.yml`'s triggers and job name; `deploy-workflow.test.ts` already pins the deploy's
  `if:` and needs no change.
- CI time: each merge runs the full check once more, on the queue's commit. Accepted with infrastructure#169's option 1.
- After merge: infrastructure's follow-up turns website's queue on (its design D7 step 4). Nothing here depends on it.
