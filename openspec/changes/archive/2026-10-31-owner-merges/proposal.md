# Proposal

## Why

CLAUDE.md's step 6 says the pull request "is added to the merge queue (`gh pr merge <n>`, or **Merge when ready**)",
which reads as an instruction to the agent. An agent following it on #78 (2026-10-31) ran `gh pr merge 78`, and the
guard refused it as `owner-only`: only the owner merges a pull request, queues it or turns on its auto-merge
(troupe-run/infrastructure `docs/development-workflow.md`, the `owner-only` rule). Infrastructure's CLAUDE.md already
says "The owner merges by rebase, through the merge queue". This is troupe-run/website#79; troupe's CLAUDE.md has the
same wording and is fixed separately (troupe-run/troupe#207).

## What Changes

- **CLAUDE.md's step 6 says the owner merges.** `/opsx:archive` still runs on the branch before merging. Then, once
  `test` has passed and every conversation is resolved, the agent asks the owner to merge. The owner adds the pull
  request to the merge queue, which lands it by rebase once `test` and `guard (workflow rules)` pass on the queued
  commit.
- **The emergency route stays, as the owner's.** `gh pr merge <n> --rebase --admin` skips the queue and is for
  emergencies, such as clearing a stuck queue. It's said to be the owner's, not a command for the agent.
- **The `contributing` spec changes with it:** the requirement names the owner's merge, and the scenario "An agent
  merges a pull request" keeps its name but now says the agent asks the owner and runs no merge command.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contributing`: "The contributor docs describe the workflow" says the owner merges through the merge queue, and its
  merge scenario says the agent asks the owner once the pull request is ready to merge, and runs no merge command.

## Impact

- `CLAUDE.md`, step 6.
- `openspec/specs/contributing/spec.md`, through this change's delta.
- No code, tests, workflows or guard files change. The guard already refuses the agent's `gh pr merge`; this only
  makes the docs agree with it.
