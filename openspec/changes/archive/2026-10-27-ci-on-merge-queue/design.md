# Design

## Context

`ci.yml` has one job, `test`, which runs `uv run scripts/check.py` and nothing else (spec: quality-check). It has no
path filter, no `changes` job and no concurrency group, and nothing in `scripts/check.py` or the tests it runs reads the
event, the ref or the branch name. So the job behaves the same on any commit it's given.

`deploy.yml` starts on `workflow_run` of CI, filtered to `branches: [main]`, and its `build` job runs only when that run
passed and its event was `push` (pinned in `tests/unit/deploy-workflow.test.ts`). A merge-queue run's branch is
`gh-readonly-queue/main/pr-<n>-<sha>` and its event is `merge_group`, so both filters already exclude it.

infrastructure's probe (merge-queue design, "Probe results") found that the queue's push to `gh-readonly-queue/...`
also starts `push` workflows. CI's `push` trigger is limited to `main`, so it doesn't.

## Goals / Non-Goals

**Goals:**
- `test` reports on every merge-queue commit, from a full run of the check.
- A test fails if CI loses any of its three triggers or its job name.

**Non-Goals:**
- Running fewer gates in the queue. The queue's commit is a tree no pull request tested, which is the point of it.
- Saving the second CI run after the queue lands (see Risks).

## Decisions

### D1. A bare `merge_group:` trigger

`on:` gains `merge_group:` with no `types`. `checks_requested` is the event's only type, so naming it adds nothing;
infrastructure's `guard.yml` names it, and either form starts the workflow on the same events.

**Alternative: `merge_group: types: [checks_requested]`**, to match guard.yml. Equivalent today. The bare form matches
the issue's wording and the other bare triggers in this file.

### D2. Nothing in the job changes

No `if:` on the event, no different steps, no concurrency group. The check already runs every gate unconditionally,
so "in full, as on a push to `main`" needs no code. A concurrency group with `cancel-in-progress` would be wrong here:
the queue may run several entries at once, and each must report.

### D3. The deploy isn't touched; the spec records why a queue run can't deploy

The deploy's `workflow_run` branch filter and its `event == 'push'` condition each keep a queue run from deploying.
The new build-and-deploy requirement states the behaviour, and the existing deploy test is what checks it: its
"builds only after CI passed on a push" test pins the condition exactly. No new deploy test is needed.

**Alternative: add `merge_group` to the deploy test explicitly.** It would restate the existing exact-match assertion.

### D4. A unit test for CI's triggers

`tests/unit/ci-workflow.test.ts` parses `ci.yml` as `deploy-workflow.test.ts` parses `deploy.yml`, and checks that
`on` has `pull_request`, `push` limited to `branches: [main]` and `merge_group`, that the job is named `test`, and that
its only `run` step is `uv run scripts/check.py`. Run against main before this change, only the `merge_group`
assertion fails, so the test is seen to fail for the right reason before the trigger is added. It runs in the existing unit-test gate, so no gate changes.

## Risks / Trade-offs

- [Each merge runs the full check twice: once on the queue's commit, again on the push to `main`.] → The push run is
  what starts the deploy, and is the same tree, so it should pass. Accepted: it keeps the deploy's trigger as it is.
  Dropping the push run would need the deploy to follow the queue instead, a bigger change for no gain in safety.
- [The queue's commit is built with whatever troupe's docs are at that moment, and so is the later push run.] → Same
  as today between a pull request's run and the push run. A troupe change in between can still fail the push run,
  which stops the deploy, and the live site stays up.
- [The queue is turned on before this merges.] → infrastructure's design D7 orders it after. If it happened, the
  queue would wait for `test` and land nothing until it timed out; nothing would break.

## Migration Plan

Merge this by the usual rebase. Until infrastructure turns website's queue on, nothing sends `merge_group`, so this
changes nothing. infrastructure's follow-up then turns it on; the first queued pull request is the live proof. Rollback
is reverting the trigger after infrastructure turns the queue off.
