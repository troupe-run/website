# Proposal

## Why

Two steps of website's workflow have changed in troupe-run/infrastructure, and website's own instructions don't say
so yet:

- **The merge queue** (#71). infrastructure#197 turned website's merge queue on: `main`'s ruleset now has a
  `merge_queue` rule (rebase, all green), and a pull request lands only after `test` and `guard (workflow rules)`
  pass on the commit the queue tests. CLAUDE.md's step 5 still says only "It's merged by rebase".
- **Claude's review** (#72). infrastructure#194 makes every finding of Claude's review a conversation labelled
  **must-fix**, **nit** or **decision**, and the ruleset needs every conversation resolved before a merge. Each
  change's tasks come from website's own `openspec/config.yaml` context, which infrastructure can't edit, so nothing
  plans the step that acts on the review.

The org's contributing guide and infrastructure's CLAUDE.md already say both. One change closes #71 and #72, in one
pull request, because both edit the same few lines of the workflow.

## What Changes

- `CLAUDE.md`'s "How work happens here":
  - A new step, between the pull request and the archive, says Claude's review is acted on: wait for the review of
    the last push, fix or answer each finding, resolve only nits, and raise decisions and disputed must-fixes with the
    owner. A merge needs every conversation resolved. It links the org's development-workflow guide for the tiers
    rather than restating them.
  - The merge step says the pull request is added to the merge queue, which lands it by rebase once `test` and
    `guard (workflow rules)` pass on the queued commit. `gh pr merge <n>` (or **Merge when ready**) queues it;
    `gh pr merge <n> --rebase --admin` skips the queue and is for emergencies only, such as clearing a stuck queue.
- `openspec/config.yaml`'s `context` gains infrastructure's line under **Working**: before archiving, wait for
  Claude's review of the last push and act on each finding by its tier. From then on every `/opsx:propose` plans it.
- The `contributing` spec says both.

Out of scope: the queue's settings, the ruleset and the review workflow, which are infrastructure's. The README, which
links the org's guide for the workflow and doesn't restate it (spec: contributing).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contributing`: "The contributor docs describe the workflow" adds acting on Claude's review before the archive and
  merging through the merge queue. A new requirement says `openspec/config.yaml`'s context carries the review step, so
  every proposed change plans it.

## Impact

- `CLAUDE.md` and `openspec/config.yaml`. No page, component, build step, test or CI workflow changes. Both files are
  in `scripts/check-paths.toml`'s `skip` group, so their commits skip the local check; CI runs it in full.
- This change itself is the first to land through the queue with the review step written down, so its own tasks
  follow both.
- After the merge: #71 and #72 are closed by the pull request, and infrastructure#194 is commented on with it (#72's
  "Done when").
