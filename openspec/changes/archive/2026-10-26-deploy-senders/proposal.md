# Proposal

## Why

The deploy has two senders, and this repository names one. Since troupe-run/infrastructure#137 merged on
2026-10-25 (change `rebuild-site-on-milestones`, for infrastructure#124), infrastructure's `milestones-notice`
workflow dispatches `deploy.yml` on `main`, with no inputs, after every push to its `main` that changes
`tofu/milestones.json`, so `/status/` shows the new release list. `build-and-deploy` and the header of
`.github/workflows/deploy.yml` still say troupe's release workflow is the only dispatcher. Someone looking at a
dispatched Deploy run and asking where it came from would find one answer, and sometimes the wrong one (#47).

## What Changes

- `build-and-deploy`'s dispatch requirement says a dispatch comes from troupe or from infrastructure, and its name
  stops saying troupe's. Its scenarios cover a dispatch from each.
- A new requirement says what infrastructure sends and when, as "troupe sends the notice after every push to its
  main" does for troupe: after a push to its `main` that changes `tofu/milestones.json`, from a job that holds the
  `docs` environment, checks out nothing and uses only the `troupe-run-docs` App's token. A push that doesn't change
  the file sends nothing.
- The "two notices in quick succession" scenario covers two dispatches from either sender, not only troupe's.
- The header comment of `deploy.yml` names both senders, and so does the header comment of
  `tests/unit/deploy-workflow.test.ts`, which describes the same triggers.
- Documentation only (owner, 2026-10-25, on #47). No workflow behaviour changes: `on:`, the jobs' `if:`, the
  concurrency groups and every step stay as they are, and the deploy tests stay green without edits to their
  assertions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-and-deploy`: the dispatch requirement names both senders; a new requirement records infrastructure's
  milestones notice; the concurrency scenario covers either sender.

## Impact

- `openspec/specs/build-and-deploy/spec.md` (at archive), and comments in `.github/workflows/deploy.yml` and
  `tests/unit/deploy-workflow.test.ts`.
- No code, config, copy, test assertion, permission or GitHub setting changes. Nothing in troupe-run/troupe or
  troupe-run/infrastructure changes: infrastructure's `milestones-notice` workflow already cites this spec.
